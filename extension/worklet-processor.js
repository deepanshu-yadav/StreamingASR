class MicProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input && input[0]) {
            const ch = input[0];
            let sum = 0;
            for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
            const rms = Math.sqrt(sum / ch.length);
            const copy = ch.slice(0);
            this.port.postMessage({ samples: copy, rms }, [copy.buffer]);
        }
        return true;
    }
}
registerProcessor('mic-processor', MicProcessor);
