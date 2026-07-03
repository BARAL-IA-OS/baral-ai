import { useRef, useState } from 'react'
import { X, Globe, Upload, Loader2, Sparkles, ChevronDown, Mail } from 'lucide-react'
import { extractBrandFromUrl, extractBrandFromFile, parseApiError } from '../../lib/api'
import type { BrandExtractFields } from '../../types'

interface BrandExtractResult {
  nombre_empresa: string
  fields: BrandExtractFields
  url?: string
}

interface BrandExtractModalProps {
  onApply: (result: BrandExtractResult) => void
  onClose: () => void
}

const REQUEST_SITE_MAILTO =
  'mailto:hola@baral.ai?subject=Quiero%20solicitar%20mi%20p%C3%A1gina%20web'

const FIELD_LABELS: Array<{ key: keyof BrandExtractFields; label: string }> = [
  { key: 'industria', label: 'Industria y actividad' },
  { key: 'propuesta', label: 'Propuesta de valor' },
  { key: 'tono', label: 'Tono de comunicación' },
  { key: 'audiencia', label: 'Audiencia principal' },
  { key: 'diferenciador', label: 'Diferenciador' },
]

const EMPTY: BrandExtractFields = {
  industria: '', propuesta: '', tono: '', audiencia: '', diferenciador: '',
}

export function BrandExtractModal({ onApply, onClose }: BrandExtractModalProps) {
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [url, setUrl] = useState('')
  const [appliedUrl, setAppliedUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [fields, setFields] = useState<BrandExtractFields | null>(null)
  const [rawText, setRawText] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  async function runUrl() {
    if (!url.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await extractBrandFromUrl(url.trim())
      setNombre(res.nombre_empresa || '')
      setFields({ ...EMPTY, ...res.fields })
      setRawText(res.raw_text)
      setAppliedUrl(url.trim())
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function runFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const res = await extractBrandFromFile(file)
      setNombre(res.nombre_empresa || '')
      setFields({ ...EMPTY, ...res.fields })
      setRawText(res.raw_text)
      setAppliedUrl(undefined)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  function updateField(key: keyof BrandExtractFields, value: string) {
    setFields((current) => ({ ...(current ?? EMPTY), [key]: value }))
  }

  return (
    <div
      className="info-modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="info-modal" style={{ maxWidth: 620 }}>
        <div className="info-modal-glow" aria-hidden="true" />

        <div className="info-modal-header">
          <div className="info-modal-title-group">
            <h2 className="info-modal-title">Autocompletar Brand Brain</h2>
            <span className="info-modal-subtitle">Desde tu página web o un documento de tu empresa</span>
          </div>
          <button type="button" className="info-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Selector de fuente */}
        <div className="brand-extract-tabs">
          <button type="button" className={mode === 'url' ? 'is-active' : ''} onClick={() => setMode('url')}>
            <Globe size={15} /> Página web
          </button>
          <button type="button" className={mode === 'file' ? 'is-active' : ''} onClick={() => setMode('file')}>
            <Upload size={15} /> Documento
          </button>
        </div>

        {mode === 'url' ? (
          <>
            <div className="brand-extract-source">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tuempresa.com"
                onKeyDown={(e) => { if (e.key === 'Enter') void runUrl() }}
              />
              <button type="button" className="button button-primary" disabled={!url.trim() || loading} onClick={() => void runUrl()}>
                {loading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
                {loading ? 'Analizando...' : 'Analizar'}
              </button>
            </div>
            <a className="brand-extract-request" href={REQUEST_SITE_MAILTO}>
              <Mail size={13} /> ¿No tienes página web? Solicita la tuya
            </a>
          </>
        ) : (
          <label className="brand-extract-drop">
            <Upload size={20} strokeWidth={1.6} />
            <strong>Sube un archivo</strong>
            <small>PDF, DOCX, MD o TXT · máx 10 MB</small>
            <input
              type="file"
              accept=".pdf,.docx,.md,.txt,.markdown"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void runFile(f) }}
            />
          </label>
        )}

        {error && <p className="form-message form-message-error">{error}</p>}

        {/* Editor de campos extraídos */}
        {fields && (
          <div className="brand-extract-result">
            <p className="brand-extract-hint">Revisa y edita lo que la IA obtuvo antes de aplicar:</p>
            <label className="brand-extract-field">
              <span>Nombre de la empresa</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Studio Foto"
              />
            </label>
            {FIELD_LABELS.map(({ key, label }) => (
              <label key={key} className="brand-extract-field">
                <span>{label}</span>
                <textarea
                  rows={2}
                  value={fields[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder="La IA no encontró esto — puedes escribirlo."
                />
              </label>
            ))}

            {rawText && (
              <div className="brand-extract-raw">
                <button type="button" onClick={() => setShowRaw((v) => !v)}>
                  <ChevronDown size={14} style={{ transform: showRaw ? 'rotate(180deg)' : 'none' }} />
                  {showRaw ? 'Ocultar' : 'Ver'} texto extraído
                </button>
                {showRaw && <pre className="brand-extract-raw-text">{rawText}</pre>}
              </div>
            )}
          </div>
        )}

        {fields && (
          <div className="info-modal-footer">
            <button
              type="button"
              className="button button-primary info-modal-continue"
              onClick={() => { onApply({ nombre_empresa: nombre.trim(), fields, url: appliedUrl }); onClose() }}
            >
              Aplicar al formulario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
