# 🎙️ Local Voice ASR & Form Assistant — Chrome Extension Manual

An offline, privacy-first Chrome Extension (Manifest V3) that provides real-time streaming multilingual Speech-to-Text (ASR), large language model (LLM) intent classification and correction, and high-quality Text-to-Speech (TTS) voice responses across 15 languages—all powered by local models running natively on Windows, Linux, and macOS.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../LICENSE.txt)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](./manifest.json)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-ONNX%20Runtime%20Web-654FF0?style=flat-square&logo=webassembly&logoColor=white)](https://onnxruntime.ai/)
[![Supported Languages](https://img.shields.io/badge/Supported%20Languages-15%20Languages%20%2F%2019%20Locales-success?style=flat-square)](#-supported-languages-15-languages--19-locales)

### 🌐 Supported Languages
[![Hindi](https://img.shields.io/badge/Hindi-🇮🇳%20hi--IN-FF9933?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![English](https://img.shields.io/badge/English-🇺🇸%20en--US%20%7C%20🇬🇧%20en--GB-0052B4?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Spanish](https://img.shields.io/badge/Spanish-🇪🇸%20es--ES%20%7C%20🇲🇽%20es--US-AA151B?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![French](https://img.shields.io/badge/French-🇫🇷%20fr--FR%20%7C%20🇨🇦%20fr--CA-002654?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![German](https://img.shields.io/badge/German-🇩🇪%20de--DE-000000?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Italian](https://img.shields.io/badge/Italian-🇮🇹%20it--IT-009246?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Portuguese](https://img.shields.io/badge/Portuguese-🇧🇷%20pt--BR%20%7C%20🇵🇹%20pt--PT-009C3B?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Dutch](https://img.shields.io/badge/Dutch-🇳🇱%20nl--NL-21468B?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Turkish](https://img.shields.io/badge/Turkish-🇹🇷%20tr--TR-E30A17?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Russian](https://img.shields.io/badge/Russian-🇷🇺%20ru--RU-D52B1E?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Arabic](https://img.shields.io/badge/Arabic-🇸🇦%20ar--AR-006C35?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Japanese](https://img.shields.io/badge/Japanese-🇯🇵%20ja--JP-BC002D?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Korean](https://img.shields.io/badge/Korean-🇰🇷%20ko--KR-003478?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Vietnamese](https://img.shields.io/badge/Vietnamese-🇻🇳%20vi--VN-DA251D?style=flat-square)](#-supported-languages-15-languages--19-locales)
[![Ukrainian](https://img.shields.io/badge/Ukrainian-🇺🇦%20uk--UA-005BBB?style=flat-square)](#-supported-languages-15-languages--19-locales)

---

## 🎥 Video Demonstration

### 📺 Part 1: End-to-End Walkthrough & Live Session

[![Part 1: Chrome Extension Offline Voice Assistant Demo](https://img.youtube.com/vi/UFkk_t15yq0/maxresdefault.jpg)](https://youtu.be/UFkk_t15yq0?si=5JYoG76DC6ZGNNsp "Click to Watch Part 1 Demo on YouTube")

> 🔗 **Watch Video on YouTube**: [https://youtu.be/UFkk_t15yq0?si=5JYoG76DC6ZGNNsp](https://youtu.be/UFkk_t15yq0?si=5JYoG76DC6ZGNNsp)

---

## 📸 Visual Tour & Interface Overview

### 1. Extension Loaded & Services Orchestration

![Extension Loaded in Chrome and Side Panel Services Ready](./docs/images/service_orchestration_overview.png)

When the extension is loaded in Google Chrome, it opens as a persistent **Side Panel** on the right side of the browser:

* **⚡ Companion Status**: Displays `Companion Online` (green indicator) when connected to the local companion daemon at `http://127.0.0.1:8000`.
* **🎙️ Nemotron Streaming ASR Card**: Monitors the streaming Speech-to-Text engine (`WS :8082/v1/realtime` & `HTTP :8080`). Displays `READY` when listening.
* **🗣️ Piper TTS Card**: Monitors the offline voice speech synthesis engine (`Port :8089`). Displays `READY` when available.
* **🧠 Gemma 4 LLM Card**: Monitors the local `llama-server` running Gemma 4 E2B (`Port :8084`). Displays `READY` when loaded.
* **Service Actions**:
  * **⚡ कम्पैनियन चालू करें (Launch Companion)**: 1-click launch from within the extension when offline (uses registered `voice-companion://` protocol handler).
  * **🚀 स्टार्ट सर्विसेज (Start Services)**: 1-click startup that checks local models and spawns all 3 background AI processes.
  * **⏹️ स्टॉप (Stop)**: Gracefully terminates the 3 AI server processes.
  * **🔍 चेक फाइल्स (Check Files)**: Verifies presence and integrity of models and binaries without re-downloading.

---

### 2. Live Voice Session & Interactive Dialogue

![Live Voice Session, VAD Tuning, and Spoken Confirmation Dialogue](./docs/images/live_session_dialogue.png)

Once services are active, the form assistant is ready:

* **🔍 फ़ॉर्म स्कैन करें (Scan Form)**: Primary action button that instantly inspects the active browser tab, extracting all form inputs, textareas, labels, and required flags.
* **▶️ वॉइस से भरें (Start Voice Filling)**: Initiates sequential voice filling. Begins asking each field one-by-one via local TTS and capturing answers via ASR.
* **⏹️ सत्र समाप्त करें (Stop Session & All Activity)**: Instantly terminates audio listening, aborts TTS playback, stops sequential form filling, clears webpage highlights, and resets assistant state.
* **🎙️ माइक अनुमति (Mic Permission)**: Quick link to approve microphone access in a dedicated tab.
* **Real-time Signal Strip (RMS VU Meter)**: Visualizes incoming audio levels in real time and highlights speech vs. silence boundaries detected by **Silero VAD**.
* **लाइव ट्रांसक्रिप्शन (Streaming STT)**: Displays live, low-latency partial and interim transcripts in your selected language as you speak into the form fields.
* **Current Active Field Spotlight**: Highlights the current field, spoken prompt, live recognized value preview, and quick step navigation controls (`⏮️ पिछला`, `🔄 दोबारा पूछें`, `⏭️ छोड़ें`).
* **📋 स्कैन किए गए फ़ील्ड्स (Scanned Fields Accordion)**: Interactive checklist of all form fields. Clicking any row directly focuses and selects that field.
* **Tuning Parameters (Accordion)**:
  * **Silero Speech Threshold** (Default: `0.50`): Adjusts sensitivity of speech detection.
  * **Silence Before Turn Finalizes** (Default: `800 ms`): Delay before speech is finalized.
  * **Max Utterance Hard Cap** (Default: `12000 ms`): Maximum continuous speaking window.
  * **Pre-roll Padding** (Default: `200 ms`): Audio captured just before speech onset to prevent clipping.
  * **LLM Proxy Server URL**: Endpoint for Gemma 4 intent classification and value extraction (`http://127.0.0.1:8000/v1/chat/completions`).

---

## 📁 Extension File Structure

```
extension/
├── manifest.json             # Manifest V3 extension configuration & permissions
├── sidepanel.html            # Persistent Side Panel user interface layout
├── sidepanel.css             # Side Panel glassmorphism styling & animations
├── sidepanel.js              # Core UI controller, audio capture, STT client & state machine
├── form-field-scanner.js     # DOM form analyzer & sequential field fill orchestrator
├── scanner-highlight.css     # Webpage active input highlight rings & pulsing focus styles
├── i18n.js                   # Client-side localization engine & translation loader
├── locales/                  # 15 Language dictionary modules
│   ├── ar.js                 # 🇸🇦 Arabic (ar-AR)
│   ├── de.js                 # 🇩🇪 German (de-DE)
│   ├── en.js                 # 🇺🇸/🇬🇧 English (en-US, en-GB)
│   ├── es.js                 # 🇪🇸/🇲🇽 Spanish (es-ES, es-US)
│   ├── fr.js                 # 🇫🇷/🇨🇦 French (fr-FR, fr-CA)
│   ├── hi.js                 # 🇮🇳 Hindi (hi-IN)
│   ├── it.js                 # 🇮🇹 Italian (it-IT)
│   ├── ja.js                 # 🇯🇵 Japanese (ja-JP)
│   ├── ko.js                 # 🇰🇷 Korean (ko-KR)
│   ├── nl.js                 # 🇳🇱 Dutch (nl-NL)
│   ├── pt.js                 # 🇧🇷/🇵🇹 Portuguese (pt-BR, pt-PT)
│   ├── ru.js                 # 🇷🇺 Russian (ru-RU)
│   ├── tr.js                 # 🇹🇷 Turkish (tr-TR)
│   ├── uk.js                 # 🇺🇦 Ukrainian (uk-UA)
│   └── vi.js                 # 🇻🇳 Vietnamese (vi-VN)
├── permission.html / .js     # Dedicated tab to grant persistent microphone access
├── launch.html / .js         # Protocol launch fallback helper
├── background.js             # Service worker handling extension lifecycle & side panel open
├── scanBackground.js         # Content-script / tab coordination for DOM form inspection
├── silero_vad.onnx           # Silero VAD v5 ONNX neural speech detector model
├── worklet-processor.js      # AudioWorklet processor for 16 kHz PCM downsampling
├── lib/                      # Bundled ONNX Runtime WebAssembly SIMD/threaded binaries
├── icons/                    # Extension action icons (16px, 48px, 128px)
└── docs/images/              # UI walkthrough screenshots
```

---

## 🏗️ Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Google Chrome (Extension Context)                              │
│                                                                 │
│  ┌───────────────────────┐         ┌─────────────────────────┐  │
│  │  sidepanel.html / js  │         │    Silero VAD (ONNX)    │  │
│  │  - User Interface     │────────▶│  - Client-Side Wasm     │  │
│  │  - Audio Capture      │         │  - 16 kHz PCM Gating    │  │
│  └───────────┬───────────┘         └─────────────────────────┘  │
│              │                                                  │
└──────────────┼──────────────────────────────────────────────────┘
               │ (WebSockets & REST)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Local Host OS (Windows, Linux, macOS)                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Companion Orchestrator & Proxy Server (:8000)             │  │
│  │ - Binary/Model Checker & Downloader                       │  │
│  │ - Process Manager (Spawns & Monitors Background Servers)  │  │
│  │ - TTS & LLM Reverse Proxy (Resolves CORS & Preflights)    │  │
│  └────────────────┬───────────────────┬───────────────────┬──┘  │
│                   │                   │                   │     │
│                   ▼                   ▼                   ▼     │
│          ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐  │
│          │ CrispASR        │ │ CrispASR        │ │ llama.cpp │  │
│          │ Nemotron ASR    │ │ Piper TTS       │ │ Gemma 4   │  │
│          │ :8082 WS / 8080 │ │ :8089 HTTP      │ │ :8084 HTTP│  │
│          └─────────────────┘ └─────────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Required Models & Binaries

The companion script checks and auto-downloads missing binaries and models:

| Component | Target Location | Description |
| :--- | :--- | :--- |
| **CrispASR Engine** | `bin/crispasr` (`.exe` on Win) | Multi-backend ASR & TTS server |
| **llama-server Engine** | `bin/llama-server` (`.exe` on Win) | llama.cpp server with CPU AVX2 acceleration |
| **Nemotron ASR Model** | `models/nemotron-3.5-asr-streaming-0.6b-q4_k.gguf` | 0.6B streaming Speech-to-Text model |
| **Piper TTS Model** | `models/<lang>-medium.gguf` | Piper voice model matching selected language |
| **Gemma 4 LLM** | `models/gemma-4-E2B-it-UD-Q4_K_XL.gguf` | 2.6B parameter command correction model |
| **Silero VAD** | `extension/silero_vad.onnx` | Bundled WebAssembly Voice Activity Detector |

---

## 🌐 Supported Languages (15 Languages / 19 Locales)

The assistant features full end-to-end localization across UI elements, conversational TTS dictation templates, Gemma 4 LLM intent classification/value extraction prompts, and speech heuristics. Piper voice models in GGUF format are fetched automatically from [LocalAI-Community/piper-voices-GGUF](https://huggingface.co/LocalAI-Community/piper-voices-GGUF/tree/main):

| Language       | Locales           | TTS Voice Model (GGUF)                                                    |
| :---------------| :------------------| :--------------------------------------------------------------------------|
| **Hindi**      | `hi-IN` (Default) | `hi_IN-rohan-medium.gguf`                                                 |
| **English**    | `en-US`, `en-GB`  | `piper-en_US-lessac-medium-f16.gguf` / `piper-en_GB-cori-medium-f16.gguf` |
| **Spanish**    | `es-ES`, `es-US`  | `piper-es_ES-davefx-medium-f16.gguf` / `piper-es_MX-ald-medium-f16.gguf`  |
| **French**     | `fr-FR`, `fr-CA`  | `piper-fr_FR-siwis-medium-f16.gguf` / `piper-fr_FR-tom-medium-f16.gguf`   |
| **Italian**    | `it-IT`           | `piper-it_IT-paola-medium-f16.gguf`                                       |
| **Portuguese** | `pt-BR`, `pt-PT`  | `piper-pt_BR-faber-medium-f16.gguf` / `piper-pt_PT-tugão-medium-f16.gguf` |
| **Dutch**      | `nl-NL`           | `piper-nl_NL-alex-medium-f16.gguf`                                        |
| **German**     | `de-DE`           | `piper-de_DE-thorsten-medium-f16.gguf`                                    |
| **Turkish**    | `tr-TR`           | `piper-tr_TR-dfki-medium-f16.gguf`                                        |
| **Russian**    | `ru-RU`           | `piper-ru_RU-denis-medium-f16.gguf`                                       |
| **Arabic**     | `ar-AR`           | `piper-ar_JO-kareem-medium-f16.gguf`                                      |
| **Japanese**   | `ja-JP`           | Multilingual ASR & LLM prompts                                            |
| **Korean**     | `ko-KR`           | Multilingual ASR & LLM prompts                                            |
| **Vietnamese** | `vi-VN`           | `piper-vi_VN-vais1000-medium-f16.gguf`                                    |
| **Ukrainian**  | `uk-UA`           | `piper-uk_UA-lada-x_low-f16.gguf`                                         |

---

## 🚀 Step-by-Step Installation & Setup

### Step 1 — Start the Companion Orchestrator

The companion server manages all 3 AI backend processes (ASR, TTS, LLM) and proxies their APIs to bypass CORS.

#### 🪟 Windows
```cmd
companion\start_companion.bat
```
> Auto-installs Node.js LTS via `winget` if missing.

#### 🐧 Linux / 🍎 macOS
```bash
chmod +x companion/*.sh
./companion/start_companion.sh
```
> Requires Node.js v18+. Checks and prints installation instructions if missing.

The companion starts at **`http://127.0.0.1:8000`** and runs continuously in that terminal window.

---

### Step 2 — Register the Protocol Handler (One-time setup, optional)

Enables the **⚡ Launch Companion** button inside the Side Panel to auto-start the server directly from Chrome.

| Platform | Command |
| :--- | :--- |
| **Windows** | Double-click `companion\register_protocol.bat` |
| **Linux** | `./companion/register_protocol.sh` |
| **macOS** | `./companion/register_protocol.sh` |

---

### Step 3 — Load the Extension in Google Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** via the top-right toggle switch.
3. Click **Load unpacked** and select the `extension/` folder from this repository.
4. **Local Voice ASR & Form Assistant** will appear in your extensions list.
5. Click the puzzle-piece icon in Chrome's toolbar &rarr; pin the extension &rarr; click it to open the **Side Panel**.

---

### Step 4 — Grant Microphone Permission (One-Time Setup)

Chrome Side Panels cannot render microphone permission bubbles directly:
1. In the Side Panel, click **`🎙️ माइक अनुमति`** (Mic Permission).
2. A dedicated browser tab opens requesting microphone access &rarr; click **Allow**.
3. The tab displays `✅ अनुमति मिल गई!` and closes automatically.

---

### Step 5 — Choose Your Language & Handle Service Restarts

Select your preferred language from the **Language Selector** dropdown at the top of the Side Panel.

> [!IMPORTANT]
> **Selecting a new language automatically hot-restarts the ASR and TTS backend services** (the LLM remains running). Expect a ~5–15 second transition period while the new language's voice models are initialized. If selected for the first time, the companion automatically fetches the corresponding Piper TTS voice GGUF model (~50–150 MB).

**How language switching works under the hood:**
- The extension sends a request to `POST /api/language` on the companion server.
- The companion persists your choice in `companion/config.json` and triggers a restart of only the ASR + TTS processes.
- Service indicators in the Side Panel briefly transition to **STARTING** before returning to **READY**.
- Your language preference is saved across sessions and automatically restored whenever you restart the companion.

---

### Step 6 — Start AI Services & Begin Voice Filling

1. In the Side Panel, click **🚀 स्टार्ट सर्विसेज (Start Services)**.
2. All three service cards (Nemotron ASR, Piper TTS, Gemma 4 LLM) will turn green (**READY**).
3. Open any webpage containing form fields (contact form, registration, survey, etc.).
4. Click **🔍 फ़ॉर्म स्कैन करें (Scan Form)** — the extension maps and lists all detectable input fields.
5. Click **▶️ वॉइस से भरें (Start Voice Filling)** — the assistant prompts each field in your selected language via local TTS and listens for your spoken response.
6. The assistant populates the input, verifies (*"क्या यह सही है?"*), and advances to the next field.
7. Click **⏹️ सत्र समाप्त करें (Stop Session)** anytime to halt all listening, playback, and form-filling activities.


---

## 🛠️ Developer & Troubleshooting Guide

### Where to View Extension Logs

Chrome separates extension logs into two separate DevTools consoles:

#### 1. Side Panel Console (VAD, WebSockets, Audio, UI)
* **How to open**: Right-click anywhere inside the Side Panel and select **Inspect**.
* **What you see**: Audio frame RMS values, Silero VAD state transitions, incoming WebSocket JSON packets from Nemotron, and TTS audio playback events.

#### 2. Background Service Worker Console
* **How to open**: Go to `chrome://extensions`, find the extension card, and click the blue link: **`service worker`**.
* **What you see**: Side panel registration, extension installation events, and lifecycle handlers.

#### 3. Companion Server Console
* **How to open**: Look at the terminal window running `node server.js`.
* **What you see**: Process spawn logs, stdout/stderr streams from `crispasr.exe` and `llama-server.exe`, and HTTP reverse proxy requests.

---

## 🙏 Acknowledgments & Special Thanks

We would like to express our sincere gratitude to the open-source projects, model creators, and research teams that made this local AI voice assistant extension possible:

* **[Piper Voices (Rhasspy)](https://huggingface.co/rhasspy/piper-voices)** — High-quality, fast, and lightweight local neural text-to-speech voice models and dataset tools.
* **[CrispASR](https://github.com/CrispStrobe/CrispASR)** — High-performance native streaming Speech-to-Text server and embedded Piper TTS engine.
* **[llama.cpp](https://github.com/ggml-org/llama.cpp)** — State-of-the-art C/C++ inference engine for large language models, powering our local `llama-server`.
* **[NVIDIA Nemotron 3.5 ASR Streaming](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b)** — Exceptional streaming Speech-to-Text architecture providing low-latency transcription.
* **[Google Gemma 4 E2B](https://huggingface.co/google/gemma-4-E2B)** — High-efficiency open language model powering real-time intent extraction and conversational slot filling.

---

## 📄 License

This extension and documentation are distributed under the [MIT License](../LICENSE.txt).
