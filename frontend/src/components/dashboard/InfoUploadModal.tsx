import { useState, useRef } from 'react'
import {
  X,
  Upload,
  Mic,
  Link,
} from 'lucide-react'

interface InfoUploadModalProps {
  title: string
  subtitle: string
  onClose: () => void
  initialText?: string
  onSaveText?: (value: string) => void
}

export function InfoUploadModal({
  title,
  subtitle,
  onClose,
  initialText = '',
  onSaveText,
}: InfoUploadModalProps) {
  const [contextText, setContextText] = useState(initialText)
  const [linkValue, setLinkValue] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="info-modal-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="info-modal">
        <div className="info-modal-glow" aria-hidden="true" />

        <div className="info-modal-header">
          <div className="info-modal-title-group">
            <h2 className="info-modal-title">{title}</h2>
            <span className="info-modal-subtitle">{subtitle}</span>
          </div>
          <button
            type="button"
            className="info-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="info-modal-write">
          <div className="info-modal-write-head">
            <span>Escribe o dicta información</span>
            <button type="button" className="info-modal-mic-btn" aria-label="Dictar por voz">
              <Mic size={17} strokeWidth={1.75} />
            </button>
          </div>
          <textarea
            value={contextText}
            onChange={(event) => setContextText(event.target.value)}
            placeholder="Pega información, describe tu empresa o dicta el contexto que quieres que Baral AI use."
            rows={5}
          />
        </div>

        <label className="info-modal-link">
          <Link size={17} strokeWidth={1.75} />
          <input
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://sitio-del-cliente.com"
          />
        </label>

        <div className="info-modal-dropzone">
          <div className="info-modal-drop-content">
            <p className="info-modal-drop-title">o suelta tus archivos</p>
          </div>

          <div className="info-modal-actions">
            <button type="button" className="info-modal-action-btn">
              <Upload size={16} strokeWidth={1.75} />
              Subir archivos
            </button>
          </div>
        </div>

        {onSaveText && (
          <div className="info-modal-footer">
            <button
              type="button"
              className="button button-primary info-modal-continue"
              onClick={() => {
                onSaveText([contextText, linkValue].filter(Boolean).join('\n'))
                onClose()
              }}
            >
              Guardar contexto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
