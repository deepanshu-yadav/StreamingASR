# start a tts server

 bin\crispasr.exe --server --backend piper -m "models\hi_IN-rohan-medium.gguf" --port 8089 -l hi -t 8 --no-spoken-disclaimer --accept-marking-responsibility


# test the tts server

  curl -s http://localhost:8089/v1/audio/speech ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"piper\",\"input\":\"हेलो, आप आज कैसे हैं? आज आपने बहुत अच्छा काम किया, मुझे आप पर बहुत गर्व है।\",\"spoken_disclaimer\":false,\"stream\":true,\"response_format\":\"pcm\"}" ^
  | ffplay -f s16le -ar 22050 -nodisp -

# you can even pip the out of tts to stt

  curl -s -N http://localhost:8080/v1/audio/speech -H "Content-Type: application/json" -d "{\"model\":\"piper\",\"input\":\"हेलो, आप आज कैसे हैं? आज आपने बहुत अच्छा काम किया, मुझे आप पर बहुत गर्व है।\",\"spoken_disclaimer\":false,\"stream\":true,\"response_format\":\"pcm\"}" | ffmpeg -loglevel error -f s16le -ar 22050 -ac 1 -i - -f s16le -ar 16000 -ac 1 - | bin\crispasr.exe --stream --stream-json -m "models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf" -l hi --vad --vad-model "models\ggml-silero.bin" --stream-final-on-silence-ms 800


# start a stt server

bin\crispasr.exe --server --backend nemotron -m "models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf" -l hi --vad --vad-model "models\ggml-silero.bin" --port 8080 --ws-port 8081 --stream-json




# single file output to stt server


curl -s -X POST http://localhost:8080/v1/audio/transcriptions -F file=@file.wav -F model=nemotron -F language=hi


# ffmpeg output to server not sure it is full stream ->  full stream is 8081 websockets  

ffmpeg -loglevel error -i file.wav -f wav - | curl -s -X POST http://localhost:8080/v1/audio/transcriptions -F "file=@-;filename=audio.wav;type=audio/wav" -F model=nemotron -F language=hi


# Stream a file directly to stt server 

ffmpeg -i file.wav -f s16le -ar 16000 -ac 1 -   | bin\crispasr.exe --backend nemotron -m "models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf" -l hi --vad --vad-model "models\ggml-silero.bin" --stream --stream-json --stream-partial-decode-ms 500 --stream-final-mode prefix 


## how to run the server for crispasr streaming mode 

```
set CRISPASR_NEMOTRON_STREAMING=1
bin\crispasr.exe --server --backend nemotron -m "models\nemotron-3.5-asr-streaming-0.6b-q4_k.gguf" -l hi --vad --vad-model "models\ggml-silero.bin" --stream --stream-json --stream-partial-decode-ms 500 --stream-final-mode prefix --port 8080 --ws-port 8081
```

## Run the client 
node server.js


# run alama server

bin\llama-server.exe --model "models\LFM2.5-2.6B-Q4_0.gguf" --port 8084 --reasoning-budget 0

# testing lama server
curl http://localhost:8084/v1/chat/completions -H "Content-Type: application/json" -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Say hello!\"}]}" 
