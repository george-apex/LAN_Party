class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.port.onmessage = (event) => {
      if (event.data.type === 'setMuted') {
        this.isMuted = event.data.isMuted;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0 && output.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];

      if (!this.isMuted) {
        for (let i = 0; i < inputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
          this.buffer[this.bufferIndex] = inputChannel[i];
          this.bufferIndex++;

          if (this.bufferIndex >= this.bufferSize) {
            const pcmData = new Int16Array(this.bufferSize);
            for (let j = 0; j < this.bufferSize; j++) {
              pcmData[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32768));
            }

            this.port.postMessage({
              type: 'audioData',
              data: Array.from(pcmData)
            });

            this.bufferIndex = 0;
          }
        }
      } else {
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
