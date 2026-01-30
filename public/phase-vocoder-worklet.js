class PhaseVocoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.fftSize = 2048;
    this.hopSize = 512;
    this.windowSize = this.fftSize;
    
    this.inputBuffer = new Float32Array(this.windowSize * 2);
    this.inputBufferIndex = 0;
    
    this.outputBuffer = new Float32Array(this.windowSize * 4);
    this.outputBufferReadIndex = 0;
    this.outputBufferWriteIndex = 0;
    
    this.window = this.createHanningWindow(this.windowSize);
    
    this.previousPhase = new Float32Array(this.fftSize / 2 + 1);
    this.synthesisPhase = new Float32Array(this.fftSize / 2 + 1);
    
    this.outputAccumulator = new Float32Array(this.windowSize);
    
    this.pitchRatio = 1.0;
    this.isMuted = false;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'setPitchRatio') {
        this.pitchRatio = event.data.pitchRatio;
      }
      if (event.data.type === 'setMuted') {
        this.isMuted = event.data.isMuted;
      }
    };
  }
  
  createHanningWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }
  
  fft(real, imag) {
    const n = real.length;
    const levels = Math.log2(n);
    
    for (let i = 0; i < n; i++) {
      const j = this.reverseBits(i, levels);
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
    
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = Math.PI / halfSize;
      
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const angle = step * j;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          const idx1 = i + j;
          const idx2 = i + j + halfSize;
          
          const tReal = real[idx2] * cos - imag[idx2] * sin;
          const tImag = real[idx2] * sin + imag[idx2] * cos;
          
          real[idx2] = real[idx1] - tReal;
          imag[idx2] = imag[idx1] - tImag;
          real[idx1] = real[idx1] + tReal;
          imag[idx1] = imag[idx1] + tImag;
        }
      }
    }
  }
  
  ifft(real, imag) {
    const n = real.length;
    for (let i = 0; i < n; i++) {
      imag[i] = -imag[i];
    }
    this.fft(real, imag);
    for (let i = 0; i < n; i++) {
      real[i] /= n;
      imag[i] = -imag[i] / n;
    }
  }
  
  reverseBits(n, bits) {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (n & 1);
      n >>= 1;
    }
    return reversed;
  }
  
  processFrame(inputFrame) {
    const real = new Float32Array(this.fftSize);
    const imag = new Float32Array(this.fftSize);
    
    for (let i = 0; i < this.windowSize; i++) {
      real[i] = inputFrame[i] * this.window[i];
    }
    
    this.fft(real, imag);
    
    const magnitude = new Float32Array(this.fftSize / 2 + 1);
    const phase = new Float32Array(this.fftSize / 2 + 1);
    
    for (let i = 0; i < this.fftSize / 2 + 1; i++) {
      magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      phase[i] = Math.atan2(imag[i], real[i]);
    }
    
    const outputMagnitude = new Float32Array(this.fftSize / 2 + 1);
    const outputPhase = new Float32Array(this.fftSize / 2 + 1);
    
    for (let i = 0; i < this.fftSize / 2 + 1; i++) {
      const bin = Math.floor(i / this.pitchRatio);
      if (bin < this.fftSize / 2 + 1) {
        outputMagnitude[i] = magnitude[bin];
        
        const phaseDiff = phase[bin] - this.previousPhase[bin];
        const expectedDiff = (2 * Math.PI * this.hopSize * bin) / this.fftSize;
        const deviation = phaseDiff - expectedDiff;
        
        const principalDeviation = Math.atan2(Math.sin(deviation), Math.cos(deviation));
        this.synthesisPhase[i] = this.synthesisPhase[i] + expectedDiff + principalDeviation;
        
        outputPhase[i] = this.synthesisPhase[i];
      }
    }
    
    for (let i = 0; i < this.fftSize / 2 + 1; i++) {
      this.previousPhase[i] = phase[i];
    }
    
    const outputReal = new Float32Array(this.fftSize);
    const outputImag = new Float32Array(this.fftSize);
    
    for (let i = 0; i < this.fftSize / 2 + 1; i++) {
      outputReal[i] = outputMagnitude[i] * Math.cos(outputPhase[i]);
      outputImag[i] = outputMagnitude[i] * Math.sin(outputPhase[i]);
    }
    
    for (let i = 1; i < this.fftSize / 2; i++) {
      outputReal[this.fftSize - i] = outputReal[i];
      outputImag[this.fftSize - i] = -outputImag[i];
    }
    
    this.ifft(outputReal, outputImag);
    
    const outputFrame = new Float32Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      outputFrame[i] = outputReal[i] * this.window[i];
    }
    
    return outputFrame;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length > 0 && output.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        if (!this.isMuted) {
          this.inputBuffer[this.inputBufferIndex] = inputChannel[i];
          this.inputBufferIndex++;
          
          if (this.inputBufferIndex >= this.windowSize) {
            const frame = this.inputBuffer.slice(0, this.windowSize);
            const processedFrame = this.processFrame(frame);
            
            for (let j = 0; j < this.windowSize; j++) {
              this.outputAccumulator[j] += processedFrame[j];
            }
            
            for (let j = 0; j < this.hopSize; j++) {
              if (this.outputBufferWriteIndex < this.outputBuffer.length) {
                this.outputBuffer[this.outputBufferWriteIndex] = this.outputAccumulator[j];
                this.outputBufferWriteIndex++;
              }
            }
            
            for (let j = 0; j < this.hopSize; j++) {
              this.outputAccumulator[j] = this.outputAccumulator[j + this.hopSize];
            }
            for (let j = this.hopSize; j < this.windowSize; j++) {
              this.outputAccumulator[j] = 0;
            }
            
            const remaining = this.windowSize - this.hopSize;
            for (let j = 0; j < remaining; j++) {
              this.inputBuffer[j] = this.inputBuffer[this.hopSize + j];
            }
            this.inputBufferIndex = remaining;
          }
        }
      }
      
      for (let i = 0; i < outputChannel.length; i++) {
        if (this.outputBufferReadIndex < this.outputBufferWriteIndex) {
          outputChannel[i] = this.outputBuffer[this.outputBufferReadIndex];
          this.outputBufferReadIndex++;
        } else {
          outputChannel[i] = 0;
        }
      }
      
      if (this.outputBufferReadIndex >= this.outputBuffer.length / 2) {
        const remaining = this.outputBufferWriteIndex - this.outputBufferReadIndex;
        for (let i = 0; i < remaining; i++) {
          this.outputBuffer[i] = this.outputBuffer[this.outputBufferReadIndex + i];
        }
        this.outputBufferWriteIndex = remaining;
        this.outputBufferReadIndex = 0;
      }
    }
    
    return true;
  }
}

registerProcessor('phase-vocoder-processor', PhaseVocoderProcessor);
