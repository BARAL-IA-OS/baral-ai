import { useEffect, useState } from 'react'
import { CheckCircle, Laptop, RefreshCw, Send, Smartphone, Sparkles } from 'lucide-react'
import { approveTask, parseApiError, regenerateTaskField } from '../../lib/api'
import { getBrandBrain } from '../../hooks/useBrandBrain'
import { useTask } from '../../hooks/useTask'
import { TaskStatusBadge } from '../history/TaskStatusBadge'
import { EmailPreviewMock } from '../preview/EmailPreviewMock'
import { Spinner } from '../ui/Spinner'
import type { Client, TaskDraftContent, TaskStatus } from '../../types'

interface InlineTaskPreviewProps {
  taskId: string
  onReady?: () => void
}

export function InlineTaskPreview({ taskId, onReady }: InlineTaskPreviewProps) {
  const { task, loading, error, refetch } = useTask(taskId)
  const [draft, setDraft] = useState<TaskDraftContent>({ asunto: '', saludo: '', cuerpo: '', cta: '' })
  const [localStatus, setLocalStatus] = useState<TaskStatus | null>(null)
  const [brandName, setBrandName] = useState('Nuestra Empresa')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [approving, setApproving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [regeneratingField, setRegeneratingField] = useState<'asunto' | 'saludo' | 'cuerpo' | 'cta' | null>(null)
  const [showRecipients, setShowRecipients] = useState(false)

  useEffect(() => {
    getBrandBrain()
      .then((brand) => {
        if (brand?.industria) setBrandName(brand.industria)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!task) return
    Promise.resolve().then(() => {
      if (task.draft_content) setDraft(task.draft_content)
      setLocalStatus(task.status)
      onReady?.()
    })
  }, [task, onReady])

  async function handleRegenerate(field: 'asunto' | 'saludo' | 'cuerpo' | 'cta') {
    setRegeneratingField(field)
    setMessage(null)
    try {
      const res = await regenerateTaskField(taskId, field, draft)
      if (res.success) {
        setDraft(res.draft_content)
        void refetch()
      }
    } catch (err) {
      setMessage(parseApiError(err))
    } finally {
      setRegeneratingField(null)
    }
  }

  async function handleApprove() {
    setApproving(true)
    setMessage(null)
    try {
      const res = await approveTask(taskId, draft)
      if (res.success) {
        setLocalStatus(res.status)
        setMessage(`${res.emails_sent} correos enviados${res.emails_failed > 0 ? `, ${res.emails_failed} fallidos` : ''}`)
        void refetch()
      }
    } catch (err) {
      setMessage(parseApiError(err))
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <section className="inline-preview-card">
        <Spinner label="Cargando contenido generado..." />
      </section>
    )
  }

  if (error || !task) {
    return <div className="error-banner">{error ?? 'Campaña no encontrada.'}</div>
  }

  const status = localStatus ?? task.status
  const locked = status === 'APPROVED' || status === 'COMPLETED'
  const recipientCount = Array.isArray(task.recipients) ? task.recipients.length : 0

  return (
    <section className="inline-preview-card" id="resultado">
      <div className="inline-preview-header">
        <div>
          <span className="dashboard-eyebrow">Resultado generado</span>
          <h2>Revisa y aprueba la campaña</h2>
          <p>Edita el texto final antes de enviarlo a tus destinatarios.</p>
        </div>
        <div className="inline-preview-status">
          <TaskStatusBadge status={status} />
          <small>#{task.id.slice(0, 8)}</small>
        </div>
      </div>

      {message && <div className="error-banner">{message}</div>}

      <div className="preview-split-layout recipe-preview-split">
        <div className="card stack editor-panel">
          <h3>Contenido generado por IA</h3>
          <EditableField label="Asunto" value={draft.asunto} disabled={locked || regeneratingField === 'asunto'} regenerating={regeneratingField === 'asunto'} onChange={(value) => setDraft({ ...draft, asunto: value })} onRegenerate={() => void handleRegenerate('asunto')} />
          <EditableField label="Saludo" value={draft.saludo} disabled={locked || regeneratingField === 'saludo'} regenerating={regeneratingField === 'saludo'} onChange={(value) => setDraft({ ...draft, saludo: value })} onRegenerate={() => void handleRegenerate('saludo')} />
          <EditableField label="Cuerpo" value={draft.cuerpo} multiline disabled={locked || regeneratingField === 'cuerpo'} regenerating={regeneratingField === 'cuerpo'} onChange={(value) => setDraft({ ...draft, cuerpo: value })} onRegenerate={() => void handleRegenerate('cuerpo')} />
          <EditableField label="CTA" value={draft.cta} disabled={locked || regeneratingField === 'cta'} regenerating={regeneratingField === 'cta'} onChange={(value) => setDraft({ ...draft, cta: value })} onRegenerate={() => void handleRegenerate('cta')} />
        </div>

        <div className="preview-panel-wrapper stack">
          <div className="inline-preview-toolbar">
            <h3>Vista previa del correo</h3>
            <div className="segmented-control device-selector">
              <button type="button" className={`segmented-btn ${deviceMode === 'desktop' ? 'active' : ''}`} onClick={() => setDeviceMode('desktop')}>
                <Laptop size={14} />
                <span>Escritorio</span>
              </button>
              <button type="button" className={`segmented-btn ${deviceMode === 'mobile' ? 'active' : ''}`} onClick={() => setDeviceMode('mobile')}>
                <Smartphone size={14} />
                <span>Móvil</span>
              </button>
            </div>
          </div>

          <div className="email-preview-container">
            {deviceMode === 'mobile' ? (
              <div className="mobile-bezel">
                <div className="mobile-speaker" />
                <div className="mobile-screen">
                  <EmailPreviewMock draft={draft} recipients={task.recipients} brandName={brandName} />
                </div>
                <div className="mobile-home-bar" />
              </div>
            ) : (
              <EmailPreviewMock draft={draft} recipients={task.recipients} brandName={brandName} />
            )}
          </div>
        </div>
      </div>

      <div className="recipe-audit-bar">
        <span><strong>{task.agent_score ?? '-'}/10</strong> Score IA</span>
        <span className="recipe-audit-dot" />
        <span><strong>${task.cost_usd.toFixed(5)}</strong> Costo</span>
        <span className="recipe-audit-dot" />
        <button type="button" className="recipe-audit-btn" onClick={() => setShowRecipients(true)}>
          <strong>{recipientCount}</strong> Destinatarios (Ver lista)
        </button>
      </div>

      {status === 'PENDING_APPROVAL' && (
        <div className="recipe-approve-wrap">
          {recipientCount === 0 && (
            <div className="recipe-warning-banner">
              ⚠️ No hay clientes que cumplan con la condición. Importa más clientes o cambia la configuración.
            </div>
          )}
          <button type="button" className="button button-primary recipe-approve-btn" disabled={approving || regeneratingField !== null || recipientCount === 0} onClick={() => void handleApprove()}>
            {approving ? <RefreshCw size={16} className="spin-icon" /> : <Send size={16} />}
            {approving ? 'Enviando...' : 'Aprobar y enviar campaña'}
          </button>
        </div>
      )}

      {(status === 'APPROVED' || status === 'COMPLETED') && (
        <div className="badge badge-success recipe-approved">
          <CheckCircle size={15} />
          Campaña aprobada
        </div>
      )}

      {showRecipients && (
        <div className="modal-overlay" onClick={() => setShowRecipients(false)}>
          <div className="modal-content recipe-recipients-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Destinatarios seleccionados</h2>
              <button type="button" className="modal-close" onClick={() => setShowRecipients(false)}>✕</button>
            </div>
            <div className="modal-body">
              {recipientCount === 0 ? (
                <p className="text-muted">No se encontraron clientes para esta campaña.</p>
              ) : (
                <div className="clients-table-wrap">
                  <table className="clients-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(task.recipients ?? []).map((client: Client) => (
                        <tr key={client.id}>
                          <td className="clients-name">{client.nombre}</td>
                          <td>{client.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function EditableField({
  label,
  value,
  multiline,
  disabled,
  regenerating,
  onChange,
  onRegenerate,
}: {
  label: string
  value: string
  multiline?: boolean
  disabled: boolean
  regenerating: boolean
  onChange: (value: string) => void
  onRegenerate: () => void
}) {
  return (
    <label>
      <div className="inline-field-head">
        <span>{label}</span>
        <button type="button" className="regen-field-btn" disabled={disabled || regenerating} onClick={onRegenerate}>
          {regenerating ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
          <span>{regenerating ? 'Regenerando...' : 'Regenerar con IA'}</span>
        </button>
      </div>
      {multiline ? (
        <textarea rows={10} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type="text" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}
