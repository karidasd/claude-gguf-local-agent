---
title: Claude GGUF Local Agent UI
emoji: 🤖
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# Claude GGUF - Local Agent UI & HuggingFace Downloader

🚀 **A local model runtime and streaming chatbot interface that replicates the Claude Web UI, built for running GGUF weights locally on your hardware.**

👉 **[Launch the Interactive Cloud Agent on HuggingFace Spaces!](https://huggingface.co/spaces/karidasd/claude-gguf-local-agent)**

👉 **[Launch the Static Web Demonstration on GitHub Pages!](https://karidasd.github.io/claude-gguf-local-agent/)**

This project allows you to manage local model paths, download weights directly from HuggingFace, attach text/markdown document contexts, and chat completely offline with zero API keys or external queries.

---

## ✨ Features

1. **Claude UI Style**: Clean cream-beige light theme and charcoal dark theme replicating the Anthropic Claude interface.
2. **HuggingFace Downloader**: Built-in background downloader that follows redirections, tracks progress percentages, and drops GGUF files directly into your models folder.
3. **Hardware Acceleration**: Built on `node-llama-cpp`, automatically binding to your **NVIDIA CUDA** toolkit for high-speed local inference.
4. **Markdown & Code Tools**: Renders markdown output, highlights code blocks in real-time, and adds a "Copy" trigger to code segments.
5. **Configurable Paths**: Automatically scans standard paths (`E:\AGENTS`, `D:\agents`, or a local `./models` subdirectory) with options to set custom paths dynamically.

---

## 🛠️ Getting Started

### 1. Install dependencies
Navigate to the project folder and run:
```bash
npm install
```

### 2. Start the Server
Double-click `start.bat` on Windows or execute:
```bash
node server.mjs
```
The server will automatically launch on **[http://localhost:5000](http://localhost:5000)** and locate/create your local models directory.

---

## 📥 Managing & Downloading Models

1. Open the UI in your browser and click on **Models Hub** in the sidebar.
2. Under **Local Directories Settings**, you can view or change the folder where your models are stored.
3. To download a model, input a HuggingFace repository (e.g. `Bartowski/Llama-3-8B-Instruct-GGUF`) and a filename (e.g. `Llama-3-8B-Instruct-Q4_K_M.gguf`), then click **Download**.
4. The download runs in the background. Once complete, the model will instantly appear in your chat dropdown!
