let audioContext

function getAudioContext() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

export function playBattleSound(type) {
  const context = getAudioContext()
  if (!context) return

  const sounds = {
    select: { frequency: 420, duration: 0.045, volume: 0.035 },
    correct: { frequency: 660, duration: 0.09, volume: 0.04 },
    incorrect: { frequency: 190, duration: 0.1, volume: 0.035 },
    warning: { frequency: 880, duration: 0.055, volume: 0.025 },
  }
  const sound = sounds[type]
  if (!sound) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime

  oscillator.type = type === 'incorrect' ? 'triangle' : 'sine'
  oscillator.frequency.setValueAtTime(sound.frequency, now)
  gain.gain.setValueAtTime(sound.volume, now)
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + sound.duration,
  )
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + sound.duration)
}
