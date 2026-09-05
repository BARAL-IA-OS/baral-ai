import { useState } from 'react'
import { Check, Mic, Pencil, Save, X } from 'lucide-react'
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition'
import type { BusinessDNASectionName, BusinessDNASections } from '../types'
import type { BrandSource } from '../types'

export interface DNAFieldDefinition {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  list?: boolean
}

interface DNASectionCardProps<K extends BusinessDNASectionName> {
  section: K
  title: string
  description: string
  fields: DNAFieldDefinition[]
  value: BusinessDNASections[K]
  onSave: (section: K, value: BusinessDNASections[K]) => Promise<void>
  source?: BrandSource
}

function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const { listening, supported, error, start, stop } = useSpeechRecognition(onText)
  return (
    <>
      <button
        type="button"
        className={`field-voice-button ${listening ? 'is-listening' : ''}`}
        onClick={listening ? stop : start}
        disabled={!supported}
        aria-label={listening ? 'Detener dictado' : 'Dictar texto'}
        title={error || (supported ? 'Dictar texto' : 'Dictado no disponible')}
      >
        <Mic size={16} />
      </button>
      {listening && <span className="sr-only" role="status">Escuchando</span>}
    </>
  )
}

export function DNASectionCard<K extends BusinessDNASectionName>({
  section,
  title,
  description,
  fields,
  value,
  onSave,
  source,
}: DNASectionCardProps<K>) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...value })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await onSave(section, draft as BusinessDNASections[K])
      setEditing(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="dna-section-card">
      <header>
        <div><h2>{title}</h2><p>{description}</p>{source && <a className={`dna-source confidence-${source.confidence}`} href={source.source_url} target="_blank" rel="noreferrer">Fuente automática · confianza {source.confidence === 'high' ? 'alta' : source.confidence === 'medium' ? 'media' : 'baja'}</a>}</div>
        {!editing ? (
          <button type="button" className="icon-text-button" onClick={() => { setDraft({ ...value }); setEditing(true) }}>
            {saved ? <Check size={16} /> : <Pencil size={16} />}{saved ? 'Guardado' : 'Editar'}
          </button>
        ) : (
          <button type="button" className="icon-button" onClick={() => { setDraft({ ...value }); setEditing(false) }} aria-label="Cancelar edición">
            <X size={17} />
          </button>
        )}
      </header>
      <div className="dna-fields-grid">
        {fields.map((field) => {
          const raw = draft[field.key]
          const display = Array.isArray(raw) ? raw.join(', ') : String(raw ?? '')
          return (
            <div className="dna-value" key={field.key}>
              <span>{field.label}</span>
              {editing ? (
                field.multiline ? (
                  <div className="textarea-field-wrap">
                    <textarea
                      value={display}
                      placeholder={field.placeholder}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [field.key]: field.list
                          ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                          : event.target.value,
                      }))}
                    />
                    {!field.list && <VoiceButton onText={(text) => setDraft((current) => ({ ...current, [field.key]: `${String(current[field.key] ?? '')} ${text}`.trim() }))} />}
                  </div>
                ) : (
                  <input
                    value={display}
                    placeholder={field.placeholder}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      [field.key]: field.list
                        ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                        : event.target.value,
                    }))}
                  />
                )
              ) : (
                <strong className={!display ? 'is-empty' : ''}>{display || 'Sin completar'}</strong>
              )}
            </div>
          )
        })}
      </div>
      {editing && (
        <footer><button type="button" className="button button-primary" disabled={saving} onClick={() => void save()}><Save size={16} />{saving ? 'Guardando…' : 'Guardar sección'}</button></footer>
      )}
    </article>
  )
}
