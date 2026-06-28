---
title: Claude GGUF Local Agent UI
emoji: 🤖
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

<div align="center">

<img src="https://raw.githubusercontent.com/karidasd/claude-gguf-local-agent/main/assets/banner.png" alt="Claude GGUF Local Agent" width="100%"/>

<br/>
<br/>

[![HuggingFace Space](https://img.shields.io/badge/🤗%20HuggingFace-Live%20Demo-FFD21E?style=for-the-badge)](https://huggingface.co/spaces/karidasd/claude-gguf-local-agent)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Static%20Demo-181717?style=for-the-badge&logo=github)](https://karidasd.github.io/claude-gguf-local-agent/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/karidasd/claude-gguf-local-agent?style=for-the-badge&color=gold)](https://github.com/karidasd/claude-gguf-local-agent/stargazers)

<br/>

### 🔥 Run any GGUF language model — Locally. Privately. Powerfully.

*A full Claude-inspired chat UI with a built-in HuggingFace model downloader, real-time streaming, and zero API keys required.*

<br/>

[**🚀 Try it Live on HuggingFace →**](https://huggingface.co/spaces/karidasd/claude-gguf-local-agent) &nbsp;&nbsp;|&nbsp;&nbsp; [**📖 Static Demo →**](https://karidasd.github.io/claude-gguf-local-agent/)

</div>

---

## 🧠 What Is This?

**Claude GGUF Local Agent** is a self-hosted AI chat interface that lets you:

- 💬 Chat with **any GGUF model** (Llama, Mistral, Dolphin, Qwen, Phi and more)
- ⬇️ **Download models directly** from HuggingFace with a built-in progress tracker
- 🔒 Run **100% offline** — no API keys, no cloud dependency, no data leaving your machine
- 🎨 Enjoy a **premium Claude-inspired UI** with dark/light mode toggle
- ⚡ Get **hardware-accelerated** inference via CUDA (NVIDIA GPUs)

> Think of it as your own private Claude — running on your hardware, on your terms.

---

## ✨ Feature Highlights

| Feature | Description |
|--------|-------------|
| 🖼️ **Claude-Style UI** | Cream/beige light theme and deep charcoal dark mode matching Anthropic's aesthetic |
| ⬇️ **HuggingFace Downloader** | Enter a repo + filename → model downloads in the background with live % progress |
| ⚡ **CUDA Acceleration** | Powered by `node-llama-cpp`, auto-binds to NVIDIA GPU for blazing fast inference |
| 🌊 **Streaming Responses** | Token-by-token streaming output — no waiting, just flow |
| 🎨 **Code Highlighting** | Syntax-highlighted code blocks with one-click copy button |
| 📎 **Document Context** | Attach `.txt` / `.md` files as context to any conversation |
| 📁 **Smart Path Detection** | Auto-scans common model directories (`E:\AGENTS`, `D:\agents`, `./models`) |
| 🌐 **Cloud-Ready** | Deployable as a HuggingFace Space — runs online with no PC required |

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- (Optional) NVIDIA GPU with CUDA for acceleration

### 1. Clone the Repository
```bash
git clone https://github.com/karidasd/claude-gguf-local-agent.git
cd claude-gguf-local-agent
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch the Server
```bash
node server.mjs
```
> Windows users: double-click `start.bat`

Open your browser at **[http://localhost:5000](http://localhost:5000)** — you're live! 🎉

---

## ⬇️ Loading Your First Model

1. Click **"Models Hub"** in the sidebar
2. Enter a HuggingFace repo ID, e.g.:
   ```
   Bartowski/Dolphin3.0-Llama3.2-3B-GGUF
   ```
3. Enter the filename, e.g.:
   ```
   Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf
   ```
4. Click **Download** → watch the live progress bar
5. Once complete, the model appears in the chat dropdown instantly ✅

**Recommended starter models:**

| Model | Size | Great For |
|-------|------|-----------|
| Dolphin3.0-Llama3.2-3B-Q5_K_M | ~2.3 GB | Fast chat, low VRAM |
| Llama-3-8B-Instruct-Q4_K_M | ~4.9 GB | Balanced quality |
| Mistral-7B-Instruct-v0.3-Q5_K_M | ~5.1 GB | Instruction following |
| Qwen2.5-14B-Instruct-Q4_K_M | ~8.9 GB | Advanced reasoning |

---

## 🐳 Deploy to HuggingFace Spaces (Free Cloud)

This project includes a pre-configured `Dockerfile` for zero-config cloud deployment:

```bash
# Push your fork to HuggingFace Spaces
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/claude-gguf-local-agent
git push space main
```

> The server starts immediately. A Dolphin-3B model is downloaded automatically in the background on first boot.

---

## 🗂️ Project Structure

```
claude-gguf-local-agent/
├── server.mjs          # Express backend with LLM inference + HF downloader
├── public/
│   ├── index.html      # Main Claude-style chat interface
│   ├── index.css       # Full CSS design system (light + dark mode)
│   └── app.js          # Frontend logic, streaming renderer, demo mode
├── assets/
│   └── banner.png      # Project banner
├── models/             # GGUF model weights (auto-created)
├── Dockerfile          # HuggingFace Spaces configuration
└── start.bat           # Windows one-click launcher
```

---

## 🌐 Live Demos

| Platform | URL | Description |
|----------|-----|-------------|
| 🤗 HuggingFace Spaces | [Open Space](https://huggingface.co/spaces/karidasd/claude-gguf-local-agent) | Full cloud-hosted agent with real inference |
| 📄 GitHub Pages | [Open Demo](https://karidasd.github.io/claude-gguf-local-agent/) | Static UI demo (simulated responses) |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the open-source AI community**

*If this project helped you, please consider giving it a ⭐ star — it means a lot!*

[![GitHub Stars](https://img.shields.io/github/stars/karidasd/claude-gguf-local-agent?style=social)](https://github.com/karidasd/claude-gguf-local-agent)

</div>
