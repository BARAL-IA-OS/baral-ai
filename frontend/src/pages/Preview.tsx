import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTask } from '../hooks/useTask'
import { approveTask, parseApiError, regenerateTaskField } from '../lib/api'
import { TaskStatusBadge } from '../components/history/TaskStatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { Sparkles, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react'
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
        // Actualizar datos de la tarea localmente para mostrar costo y score correctos
        if (task) {
          task.cost_usd = res.cost_usd
          task.agent_score = res.agent_score
        }
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

          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <Link to="/history" className="button" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Ver en Historial
            </Link>
            <Link to="/analytics" className="button button-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              Ir a Analíticas
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/history">← Historial</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TaskStatusBadge status={status} />
          <small style={{ opacity: 0.6 }}>#{task.id.slice(0, 8)}</small>
        </div>
      </div>

      {/* Mensajes de error o éxito superiores */}
      {approveMsg && (
        <div className="error-banner">⚠ {approveMsg}</div>
      )}

      {/* ── Draft editable ─────────────────────────── */}
      <div className="card stack">
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
            rows={8}
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

      {/* ── Métricas & destinatarios ───────────────── */}
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


