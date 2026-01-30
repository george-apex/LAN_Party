class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.queue = [];
    this.position = 0;
    this.currentBuffer = null;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'addAudioData') {
        this.queue.push(new Int16Array(event.data.data));
      } else if (event.data.type === 'clear') {
        this.queue = [];
        this.currentBuffer = null;
        this.position = 0;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    if (output.length > 0) {
      const outputChannel = output[0];
      
      for (let i = 0; i < outputChannel.length; i++) {
        if (this.currentBuffer && this.position < this.currentBuffer.length) {
          outputChannel[i] = this.currentBuffer[this.position] / 32768;
          this.position++;
        } else {
          outputChannel[i] = 0;
          
          if (this.queue.length > 0) {
            this.currentBuffer = this.queue.shift();
            this.position = 0;
            outputChannel[i] = this.currentBuffer[this.position] / 32768;
            this.position++;
          }
        }
      }
    }
    
    return true;
  }
}

registerProcessor('audio-playback-processor', AudioPlaybackProcessor);
