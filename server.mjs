import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;
// On Linux cloud (HuggingFace), /app may be read-only — use /tmp for writable storage
const DATA_DIR = process.platform === 'linux' ? '/tmp' : process.cwd();
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

let llama = null;
let currentModelFileName = null;
let currentModel = null;
let currentContext = null;
let currentSession = null;
let currentChatId = null;

// Download State Tracker
let activeDownload = {
    filename: null,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    status: 'idle', // 'idle' | 'downloading' | 'completed' | 'error'
    error: null
};

// ----------------- Helper Operations -----------------
async function getHistoryData() {
    try {
        const data = await fsp.readFile(HISTORY_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function saveHistoryData(data) {
    try {
        await fsp.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('> Warning: Could not save history:', e.message);
    }
}

async function getAgentsDir() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const settings = JSON.parse(await fsp.readFile(SETTINGS_FILE, 'utf8'));
            if (settings.agentsDir) return settings.agentsDir;
        }
    } catch {}

    const pathsToTry = [
        'E:\\AGENTS',
        'D:\\agents',
        path.join(process.cwd(), 'models')
    ];

    for (const p of pathsToTry) {
        try {
            if (fs.existsSync(p)) return p;
        } catch {}
    }

    // Default fallback
    const fallback = path.join(process.cwd(), 'models');
    if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
}

// ----------------- Model Loader -----------------
async function loadModel(modelFileName) {
    if (currentModelFileName === modelFileName && currentSession) return;
    const agentsDir = await getAgentsDir();
    console.log(`\n> Loading Model: ${modelFileName} from ${agentsDir}`);
    
    if (!llama) {
        llama = await getLlama();
    }
    
    if (currentModel) {
        await currentModel.dispose?.();
        currentModel = null;
        currentContext = null;
        currentSession = null;
    }

    const modelPath = path.join(agentsDir, modelFileName);
    currentModel = await llama.loadModel({ modelPath });
    currentContext = await currentModel.createContext();
    currentModelFileName = modelFileName;
    console.log("> Model loaded successfully!");
}

// ----------------- API Endpoints -----------------

// Λίστα Μοντέλων
app.get('/models', async (req, res) => {
    try {
        const agentsDir = await getAgentsDir();
        if (!fs.existsSync(agentsDir)) {
            return res.json([]);
        }
        const files = await fsp.readdir(agentsDir);
        res.json(files.filter(f => f.toLowerCase().endsWith('.gguf')));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Settings Getter / Setter
app.get('/settings', async (req, res) => {
    const agentsDir = await getAgentsDir();
    res.json({ agentsDir });
});

app.post('/settings', async (req, res) => {
    const { agentsDir } = req.body;
    if (!agentsDir) return res.status(400).json({ error: 'Missing agentsDir' });
    try {
        await fsp.mkdir(agentsDir, { recursive: true });
        await fsp.writeFile(SETTINGS_FILE, JSON.stringify({ agentsDir }, null, 2));
        res.json({ success: true, agentsDir });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Λίστα Chat
app.get('/history', async (req, res) => {
    const history = await getHistoryData();
    const list = history.map(chat => ({ id: chat.id, title: chat.title, timestamp: chat.timestamp }));
    list.sort((a,b) => b.timestamp - a.timestamp);
    res.json(list);
});

// Δεδομένα συγκεκριμένου Chat
app.get('/history/:id', async (req, res) => {
    const history = await getHistoryData();
    const chat = history.find(c => c.id === req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
});

// Διαγραφή Chat
app.delete('/history/:id', async (req, res) => {
    let history = await getHistoryData();
    history = history.filter(c => c.id !== req.params.id);
    await saveHistoryData(history);
    if (currentChatId === req.params.id) {
        currentChatId = null;
        currentSession = null;
    }
    res.json({ success: true });
});

app.post('/reset', (req, res) => {
    currentChatId = null;
    if (currentContext) {
        currentSession = new LlamaChatSession({ contextSequence: currentContext.getSequence() });
    }
    res.json({ success: true });
});

// Chat Send Endpoint
app.post('/chat', async (req, res) => {
    const { prompt, model: requestedModel, chatId, fileContext } = req.body;
    if (!prompt || !requestedModel) return res.status(400).json({ error: 'Missing prompt or model!' });

    try {
        await loadModel(requestedModel);
        
        let history = await getHistoryData();
        let chat = history.find(c => c.id === chatId);
        
        if (chatId && currentChatId !== chatId) {
            currentSession = new LlamaChatSession({ contextSequence: currentContext.getSequence() });
        }
        
        if (!currentSession) {
            currentSession = new LlamaChatSession({ contextSequence: currentContext.getSequence() });
        }
        
        currentChatId = chatId;

        let augmentedPrompt = prompt;
        if (fileContext) {
            augmentedPrompt = `[FILE CONTEXT]:\n${fileContext}\n\n[USER QUESTION]:\n${prompt}`;
        }

        if (!chat) {
            chat = {
                id: Date.now().toString(),
                title: prompt.substring(0, 35) + (prompt.length > 35 ? '...' : ''),
                messages: [],
                timestamp: Date.now()
            };
            currentChatId = chat.id;
            history.push(chat);
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        res.write(`data: ${JSON.stringify({ chatId: chat.id })}\n\n`);

        process.stdout.write(`AI Response: `);
        let botResponse = "";

        await currentSession.prompt(augmentedPrompt, {
            onTextChunk(chunk) {
                process.stdout.write(chunk);
                botResponse += chunk;
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        });

        // Save history
        chat.messages.push({ role: 'user', content: prompt });
        chat.messages.push({ role: 'model', content: botResponse });
        chat.timestamp = Date.now();
        await saveHistoryData(history);

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (e) {
        console.error("Error in Chat:", e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
        else res.end();
    }
});

// ----------------- Model Downloader -----------------
app.post('/download', async (req, res) => {
    const { repoId, filename } = req.body;
    if (!repoId || !filename) return res.status(400).json({ error: 'Missing repoId or filename' });

    if (activeDownload.status === 'downloading') {
        return res.status(400).json({ error: 'A download is already in progress.' });
    }

    const agentsDir = await getAgentsDir();
    const outputPath = path.join(agentsDir, filename);

    activeDownload = {
        filename,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'downloading',
        error: null
    };

    const downloadUrl = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
    
    // Background download execution
    const runDownload = (url) => {
        const parsedUrl = new URL(url);
        const reqStream = https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                runDownload(response.headers.location);
                return;
            }
            if (response.statusCode !== 200) {
                activeDownload.status = 'error';
                activeDownload.error = `HTTP Error Code ${response.statusCode}`;
                return;
            }

            const total = parseInt(response.headers['content-length'], 10) || 0;
            activeDownload.totalBytes = total;
            
            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            let downloaded = 0;
            response.on('data', (chunk) => {
                downloaded += chunk.length;
                activeDownload.downloadedBytes = downloaded;
                if (total > 0) {
                    activeDownload.progress = Math.min(99.9, (downloaded / total) * 100);
                }
            });

            fileStream.on('finish', () => {
                fileStream.close();
                activeDownload.status = 'completed';
                activeDownload.progress = 100;
            });

            fileStream.on('error', (err) => {
                activeDownload.status = 'error';
                activeDownload.error = err.message;
            });
        });

        reqStream.on('error', (err) => {
            activeDownload.status = 'error';
            activeDownload.error = err.message;
        });
    };

    try {
        runDownload(downloadUrl);
        res.json({ success: true, message: 'Download started.' });
    } catch (e) {
        activeDownload.status = 'error';
        activeDownload.error = e.message;
        res.status(500).json({ error: e.message });
    }
});

app.get('/download/status', (req, res) => {
    res.json(activeDownload);
});

// Auto-download default model on boot if directory is empty
async function autoDownloadDefaultModel() {
    const agentsDir = await getAgentsDir();
    try {
        const files = await fsp.readdir(agentsDir);
        const ggufs = files.filter(f => f.toLowerCase().endsWith('.gguf'));
        if (ggufs.length === 0) {
            console.log("> No local GGUF models found. Initializing background download of Dolphin-3B model...");
            const repoId = "Bartowski/Dolphin3.0-Llama3.2-3B-GGUF";
            const filename = "Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf";
            const outputPath = path.join(agentsDir, filename);
            const downloadUrl = `https://huggingface.co/${repoId}/resolve/main/${filename}`;

            const runDownload = (urlStr) => {
                // Always resolve relative URLs to absolute
                let resolvedUrl;
                try {
                    resolvedUrl = new URL(urlStr);
                } catch (_) {
                    // Relative URL — resolve against huggingface.co
                    resolvedUrl = new URL(urlStr, 'https://huggingface.co');
                }

                const transport = resolvedUrl.protocol === 'https:' ? https : http;
                const reqStream = transport.get(resolvedUrl.toString(), (response) => {
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        response.resume(); // consume response to free socket
                        runDownload(response.headers.location);
                        return;
                    }
                    if (response.statusCode === 200) {
                        const fileStream = fs.createWriteStream(outputPath);
                        response.pipe(fileStream);
                        fileStream.on('finish', () => {
                            fileStream.close();
                            console.log(`> Auto-download completed! Saved: ${filename}`);
                        });
                        fileStream.on('error', (err) => {
                            console.error("> File write failed:", err.message);
                        });
                    } else {
                        console.error(`> Auto-download: unexpected status ${response.statusCode}`);
                    }
                });
                reqStream.on('error', (err) => {
                    console.error("> Auto-download failed:", err.message);
                });
            };
            runDownload(downloadUrl);
        }
    } catch (e) {
        console.error("> Auto-download check failed:", e.message);
    }
}

app.listen(PORT, async () => {
    const dir = await getAgentsDir();
    console.log(`\n==============================================`);
    console.log(`🚀 Claude Local AI Server running successfully!`);
    console.log(`🌐 Port: http://localhost:${PORT}`);
    console.log(`📁 Model Directory: ${dir}`);
    console.log(`==============================================\n`);
    await autoDownloadDefaultModel();
});
