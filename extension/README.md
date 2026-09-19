# 🎙️ Local Voice ASR & Form Assistant — Chrome Extension Manual

An offline, privacy-first Chrome Extension (Manifest V3) that provides real-time streaming Hindi Speech-to-Text (ASR), large language model (LLM) intent classification and correction, and high-quality Text-to-Speech (TTS) voice responses—all powered by local models running natively on Windows CPU.

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
* **🗣️ Piper TTS Card**: Monitors the offline Hindi speech synthesis engine (`Port :8089`). Displays `READY` when available.
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
* **लाइव ट्रांसक्रिप्शन (Streaming STT)**: Displays live, low-latency partial and interim Hindi transcripts as you speak into the form fields.
* **Current Active Field Spotlight**: Highlights the current field, spoken prompt, live recognized value preview, and quick step navigation controls (`⏮️ पिछला`, `🔄 दोबारा पूछें`, `⏭️ छोड़ें`).
* **📋 स्कैन किए गए फ़ील्ड्स (Scanned Fields Accordion)**: Interactive checklist of all form fields. Clicking any row directly focuses and selects that field.
* **Tuning Parameters (Accordion)**:
  * **Silero Speech Threshold** (Default: `0.50`): Adjusts sensitivity of speech detection.
  * **Silence Before Turn Finalizes** (Default: `800 ms`): Delay before speech is finalized.
  * **Max Utterance Hard Cap** (Default: `12000 ms`): Maximum continuous speaking window.
  * **Pre-roll Padding** (Default: `200 ms`): Audio captured just before speech onset to prevent clipping.
  * **LLM Proxy Server URL**: Endpoint for Gemma 4 intent classification and value extraction (`http://127.0.0.1:8000/v1/chat/completions`).

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
│ Local Host OS (Windows CPU)                                     │
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

The system verifies existing files in `Desktop\workspace\browser-form-fill\` and skips downloading if they already exist:

| Component | Target Location | Description |
| :--- | :--- | :--- |
| **CrispASR Engine** | `bin\crispasr.exe` | Multi-backend ASR & TTS server |
| **llama-server Engine** | `bin\llama-server.exe` | llama.cpp server with CPU AVX2 acceleration |
| **Nemotron ASR Model** | `models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf` | 0.6B streaming Speech-to-Text model |
| **Piper TTS Model** | `models\hi_IN-rohan-medium.gguf` | Hindi voice synthesis model |
| **Gemma 4 LLM** | `models\gemma-4-E2B-it-UD-Q4_K_XL.gguf` | 2.6B parameter command correction model |
| **Silero VAD** | `extension\silero_vad.onnx` | Bundled WebAssembly Voice Activity Detector |

---

## 🌐 Supported Languages (15 Languages / 19 Locales)

The assistant features full end-to-end localization across UI elements, conversational TTS dictation templates, Gemma 4 LLM intent classification/value extraction prompts, and speech heuristics. Piper voice models in GGUF format are fetched from [LocalAI-Community/piper-voices-GGUF](https://huggingface.co/LocalAI-Community/piper-voices-GGUF/tree/main):

| Language | Locales | TTS Voice Model (GGUF) |
| :--- | :--- | :--- |
| **Hindi** | `hi-IN` (Default) | `hi_IN-rohan-medium.gguf` |
| **English** | `en-US`, `en-GB` | `piper-en_US-lessac-medium-f16.gguf` / `piper-en_GB-cori-medium-f16.gguf` |
| **Spanish** | `es-ES`, `es-US` | `piper-es_ES-davefx-medium-f16.gguf` / `piper-es_MX-ald-medium-f16.gguf` |
| **French** | `fr-FR`, `fr-CA` | `piper-fr_FR-siwis-medium-f16.gguf` / `piper-fr_FR-tom-medium-f16.gguf` |
| **Italian** | `it-IT` | `piper-it_IT-paola-medium-f16.gguf` |
| **Portuguese**| `pt-BR`, `pt-PT` | `piper-pt_BR-faber-medium-f16.gguf` / `piper-pt_PT-tugão-medium-f16.gguf` |
| **Dutch** | `nl-NL` | `piper-nl_NL-alex-medium-f16.gguf` |
| **German** | `de-DE` | `piper-de_DE-thorsten-medium-f16.gguf` |
| **Turkish** | `tr-TR` | `piper-tr_TR-dfki-medium-f16.gguf` |
| **Russian** | `ru-RU` | `piper-ru_RU-denis-medium-f16.gguf` |
| **Arabic** | `ar-AR` | `piper-ar_JO-kareem-medium-f16.gguf` |
| **Japanese**| `ja-JP` | Multilingual ASR & LLM prompts |
| **Korean** | `ko-KR` | Multilingual ASR & LLM prompts |
| **Vietnamese**| `vi-VN` | `piper-vi_VN-vais1000-medium-f16.gguf` |
| **Ukrainian** | `uk-UA` | `piper-uk_UA-lada-x_low-f16.gguf` |

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Companion Orchestrator Setup (Cross-Platform)

#### 🪟 Windows Setup
* **1-Click Protocol Registration (Recommended):**
  Double-click `companion\register_protocol.bat`
* **Manual Launcher:**
  Double-click `companion\start_companion.bat` *(auto-installs Node.js LTS via winget if missing)*

#### 🐧 Linux Setup
* **1-Click Protocol Registration:**
  ```bash
  chmod +x companion/*.sh
  ./companion/register_protocol.sh
  ```
* **Manual Launcher:**
  ```bash
  ./companion/start_companion.sh
  ```

#### 🍎 macOS Setup
* **1-Click Protocol Registration:**
  ```bash
  chmod +x companion/*.sh
  ./companion/register_protocol.sh
  ```
* **Manual Launcher:**
  ```bash
  ./companion/start_companion.sh
  ```

The companion starts listening on `http://127.0.0.1:8000/`.

---

### Step 2: Load the Extension in Google Chrome
1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** via the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Browse and select the extension folder:
   ```
   Desktop\workspace\browser-form-fill\streaming_demos\extension
   ```
5. **Local Voice ASR & Form Assistant** will now appear in your active extensions list.

---

### Step 3: Grant Microphone Permission (One-Time Setup)
Because Chrome Side Panels do not have a URL bar to display permission bubbles:
1. Open the Side Panel by clicking the extension icon in Chrome's toolbar.
2. Click **`🎙️ माइक अनुमति`** (or click **सेशन शुरू करें**).
3. A permission tab will automatically open asking:
   > *"Local Voice ASR & Form Assistant wants to: Use your microphone"* &rarr; Click **Allow**.
4. The tab displays `✅ अनुमति मिल गई!` and closes itself. Microphone permission is now permanently granted to the extension origin!

---

### Step 4: Boot AI Services, Scan Forms & Begin Voice Fill
1. In the Side Panel, click **🚀 स्टार्ट सर्विसेज**.
2. The companion will boot the 3 local AI processes. Within a few seconds, all three indicators turn green (**READY**).
3. Open any webpage with form inputs (e.g. contact forms, registration forms).
4. Click **🔍 फ़ॉर्म स्कैन करें** (Scan Form). The extension automatically identifies all text fields, email inputs, textareas, etc.
5. Click **▶️ वॉइस से भरें** (Start Voice Filling).
6. The assistant highlights each field on the page and prompts you via TTS:
   > *"अगला फ़ील्ड है [नाम]। कृपया बताएं इसमें क्या भरना है?"*
7. Speak your answer in Hindi or English. The assistant fills the field, verifies with you (*"क्या यह सही है?"*), and moves to the next field upon confirmation!
8. Click **⏹️ सत्र समाप्त करें** anytime to immediately stop all listening and activity.

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

## 📄 License

This extension and documentation are distributed under the [MIT License](../LICENSE.txt).
