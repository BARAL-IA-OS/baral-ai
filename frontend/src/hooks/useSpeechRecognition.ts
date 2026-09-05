import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionResultLike {
  readonly length: number
  [index: number]: { transcript: string }
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const callbackRef = useRef(onTranscript)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const speechWindow = window as SpeechRecognitionWindow
  const supported = Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition)

  useEffect(() => {
    callbackRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    setError(null)
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Constructor) {
      setError('El dictado no está disponible en este navegador.')
      return
    }
    recognitionRef.current?.stop()
    const recognition = new Constructor()
    recognition.lang = 'es-BO'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) callbackRef.current(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setError('No se pudo capturar el audio. Inténtalo nuevamente.')
    }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [speechWindow.SpeechRecognition, speechWindow.webkitSpeechRecognition])

  return { supported, listening, error, start, stop }
}
