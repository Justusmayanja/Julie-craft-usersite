/**
 * Sound Notification Utility
 * Provides functions to play notification sounds for new orders, notifications, and chat messages
 */

// Generate a simple notification sound using Web Audio API
export function playNotificationSound(type: 'order' | 'notification' | 'chat' = 'notification'): void {
  try {
    // Check if audio context is available
    if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
      console.warn('Web Audio API not supported')
      return
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()

    // Create a pleasant notification sound
    // Different tones for different notification types:
    // - Order: 800Hz (higher, more urgent)
    // - Chat: 1000Hz (distinct, friendly tone)
    // - Notification: 600Hz (standard)
    const frequency = type === 'order' ? 800 : type === 'chat' ? 1000 : 600
    const duration = 0.2
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure the sound
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    // Create a pleasant envelope (fade in/out)
    const now = audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01) // Quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration) // Fade out

    // Play the sound
    oscillator.start(now)
    oscillator.stop(now + duration)

    // Clean up
    oscillator.onended = () => {
      audioContext.close()
    }
  } catch (error) {
    console.error('Error playing notification sound:', error)
    // Fallback: Try using HTML5 Audio if Web Audio API fails
    playFallbackSound()
  }
}

// Fallback sound using HTML5 Audio (simpler but less customizable)
function playFallbackSound(): void {
  try {
    // Create a data URL for a simple beep sound
    // This is a very short beep at 800Hz
    const sampleRate = 44100
    const duration = 0.2
    const frequency = 800
    const numSamples = Math.floor(sampleRate * duration)
    const buffer = new ArrayBuffer(44 + numSamples * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + numSamples * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, numSamples * 2, true)

    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
      view.setInt16(44 + i * 2, intSample, true)
    }

    const blob = new Blob([buffer], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    
    audio.volume = 0.3
    audio.play().catch(err => {
      console.error('Error playing fallback sound:', err)
      URL.revokeObjectURL(url)
    })

    // Clean up after playing
    audio.onended = () => {
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Error creating fallback sound:', error)
  }
}

// Check if sound notifications are enabled (stored in localStorage)
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem('notification-sound-enabled')
  return stored === null ? true : stored === 'true' // Default to enabled
}

// Toggle sound notifications
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('notification-sound-enabled', enabled.toString())
}

