class AudioManager {
  constructor(ws) {
    this.ws = ws;
    this.localStream = null;
    this.isMuted = false;
    this.isDeafened = false;
    this.audioContext = null;
    this.analyser = null;
    this.speakingThreshold = 0.02;
    this.monitoringSpeaking = false;
    this.remoteAudioElements = new Map();
    this.audioProcessor = null;
    this.phaseVocoderProcessor = null;
    this.phaseVocoderProcessor2 = null;
    this.phaseVocoderProcessor3 = null;
    this.audioAvailable = false;
    this.currentFilter = 'none';
    this.filterNodes = {};
    this.usingPhaseVocoder = false;
  }

  async initialize() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Microphone access not available. Audio features disabled.');
      this.audioAvailable = false;
      return;
    }

    if (this.audioAvailable) return;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 48000
      });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      
      this.filterInput = this.audioContext.createGain();
      this.filterOutput = this.audioContext.createGain();
      
      source.connect(this.filterInput);
      this.filterInput.connect(this.filterOutput);
      this.filterOutput.connect(this.analyser);

      await this.audioContext.audioWorklet.addModule('/audio-worklet.js');
      await this.audioContext.audioWorklet.addModule('/phase-vocoder-worklet.js');
      
      this.audioProcessor = new AudioWorkletNode(this.audioContext, 'audio-processor', {
        processorOptions: {
          bufferSize: 4096
        }
      });
      
      this.phaseVocoderProcessor = new AudioWorkletNode(this.audioContext, 'phase-vocoder-processor');
      this.phaseVocoderProcessor2 = new AudioWorkletNode(this.audioContext, 'phase-vocoder-processor');
      this.phaseVocoderProcessor3 = new AudioWorkletNode(this.audioContext, 'phase-vocoder-processor');
      
      this.filterOutput.connect(this.audioProcessor);

      this.audioProcessor.port.onmessage = (event) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'audioData',
            data: event.data.data
          }));
        }
      };

      this.audioAvailable = true;
      this.monitorSpeaking();
      this.startVisualizer();
      
      const resumeAudioContext = async () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        this.remoteAudioElements.forEach((audio, userId) => {
          if (audio.audioContext && audio.audioContext.state === 'suspended') {
            audio.audioContext.resume();
          }
        });
      };
      
      document.addEventListener('click', resumeAudioContext, { once: true });
      document.addEventListener('keydown', resumeAudioContext, { once: true });
      
    } catch (error) {
      console.warn('Microphone access denied or unavailable. Audio features disabled.');
      this.audioAvailable = false;
    }
  }

  monitorSpeaking() {
    if (!this.analyser || this.monitoringSpeaking) return;

    this.monitoringSpeaking = true;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let isSpeaking = false;
    let speakingTimeout = null;

    const checkSpeaking = () => {
      if (!this.analyser || !this.monitoringSpeaking) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = average / 255;

      if (normalized > this.speakingThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'speaking',
              isSpeaking: true
            }));
          }
        }
        
        if (speakingTimeout) {
          clearTimeout(speakingTimeout);
        }
        
        speakingTimeout = setTimeout(() => {
          isSpeaking = false;
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'speaking',
              isSpeaking: false
            }));
          }
        }, 200);
      }

      requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();
  }

  stopMonitoringSpeaking() {
    this.monitoringSpeaking = false;
  }

  startVisualizer() {
    if (!this.analyser) return;

    const canvas = document.getElementById('audioVisualizer');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.analyser) return;

      requestAnimationFrame(draw);

      this.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#4ECDC4');
        gradient.addColorStop(1, '#45B7D1');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  async handleAudioData(from, data) {
    if (this.isDeafened) return;

    if (!this.remoteAudioElements.has(from)) {
      await this.createRemoteAudioElement(from);
    }

    const audio = this.remoteAudioElements.get(from);
    if (audio && audio.playbackProcessor) {
      if (audio.audioContext.state === 'suspended') {
        await audio.audioContext.resume();
      }
      
      audio.playbackProcessor.port.postMessage({
        type: 'addAudioData',
        data: data
      });
    }
  }

  async createRemoteAudioElement(userId) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 48000
    });

    await audioContext.audioWorklet.addModule('/audio-playback-worklet.js');
    
    const playbackProcessor = new AudioWorkletNode(audioContext, 'audio-playback-processor');
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.2;
    
    playbackProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const audio = {
      audioContext,
      playbackProcessor,
      gainNode
    };

    this.remoteAudioElements.set(userId, audio);
  }

  closeRemoteAudio(userId) {
    const audio = this.remoteAudioElements.get(userId);
    if (audio) {
      if (audio.audioContext) {
        audio.audioContext.close();
      }
      this.remoteAudioElements.delete(userId);
    }
  }

  closeAll() {
    this.stopMonitoringSpeaking();
    
    this.remoteAudioElements.forEach((audio, userId) => {
      this.closeRemoteAudio(userId);
    });
    this.remoteAudioElements.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor.port.close();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  toggleMute() {
    if (!this.audioAvailable) return false;
    
    this.isMuted = !this.isMuted;
    
    if (this.audioProcessor) {
      this.audioProcessor.port.postMessage({
        type: 'setMuted',
        isMuted: this.isMuted
      });
    }
    
    return this.isMuted;
  }

  toggleDeafen() {
    if (!this.audioAvailable) return false;
    
    this.isDeafened = !this.isDeafened;
    
    if (this.isDeafened) {
      this.remoteAudioElements.forEach((audio, userId) => {
        if (audio.audioContext) {
          audio.audioContext.suspend();
        }
      });
    } else {
      this.remoteAudioElements.forEach((audio, userId) => {
        if (audio.audioContext) {
          audio.audioContext.resume();
        }
      });
    }
    
    return this.isDeafened;
  }

  setFilter(filterType) {
    if (!this.audioAvailable) return;
    
    this.currentFilter = filterType;
    
    Object.values(this.filterNodes).forEach(node => {
      if (node) node.disconnect();
    });
    this.filterNodes = {};
    
    if (this.phaseVocoderProcessor) {
      this.phaseVocoderProcessor.disconnect();
    }
    
    if (filterType === 'none') {
      this.filterInput.disconnect();
      this.filterInput.connect(this.filterOutput);
      this.usingPhaseVocoder = false;
      return;
    }
    
    switch (filterType) {
      case 'reverb':
        this.createReverbFilter();
        break;
      case 'super-reverb':
        this.createSuperReverbFilter();
        break;
      case 'echo':
        this.createEchoFilter();
        break;
      case 'overdrive':
        this.createOverdriveFilter();
        break;
      case 'alien':
        this.createAlienFilter();
        break;
      case 'low':
        this.createLowPitchFilter();
        break;
    }
  }
  
  setupPhaseVocoder(pitchRatio) {
    this.filterInput.disconnect();
    this.filterInput.connect(this.phaseVocoderProcessor);
    this.phaseVocoderProcessor.connect(this.filterOutput);
    this.phaseVocoderProcessor.port.postMessage({
      type: 'setPitchRatio',
      pitchRatio: pitchRatio
    });
    this.usingPhaseVocoder = true;
  }

  createReverbFilter() {
    const convolver = this.audioContext.createConvolver();
    const rate = this.audioContext.sampleRate;
    const length = rate * 2;
    const impulse = this.audioContext.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    this.filterInput.connect(dryGain);
    this.filterInput.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(this.filterOutput);
    wetGain.connect(this.filterOutput);
    
    this.filterNodes = { convolver, dryGain, wetGain };
  }

  createSuperReverbFilter() {
    const convolver = this.audioContext.createConvolver();
    const rate = this.audioContext.sampleRate;
    const length = rate * 5;
    const impulse = this.audioContext.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 1.5);
      }
    }
    
    convolver.buffer = impulse;
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    dryGain.gain.value = 0.2;
    wetGain.gain.value = 1.5;
    
    this.filterInput.connect(dryGain);
    this.filterInput.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(this.filterOutput);
    wetGain.connect(this.filterOutput);
    
    this.filterNodes = { convolver, dryGain, wetGain };
  }

  createEchoFilter() {
    const delay = this.audioContext.createDelay(1.0);
    delay.delayTime.value = 0.3;
    
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.4;
    
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    dryGain.gain.value = 0.8;
    wetGain.gain.value = 0.5;
    
    this.filterInput.connect(dryGain);
    this.filterInput.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    dryGain.connect(this.filterOutput);
    wetGain.connect(this.filterOutput);
    
    this.filterNodes = { delay, feedback, dryGain, wetGain };
  }

  createOverdriveFilter() {
    const bassBoost = this.audioContext.createBiquadFilter();
    bassBoost.type = 'lowshelf';
    bassBoost.frequency.value = 200;
    bassBoost.gain.value = 35;
    
    const shaper = this.audioContext.createWaveShaper();
    const k = 200;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    
    shaper.curve = curve;
    shaper.oversample = '4x';
    
    const postGain = this.audioContext.createGain();
    postGain.gain.value = 1.2;
    
    this.filterInput.connect(bassBoost);
    bassBoost.connect(shaper);
    shaper.connect(postGain);
    postGain.connect(this.filterOutput);
    
    this.filterNodes = { bassBoost, shaper, postGain };
  }

  createAlienFilter() {
    this.filterInput.disconnect();
    this.filterInput.connect(this.phaseVocoderProcessor);
    this.phaseVocoderProcessor.port.postMessage({
      type: 'setPitchRatio',
      pitchRatio: 2.0
    });
    this.phaseVocoderProcessor.port.postMessage({
      type: 'setMuted',
      isMuted: false
    });
    this.usingPhaseVocoder = true;
    
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 3.0;
    
    this.phaseVocoderProcessor.connect(outputGain);
    outputGain.connect(this.filterOutput);
    
    this.filterNodes = { outputGain };
  }

  createLowPitchFilter() {
    this.filterInput.disconnect();
    this.filterInput.connect(this.phaseVocoderProcessor);
    this.phaseVocoderProcessor.port.postMessage({
      type: 'setPitchRatio',
      pitchRatio: 0.85
    });
    this.phaseVocoderProcessor.port.postMessage({
      type: 'setMuted',
      isMuted: false
    });
    this.usingPhaseVocoder = true;
    
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.3;
    
    this.phaseVocoderProcessor.connect(outputGain);
    outputGain.connect(this.filterOutput);
    
    this.filterNodes = { outputGain };
  }
}
