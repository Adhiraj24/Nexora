// Generate crystal breaking sound using Web Audio API
export const playCrystalBreak = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create multiple oscillators for crystal breaking effect
  const playNote = (frequency, startTime, duration, type = 'sine') => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime + startTime);
    oscillator.stop(audioContext.currentTime + startTime + duration);
  };

  // Crystal breaking sound sequence
  playNote(800, 0, 0.1, 'sine');
  playNote(600, 0.05, 0.15, 'triangle');
  playNote(400, 0.1, 0.2, 'sine');
  playNote(300, 0.15, 0.15, 'triangle');
  playNote(200, 0.2, 0.1, 'sine');
  
  // Add white noise for shattering effect
  const bufferSize = audioContext.sampleRate * 0.3;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioContext.sampleRate * 0.05));
  }
  
  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  noise.buffer = buffer;
  noiseGain.gain.setValueAtTime(0.1, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  noise.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  noise.start(audioContext.currentTime);
};

// Alternative: Use actual audio file if you have one
export const playCrystalBreakFile = () => {
  const audio = new Audio('/sounds/message-delete.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Audio play failed:', err));
};