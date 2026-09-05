# Streaming ASR & Real-Time Local AI Voice Demos

An end-to-end, high-performance local AI voice interaction suite built for Windows CPU. This project demonstrates real-time streaming Speech-to-Text (ASR), client-side Voice Activity Detection (VAD), Large Language Model (LLM) speech-to-command transformation, and Text-to-Speech (TTS) voice responses—all operating completely offline.

---

## 🎥 Video Demonstrations

### 📺 Part 1: Offline AI Voice Assistant in Chrome (Walkthrough & Demo)

Watch the complete end-to-end demo showing service orchestration, real-time streaming Hindi ASR, Silero VAD turn detection, local LLM confirmation, and neural TTS:

[![Part 1: Chrome Extension Offline Voice Assistant Demo](https://img.youtube.com/vi/W0ftU5tn1mg/maxresdefault.jpg)](https://youtu.be/W0ftU5tn1mg "Click to Watch Part 1: Chrome Extension Offline Voice Assistant Demo")

> 🔗 **Watch Video on YouTube**: [https://youtu.be/W0ftU5tn1mg](https://youtu.be/W0ftU5tn1mg)

---

## 📁 Repository Structure & Projects

```
streaming_demos/
├── README.md               # Main repository documentation (this file)
├── commands.md             # Scratchpad reference for CLI commands & testing scripts
├── LICENSE.txt             # Project license
├── extension/              # Chrome Extension (Manifest V3 Side Panel Voice Assistant)
│   ├── README.md           # 📖 Comprehensive Chrome Extension Instructional Manual
│   ├── manifest.json       # Manifest V3 extension configuration
│   ├── sidepanel.html      # Side Panel user interface
│   ├── sidepanel.js        # Voice capture, VAD, WebSocket streaming, and LLM correction
│   └── docs/images/        # Visual walkthrough screenshots
├── companion/              # Companion Orchestrator & Proxy Server
│   ├── server.js           # Process manager + TTS/LLM reverse proxy (:8000)
│   ├── downloader.js       # Binary/model checker and conditional downloader
│   └── start_companion.bat # 1-click companion launcher
└── commands_demo/          # Web-based Streaming Voice Commands Standalone Demo
    ├── README.md           # Detailed setup & architecture documentation
    ├── index.html          # Web frontend layout
    ├── styles.css          # UI styling
    ├── script.js           # Complete client logic
    └── server.js           # Static file server

---

## 🎙️ Featured Demos

### 1. [Chrome Extension — Local Voice ASR & Form Assistant](./extension/README.md) ⭐
An offline, privacy-first Chrome Extension that runs in the **Chrome Side Panel**, automatically coordinates with the local companion daemon to manage backend services, performs real-time Hindi streaming ASR, carries out LLM intent verification, and speaks voice feedback.

* 📖 **[Read the Full Chrome Extension Instructional Manual](./extension/README.md)** with visual screenshots, setup instructions, and troubleshooting tips.

### 2. [Voice Commands & Real-Time Streaming ASR Web Demo](./commands_demo/README.md)
A browser-based interactive web client that captures real-time microphone audio, performs low-latency streaming ASR via native WebSockets, transforms raw recognized speech into structured commands using a local LLM, and plays synthesized voice responses.

* 📖 **[Read the Full Voice Commands Demo README](./commands_demo/README.md)** for detailed installation steps, model downloads, architecture diagrams, and service ports.

---

## ⚡ Technical Stack & Components

| Component | Technology / Model | Role / Description |
| :--- | :--- | :--- |
| **Browser Engine** | Web Audio API / ONNX Runtime Web | 16 kHz PCM audio recording & client-side VAD |
| **VAD Engine** | [Silero VAD v5 (ONNX)](https://huggingface.co/runanywhere/silero-vad-v5) | Real-time speech/silence detection in browser |
| **Streaming ASR** | [CrispASR](https://github.com/CrispStrobe/CrispASR) + [Nemotron 3.5 0.6B (GGUF)](https://huggingface.co/cstr/nemotron-3.5-asr-streaming-GGUF) | Low-latency streaming Hindi Speech-to-Text over WebSocket (`ws://127.0.0.1:8081`) |
| **LLM Engine** | [llama-server](https://github.com/ggml-org/llama.cpp) + [Liquid AI LFM 2.5 2.6B (GGUF)](https://huggingface.co/LiquidAI/LFM2.5-2.6B-GGUF) | Real-time speech transcript correction & command transformation (`http://127.0.0.1:8084`) |
| **TTS Engine** | CrispASR (Piper Backend) + [Hindi Rohan Medium (GGUF)](https://huggingface.co/pronoobie/piper-voices-hindi) | High-quality Hindi voice speech synthesis (`http://127.0.0.1:8089`) |
| **Web Server** | Node.js + Express | Serves static web frontend (`http://localhost:8000`) |

---

## 🚀 Quick Start Guide

### 1. One-Click Backend Launcher (Recommended)
Simply double-click the companion launcher:
```cmd
streaming_demos\companion\start_companion.bat
```
> 💡 **Zero Manual Setup**:
> - **Auto-installs Node.js**: If Node.js is not detected, the script automatically installs the official Node.js LTS via Windows Package Manager (`winget`).
> - **Orchestration & Proxy**: Runs on `http://127.0.0.1:8000` to verify models, manage background AI processes, and handle reverse proxying.

---

### 2. Choose Your Interface

* **Option A: Chrome Extension (Side Panel Assistant)** ⭐ *(Recommended)*
  1. Open Chrome and go to `chrome://extensions`.
  2. Enable **Developer mode** (top-right) and click **Load unpacked**.
  3. Select the `streaming_demos\extension` folder.
  4. Open the Side Panel, click **🚀 स्टार्ट सर्विसेज**, and start speaking!
  5. 📖 Read the full **[Chrome Extension Instructional Manual](./extension/README.md)** for a visual walkthrough.

* **Option B: Standalone Web Demo**
  1. With the companion server running, open `http://localhost:8000/` in your browser.
  2. 📖 Read the **[Voice Commands Demo README](./commands_demo/README.md)** for detailed architecture.

---

### 3. Manual CLI Testing & Scripting
For running individual native binaries directly without the companion, or for CLI tests (`curl`, `ffmpeg`), refer to [`commands.md`](./commands.md).

---

## 📄 License

This repository is distributed under the terms of the [MIT License](./LICENSE.txt).
