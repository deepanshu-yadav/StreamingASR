This is a complete working example covering:

Browser microphone capture
16 kHz PCM audio
Silero VAD
Speech/silence detection
Nemotron streaming ASR
Partial transcription
Final transcription
Utterance/turn handling
CrispASR TTS
LFM2.5 for correcting/transformation of transcribed commands
A simple browser client
Local Node.js server
Windows CPU setup
The complete setup can be reproduced locally with the following components.

# Downloads
CrispASR:

https://github.com/CrispStrobe/CrispASR/releases/download/v0.8.30/crispasr-windows-x86_64-cpu.zip

## llama.cpp:

https://github.com/ggml-org/llama.cpp/releases/download/b10686/llama-b10686-bin-win-cpu-x64.zip

# Models

## Hindi Piper TTS:

https://huggingface.co/pronoobie/piper-voices-hindi/blob/main/hi_IN-rohan-medium.gguf

## Nemotron streaming ASR:

https://huggingface.co/cstr/nemotron-3.5-asr-streaming-GGUF/blob/main/nemotron-3.5-asr-streaming-0.6b-q4_k.gguf

## LFM2.5:

https://huggingface.co/LiquidAI/LFM2.5-2.6B-GGUF/blob/main/LFM2.5-2.6B-Q4_0.gguf

## Silero VAD:

https://huggingface.co/runanywhere/silero-vad-v5/blob/main/silero_vad.onnx

# Server side

## Start CrispASR TTS

bin\crispasr.exe --server --backend piper -m "models\hi_IN-rohan-medium.gguf" --port 8089 -l hi -t 8 --no-spoken-disclaimer --accept-marking-responsibility

## Start Nemotron Streaming

set CRISPASR_NEMOTRON_STREAMING=1 && bin\crispasr.exe --server --backend nemotron -m "models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf" -l hi --stream --stream-json --stream-partial-decode-ms 500 --stream-final-mode prefix --port 8080 --ws-port 8081

## Start LFM2.5
bin\llama-server.exe --model "models\LFM2.5-2.6B-Q4_0.gguf" --port 8084 --reasoning-budget 0
The important part for the streaming ASR side is that I am now using the native CrispASR streaming WebSocket rather than treating /v1/realtime as the primary Nemotron streaming interface.

The native streaming endpoint is:

ws://127.0.0.1:8081

# Client Side





## Starting the client 
To launch the client use
node server.js

## Go to browser
Now go to http://localhost:8000/ to test this on browser.


