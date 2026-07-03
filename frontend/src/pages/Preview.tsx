import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTask } from '../hooks/useTask'
import { approveTask, parseApiError, regenerateTaskField, createStrategy } from '../lib/api'
import { TaskStatusBadge } from '../components/history/TaskStatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { Sparkles, RefreshCw, CheckCircle, ArrowRight, Laptop, Smartphone, Bookmark } from 'lucide-react'
import { EmailPreviewMock } from '../components/preview/EmailPreviewMock'
import { getBrandBrain } from '../hooks/useBrandBrain'
import type { TaskDraftContent, TaskStatus } from '../types'

export function Preview() {
  const { taskId } = useParams()
  const { task, loading, error, refetch } = useTask(taskId)

  // Local editable draft, initialised from task.draft_content
  const [draft, setDraft] = useState<TaskDraftContent>({ asunto: '', saludo: '', cuerpo: '', cta: '' })
  const [localStatus, setLocalStatus] = useState<TaskStatus | null>(null)
  const [approving, setApproving] = useState(false)
  const [approveMsg, setApproveMsg] = useState<string | null>(null)
  const [regeneratingField, setRegeneratingField] = useState<'asunto' | 'saludo' | 'cuerpo' | 'cta' | null>(null)

  const [brandName, setBrandName] = useState<string>('Nuestra Empresa')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')

  // Strategy states
  const [strategySaved, setStrategySaved] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [savingStrategy, setSavingStrategy] = useState(false)
  const [strategyError, setStrategyError] = useState<string | null>(null)

  // Load Brand Brain to get company name
  useEffect(() => {
    getBrandBrain()
      .then((brand) => {
        if (brand?.industria) {
          setBrandName(brand.industria)
        }
      })
      .catch(() => undefined)
  }, [])

  // Auto-generate a default strategy name
  useEffect(() => {
    if (!task) return
    const recipeLabel = task.recipe_type.charAt(0).toUpperCase() + task.recipe_type.slice(1)
    const paramDetail = task.params?.dias ? ` - ${task.params.dias} días` : ''
    Promise.resolve().then(() => setStrategyName(`${recipeLabel}${paramDetail}`))
  }, [task])

  const handleSaveStrategy = async () => {
    if (!taskId || !strategyName.trim()) return
    setSavingStrategy(true)
    setStrategyError(null)
    try {
      const res = await createStrategy(strategyName, taskId)
      if (res.success) {
        setStrategySaved(true)
        setIsModalOpen(false)
      }
    } catch (err) {
      setStrategyError(parseApiError(err))
    } finally {
      setSavingStrategy(false)
    }
  }



  // Sync draft & status when task loads (deferred to avoid set-state-in-effect)
  useEffect(() => {
    if (!task) return
    Promise.resolve().then(() => {
      if (task.draft_content) setDraft(task.draft_content)
      setLocalStatus(task.status)
    })
  }, [task])

  const handleApprove = async () => {
    if (!taskId) return
    setApproving(true)
    try {
      // Envia el draft editado (Human Gate): se persiste y se usa para el envio.
      const res = await approveTask(taskId, draft)
      if (res.success) {
        setLocalStatus(res.status)
        setApproveMsg(
          `${res.emails_sent} correos enviados` +
          (res.emails_failed > 0 ? ` · ${res.emails_failed} fallidos` : ''),
        )
        void refetch()
      }
    } catch (err) {
      setApproveMsg(parseApiError(err))
    } finally {
      setApproving(false)
    }
  }

  const handleRegenerate = async (field: 'asunto' | 'saludo' | 'cuerpo' | 'cta') => {
    if (!taskId) return
    setRegeneratingField(field)
    setApproveMsg(null)
    try {
      const res = await regenerateTaskField(taskId, field, draft)
      if (res.success) {
        setDraft(res.draft_content)
        // Recarga la tarea para reflejar costo/score actualizados (persistidos por el backend)
        void refetch()
      }
    } catch (err) {
      setApproveMsg(parseApiError(err))
    } finally {
      setRegeneratingField(null)
    }
  }

  /* ── Loading & error states ─────────────────────── */

  if (loading) return <section className="page"><Spinner label="Cargando campaña…" /></section>

  if (error || !task) {
    return (
      <section className="page stack">
        <Link to="/history">← Historial</Link>
        <div className="error-banner">⚠ {error ?? 'Campaña no encontrada.'}</div>
      </section>
    )
  }

  /* ── Render ─────────────────────────────────────── */

  const status = localStatus ?? task.status
  const recipientCount = Array.isArray(task.recipients) ? task.recipients.length : 0

  // Confirmación Visual Premium
  if (status === 'COMPLETED') {
    return (
      <section className="page stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/history">← Historial</Link>
          <TaskStatusBadge status={status} />
        </div>

        <div className="card success-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3.5rem 2rem', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="success-checkmark-wrapper">
            <CheckCircle size={64} className="success-checkmark-icon" style={{ color: 'var(--success)' }} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>¡Campaña Enviada con Éxito!</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            La IA ha finalizado la ejecución y los correos han sido distribuidos mediante Resend.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
            width: '100%', maxWidth: '400px', margin: '1rem 0',
            background: 'rgba(255,255,255,0.02)', padding: '1.25rem',
            borderRadius: '12px', border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div>
              <small style={{ opacity: 0.6, fontSize: '0.8rem' }}>Correos Enviados</small>
              <br />
              <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{approveMsg?.split('·')[0] || `${recipientCount} enviados`}</strong>
            </div>
            <div>
              <small style={{ opacity: 0.6, fontSize: '0.8rem' }}>Costo Invertido</small>
              <br />
              <strong style={{ fontSize: '1.25rem', color: '#fff' }}>${task.cost_usd.toFixed(4)} USD</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
            {strategySaved ? (
              <div className="badge badge-success" style={{ padding: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center', fontSize: '0.85rem', gap: '6px' }}>
                <CheckCircle size={15} />
                <span>Estrategia Guardada con éxito</span>
              </div>
            ) : (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsModalOpen(true)}
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Bookmark size={15} />
                <span>Guardar como estrategia</span>
              </button>
            )}

            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.25rem' }}>
              <Link to="/history" className="button" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Ver en Historial
              </Link>
              <Link to="/analytics" className="button button-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                Ir a Analíticas
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Modal para Guardar Estrategia */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content card stack" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Guardar como Estrategia</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Guarda la configuración de esta receta para volver a ejecutarla rápidamente desde el Dashboard con un solo clic.
              </p>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span>Nombre de la estrategia</span>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="Ej. Reactivación 60 días - Verano"
                  disabled={savingStrategy}
                  autoFocus
                />
              </label>

              {strategyError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>⚠ {strategyError}</p>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button"
                  disabled={savingStrategy}
                  onClick={() => {
                    setIsModalOpen(false)
                    setStrategyError(null)
                  }}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={savingStrategy || !strategyName.trim()}
                  onClick={() => void handleSaveStrategy()}
                  style={{ flex: 1 }}
                >
                  {savingStrategy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }


  return (
    <section className="page stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Link to="/history">← Historial</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TaskStatusBadge status={status} />
          <small style={{ opacity: 0.6 }}>#{task.id.slice(0, 8)}</small>
        </div>
      </div>

      {/* Mensajes de error o éxito superiores */}
      {approveMsg && (
        <div className="error-banner" style={{ marginBottom: '0.5rem' }}>⚠ {approveMsg}</div>
      )}

      {/* ── Diseño Split (Editor a la izquierda, Preview a la derecha) ── */}
      <div className="preview-split-layout">
        
        {/* Lado Izquierdo: Editor */}
        <div className="card stack editor-panel">
          <h2>Contenido generado por IA</h2>

          <label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span>Asunto</span>
              <button
                type="button"
                className="regen-field-btn"
                disabled={status === 'APPROVED' || regeneratingField !== null}
                onClick={() => void handleRegenerate('asunto')}
              >
                {regeneratingField === 'asunto' ? (
                  <>
                    <RefreshCw size={12} className="spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Regenerar con IA</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={draft.asunto}
              disabled={status === 'APPROVED' || regeneratingField === 'asunto'}
              onChange={(e) => setDraft({ ...draft, asunto: e.target.value })}
            />
          </label>

          <label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span>Saludo</span>
              <button
                type="button"
                className="regen-field-btn"
                disabled={status === 'APPROVED' || regeneratingField !== null}
                onClick={() => void handleRegenerate('saludo')}
              >
                {regeneratingField === 'saludo' ? (
                  <>
                    <RefreshCw size={12} className="spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Regenerar con IA</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={draft.saludo}
              disabled={status === 'APPROVED' || regeneratingField === 'saludo'}
              onChange={(e) => setDraft({ ...draft, saludo: e.target.value })}
            />
          </label>

          <label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span>Cuerpo</span>
              <button
                type="button"
                className="regen-field-btn"
                disabled={status === 'APPROVED' || regeneratingField !== null}
                onClick={() => void handleRegenerate('cuerpo')}
              >
                {regeneratingField === 'cuerpo' ? (
                  <>
                    <RefreshCw size={12} className="spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Regenerar con IA</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={12}
              value={draft.cuerpo}
              disabled={status === 'APPROVED' || regeneratingField === 'cuerpo'}
              onChange={(e) => setDraft({ ...draft, cuerpo: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </label>

          <label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span>CTA (botón)</span>
              <button
                type="button"
                className="regen-field-btn"
                disabled={status === 'APPROVED' || regeneratingField !== null}
                onClick={() => void handleRegenerate('cta')}
              >
                {regeneratingField === 'cta' ? (
                  <>
                    <RefreshCw size={12} className="spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Regenerar con IA</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={draft.cta}
              disabled={status === 'APPROVED' || regeneratingField === 'cta'}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
            />
          </label>
        </div>

        {/* Lado Derecho: Vista Previa Sticky */}
        <div className="preview-panel-wrapper stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Vista previa del correo</h3>
            
            {/* Control segmentado de dispositivo */}
            <div className="segmented-control device-selector">
              <button
                type="button"
                className={`segmented-btn ${deviceMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setDeviceMode('desktop')}
                title="Vista Escritorio"
              >
                <Laptop size={14} />
                <span>Escritorio</span>
              </button>
              <button
                type="button"
                className={`segmented-btn ${deviceMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setDeviceMode('mobile')}
                title="Vista Móvil"
              >
                <Smartphone size={14} />
                <span>Móvil</span>
              </button>
            </div>
          </div>

          <div className="email-preview-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
            {deviceMode === 'mobile' ? (
              <div className="mobile-bezel">
                <div className="mobile-speaker" />
                <div className="mobile-screen">
                  <EmailPreviewMock
                    draft={draft}
                    recipients={task.recipients}
                    brandName={brandName}
                  />
                </div>
                <div className="mobile-home-bar" />
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <EmailPreviewMock
                  draft={draft}
                  recipients={task.recipients}
                  brandName={brandName}
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Métricas de Auditoría ───────────────────── */}
      <div className="card stack">
        <h3>Auditoría</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <small style={{ opacity: 0.6 }}>Score IA</small>
            <br />
            <strong>{task.agent_score ?? '–'}/10</strong>
          </div>
          <div>
            <small style={{ opacity: 0.6 }}>Costo acumulado</small>
            <br />
            <strong>${task.cost_usd.toFixed(5)} USD</strong>
          </div>
          <div>
            <small style={{ opacity: 0.6 }}>Destinatarios</small>
            <br />
            <strong>{recipientCount}</strong>
          </div>
        </div>
      </div>

      {/* ── Lista de destinatarios ─────────────────── */}
      {Array.isArray(task.recipients) && task.recipients.length > 0 && (
        <div className="card stack">
          <h3>Destinatarios ({task.recipients.length})</h3>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {task.recipients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span>{c.nombre}</span>
                <small style={{ opacity: 0.5 }}>{c.email}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Aprobar & enviar ───────────────────────── */}
      {status === 'PENDING_APPROVAL' && (
        <button
          type="button"
          className="button button-primary"
          disabled={approving || regeneratingField !== null}
          onClick={() => void handleApprove()}
          style={{ width: '100%', padding: '1rem' }}
        >
          {approving ? 'Enviando…' : '✉ Aprobar y Enviar campaña'}
        </button>
      )}
    </section>
  )
}




