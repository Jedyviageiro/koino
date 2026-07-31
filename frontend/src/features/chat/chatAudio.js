let audioContext

export function playIncomingMessageSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  audioContext ||= new AudioContextClass()
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  const start = audioContext.currentTime
  ;[660, 880].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start + index * 0.09)
    gain.gain.exponentialRampToValueAtTime(0.07, start + index * 0.09 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.09 + 0.12)
    oscillator.connect(gain).connect(audioContext.destination)
    oscillator.start(start + index * 0.09)
    oscillator.stop(start + index * 0.09 + 0.13)
  })
}
