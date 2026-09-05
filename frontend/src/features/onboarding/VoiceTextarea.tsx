import { Mic, Square } from 'lucide-react'
import { TextareaField } from '../../components/ui/FormField'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

interface VoiceTextareaProps {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function VoiceTextarea({ label, value, placeholder, onChange }: VoiceTextareaProps) {
  const speech = useSpeechRecognition((text) => onChange(`${value}${value ? ' ' : ''}${text}`.trim()))
  return (
    <TextareaField
      label={label}
      value={value}
      placeholder={placeholder}
      rows={4}
      onChange={(event) => onChange(event.target.value)}
      hint={speech.error || (speech.listening ? 'Escuchando… habla con naturalidad.' : undefined)}
      action={
        <button
          type="button"
          className={`field-voice-button ${speech.listening ? 'is-listening' : ''}`}
          onClick={speech.listening ? speech.stop : speech.start}
          disabled={!speech.supported}
          aria-label={speech.listening ? 'Detener dictado' : `Dictar ${label}`}
        >
          {speech.listening ? <Square size={15} /> : <Mic size={17} />}
        </button>
      }
    />
  )
}
