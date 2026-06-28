document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Chat views
    const modelSelect = document.getElementById('modelSelect');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesList = document.getElementById('messagesList');
    const chatContainer = document.getElementById('chatContainer');
    const greetingView = document.getElementById('greetingView');
    const quickActions = document.getElementById('quickActions');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.getElementById('newChatBtn');

    // Sidebar panels
    const navChats = document.getElementById('navChats');
    const navModels = document.getElementById('navModels');
    const chatWrapper = document.getElementById('chatContainer');
    const inputAreaWrapper = document.getElementById('inputAreaWrapper');
    const modelsHubView = document.getElementById('modelsHubView');

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // File elements
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('mdFileInput');
    const fileAttachmentBadge = document.getElementById('fileAttachmentBadge');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const removeFileBtn = document.getElementById('removeFileBtn');

    // Models Hub Elements
    const settingDirInput = document.getElementById('settingDirInput');
    const saveDirBtn = document.getElementById('saveDirBtn');
    const hfRepoInput = document.getElementById('hfRepoInput');
    const hfFilenameInput = document.getElementById('hfFilenameInput');
    const startDownloadBtn = document.getElementById('startDownloadBtn');
    const downloadProgressContainer = document.getElementById('downloadProgressContainer');
    const downloadStatusText = document.getElementById('downloadStatusText');
    const downloadPercentText = document.getElementById('downloadPercentText');
    const downloadProgressBar = document.getElementById('downloadProgressBar');

    // State Variables
    let selectLoading = true;
    let isGenerating = false;
    let currentChatId = null;
    let attachedFileContent = null;
    let downloadInterval = null;

    // Initialization
    init();

    async function init() {
        initTheme();
        await loadSettings();
        await loadModels();
        await loadHistory();
        setupEventListeners();
        checkActiveDownload();
    }

    // Theme Handling
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            themeLabel.textContent = 'Light Mode';
            themeIcon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>`;
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            themeLabel.textContent = 'Dark Mode';
            themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        }
    }

    function toggleTheme() {
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
        initTheme();
    }

    // Models & Settings Getters
    async function loadSettings() {
        try {
            const res = await fetch('http://localhost:5000/settings');
            const data = await res.json();
            settingDirInput.value = data.agentsDir || '';
        } catch(e) {}
    }

    async function saveSettings() {
        const agentsDir = settingDirInput.value.trim();
        if (!agentsDir) return alert('Please enter a valid directory path.');
        try {
            const res = await fetch('http://localhost:5000/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentsDir })
            });
            if (res.ok) {
                alert('Directory settings saved successfully!');
                await loadModels();
            } else {
                throw new Error(await res.text());
            }
        } catch(e) {
            alert('Error saving directory: ' + e.message);
        }
    }

    async function loadModels() {
        try {
            const res = await fetch('http://localhost:5000/models');
            const models = await res.json();
            modelSelect.innerHTML = '';
            
            if (models.length === 0) {
                modelSelect.innerHTML = '<option value="">No models found</option>';
                modelSelect.disabled = true;
                promptInput.disabled = true;
            } else {
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    let simpleName = model.split('.')[0].replace(/[-_]/g, ' ');
                    option.textContent = simpleName.length > 22 ? simpleName.substring(0, 22) + '...' : simpleName;
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
                promptInput.disabled = false;
                selectLoading = false;
            }
        } catch (err) {
            modelSelect.innerHTML = '<option value="">Conn Error</option>';
        }
    }

    // History loaders
    async function loadHistory() {
        try {
            const res = await fetch('http://localhost:5000/history');
            const history = await res.json();
            historyList.innerHTML = '';
            
            if (history.length === 0) {
                historyList.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">No chat sessions.</div>';
                return;
            }

            history.forEach(chat => {
                const div = document.createElement('div');
                div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
                
                const titleSpan = document.createElement('span');
                titleSpan.textContent = chat.title || 'New Chat';
                div.appendChild(titleSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-chat-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete Chat';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                });
                div.appendChild(deleteBtn);
                
                titleSpan.addEventListener('click', () => loadChat(chat.id));
                historyList.appendChild(div);
            });
        } catch (e) {
            historyList.innerHTML = '<div class="history-item">Error...</div>';
        }
    }

    async function loadChat(id) {
        if (isGenerating) return;
        try {
            const res = await fetch(`http://localhost:5000/history/${id}`);
            const chat = await res.json();
            
            currentChatId = chat.id;
            
            // Clean view
            messagesList.innerHTML = '';
            greetingView.style.display = 'none';
            removeAttachment();
            showView('chats');

            chat.messages.forEach(msg => {
                appendMessage(msg.role, msg.content);
            });

            loadHistory();
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteChat(id) {
        if (isGenerating) return;
        if (!confirm('Are you sure you want to delete this chat session?')) return;
        try {
            const res = await fetch(`http://localhost:5000/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (currentChatId === id) {
                    startNewChat();
                } else {
                    loadHistory();
                }
            }
        } catch(e) {}
    }

    function startNewChat() {
        if (isGenerating) return;
        currentChatId = null;
        messagesList.innerHTML = '';
        greetingView.style.display = 'block';
        quickActions.style.display = 'flex';
        promptInput.value = '';
        removeAttachment();
        fetch('http://localhost:5000/reset', { method: 'POST' }).catch(()=>{});
        showView('chats');
        loadHistory();
    }

    // View Switching
    function showView(view) {
        if (view === 'chats') {
            chatWrapper.style.display = 'flex';
            inputAreaWrapper.style.display = 'flex';
            modelsHubView.style.display = 'none';
            navChats.classList.add('active');
            navModels.classList.remove('active');
        } else {
            chatWrapper.style.display = 'none';
            inputAreaWrapper.style.display = 'none';
            modelsHubView.style.display = 'block';
            navChats.classList.remove('active');
            navModels.classList.add('active');
        }
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Navigation clicks
        navChats.addEventListener('click', () => showView('chats'));
        navModels.addEventListener('click', () => showView('models'));
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Settings / Downloader
        saveDirBtn.addEventListener('click', saveSettings);
        startDownloadBtn.addEventListener('click', startModelDownload);

        // Textarea Resize
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            sendBtn.disabled = this.value.trim() === '' || selectLoading || isGenerating;
        });

        // Quick Actions System
        document.getElementById('actionCode').addEventListener('click', () => fillQuickPrompt('Write a clean JavaScript function to '));
        document.getElementById('actionExplain').addEventListener('click', () => fillQuickPrompt('Explain this local LLM concept simply: '));
        document.getElementById('actionReport').addEventListener('click', () => fillQuickPrompt('Generate a markdown summary report about '));

        // File loaders
        uploadFileBtn.addEventListener('click', () => fileInput.click());
        removeFileBtn.addEventListener('click', removeAttachment);

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                attachedFileContent = evt.target.result;
                fileNameDisplay.textContent = file.name;
                fileAttachmentBadge.style.display = 'flex';
                promptInput.focus();
            };
            reader.readAsText(file);
            fileInput.value = '';
        });

        // Chat send keypresses
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) sendChat();
            }
        });

        sendBtn.addEventListener('click', sendChat);
        newChatBtn.addEventListener('click', startNewChat);
    }

    function fillQuickPrompt(text) {
        promptInput.value = text;
        promptInput.focus();
        promptInput.dispatchEvent(new Event('input'));
    }

    function removeAttachment() {
        attachedFileContent = null;
        fileAttachmentBadge.style.display = 'none';
        fileNameDisplay.textContent = '';
    }

    // Chat sending loops
    async function sendChat() {
        if (isGenerating || selectLoading || !modelSelect.value) return;
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        if (greetingView.style.display !== 'none') {
            greetingView.style.display = 'none';
            quickActions.style.display = 'none';
        }

        const fileContentToSend = attachedFileContent;
        promptInput.value = '';
        promptInput.style.height = 'auto';
        sendBtn.disabled = true;
        removeAttachment();

        appendMessage('user', prompt);

        // System output placeholder
        const msgDiv = createMessageDiv('system');
        const contentDiv = msgDiv.querySelector('.content');
        contentDiv.innerHTML = '<span class="typing-dots">...</span>';
        messagesList.appendChild(msgDiv);
        scrollToBottom();

        isGenerating = true;
        let aiMarkdownText = "";

        try {
            const payload = {
                prompt,
                model: modelSelect.value,
                chatId: currentChatId,
                fileContext: fileContentToSend
            };

            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(await response.text());

            contentDiv.innerHTML = "";
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            let done = false;
            let buffer = "";

            while (!done) {
                const { value, done: chunkDone } = await reader.read();
                if (chunkDone) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim() === 'data: [DONE]') {
                        done = true;
                        break;
                    }
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chatId && !currentChatId) {
                                currentChatId = data.chatId;
                            }
                            if (data.text) {
                                aiMarkdownText += data.text;
                                contentDiv.innerHTML = marked.parse(aiMarkdownText);
                                hljs.highlightAll();
                                attachCopyButtons(contentDiv);
                                scrollToBottom();
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch (error) {
            contentDiv.innerHTML = `<span style="color: #ef4444;">Error: ${error.message}</span>`;
        } finally {
            isGenerating = false;
            sendBtn.disabled = false;
            loadHistory();
            promptInput.focus();
        }
    }

    function createMessageDiv(role) {
        const div = document.createElement('div');
        div.className = `message ${role}-msg`;
        const content = document.createElement('div');
        content.className = 'content';
        div.appendChild(content);
        return div;
    }

    function appendMessage(role, text) {
        const msgDiv = createMessageDiv(role);
        if (role === 'system') {
             msgDiv.querySelector('.content').innerHTML = marked.parse(text);
             hljs.highlightAll();
             attachCopyButtons(msgDiv.querySelector('.content'));
        } else {
             msgDiv.querySelector('.content').textContent = text;
        }
        messagesList.appendChild(msgDiv);
        scrollToBottom();
    }

    function attachCopyButtons(container) {
        const preBlocks = container.querySelectorAll('pre');
        preBlocks.forEach(pre => {
            if (pre.querySelector('.copy-code-btn')) return; // already exists
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const code = pre.querySelector('code').textContent;
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
            pre.appendChild(btn);
        });
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Downloader execution
    async function startModelDownload() {
        const repoId = hfRepoInput.value.trim();
        const filename = hfFilenameInput.value.trim();

        if (!repoId || !filename) {
            return alert('Please fill in both the HuggingFace repository ID and GGUF filename.');
        }

        try {
            startDownloadBtn.disabled = true;
            const res = await fetch('http://localhost:5000/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoId, filename })
            });

            if (res.ok) {
                downloadProgressContainer.style.display = 'block';
                checkActiveDownload();
            } else {
                throw new Error(await res.text());
            }
        } catch(e) {
            alert('Download failed: ' + e.message);
            startDownloadBtn.disabled = false;
        }
    }

    function checkActiveDownload() {
        if (downloadInterval) clearInterval(downloadInterval);
        
        downloadInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:5000/download/status');
                const data = await res.json();
                
                if (data.status === 'downloading') {
                    downloadProgressContainer.style.display = 'block';
                    startDownloadBtn.disabled = true;
                    
                    const progress = data.progress.toFixed(1);
                    downloadPercentText.textContent = `${progress}%`;
                    downloadProgressBar.style.width = `${progress}%`;
                    
                    const downloadedMB = (data.downloadedBytes / (1024 * 1024)).toFixed(1);
                    const totalMB = (data.totalBytes / (1024 * 1024)).toFixed(1);
                    downloadStatusText.textContent = `Downloading ${data.filename}: ${downloadedMB} MB / ${totalMB} MB`;
                } else if (data.status === 'completed') {
                    clearInterval(downloadInterval);
                    downloadPercentText.textContent = `100.0%`;
                    downloadProgressBar.style.width = `100%`;
                    downloadStatusText.textContent = `Completed! Model saved.`;
                    startDownloadBtn.disabled = false;
                    
                    // Clear inputs
                    hfRepoInput.value = '';
                    hfFilenameInput.value = '';
                    
                    await loadModels(); // reload selector options
                } else if (data.status === 'error') {
                    clearInterval(downloadInterval);
                    downloadStatusText.textContent = `Error: ${data.error}`;
                    startDownloadBtn.disabled = false;
                }
            } catch(e) {
                clearInterval(downloadInterval);
            }
        }, 1000);
    }
});
