import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTask } from '../hooks/useTask'
import { approveTask, parseApiError } from '../lib/api'
import { TaskStatusBadge } from '../components/history/TaskStatusBadge'
import { Spinner } from '../components/ui/Spinner'
import type { TaskDraftContent, TaskStatus } from '../types'

export function Preview() {
  const { taskId } = useParams()
  const { task, loading, error, refetch } = useTask(taskId)

  // Local editable draft, initialised from task.draft_content
  const [draft, setDraft] = useState<TaskDraftContent>({ asunto: '', saludo: '', cuerpo: '', cta: '' })
  const [localStatus, setLocalStatus] = useState<TaskStatus | null>(null)
  const [approving, setApproving] = useState(false)
  const [approveMsg, setApproveMsg] = useState<string | null>(null)

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
          `${res.emails_sent} emails enviados · ${res.emails_failed} fallidos`,
        )
        void refetch()
      }
    } catch (err) {
      setApproveMsg(parseApiError(err))
    } finally {
      setApproving(false)
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

  return (
    <section className="page stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/history">← Historial</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TaskStatusBadge status={status} />
          <small style={{ opacity: 0.6 }}>#{task.id.slice(0, 8)}</small>
        </div>
      </div>

      {/* ── Draft editable ─────────────────────────── */}
      <div className="card stack">
        <h2>Contenido generado por IA</h2>

        <label>
          <span>Asunto</span>
          <input
            type="text"
            value={draft.asunto}
            disabled={status === 'COMPLETED' || status === 'APPROVED'}
            onChange={(e) => setDraft({ ...draft, asunto: e.target.value })}
          />
        </label>

        <label>
          <span>Saludo</span>
          <input
            type="text"
            value={draft.saludo}
            disabled={status === 'COMPLETED' || status === 'APPROVED'}
            onChange={(e) => setDraft({ ...draft, saludo: e.target.value })}
          />
        </label>

        <label>
          <span>Cuerpo</span>
          <textarea
            rows={5}
            value={draft.cuerpo}
            disabled={status === 'COMPLETED' || status === 'APPROVED'}
            onChange={(e) => setDraft({ ...draft, cuerpo: e.target.value })}
            style={{ resize: 'vertical' }}
          />
        </label>

        <label>
          <span>CTA (botón)</span>
          <input
            type="text"
            value={draft.cta}
            disabled={status === 'COMPLETED' || status === 'APPROVED'}
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
            <small style={{ opacity: 0.6 }}>Costo</small>
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
          disabled={approving}
          onClick={() => void handleApprove()}
          style={{ width: '100%', padding: '1rem' }}
        >
          {approving ? 'Enviando…' : '✉ Aprobar y Enviar campaña'}
        </button>
      )}

      {approveMsg && (
        <p className="csv-match-note">✓ {approveMsg}</p>
      )}

      {status === 'COMPLETED' && !approveMsg && (
        <p className="csv-match-note">✓ Campaña completada y enviada.</p>
      )}
    </section>
  )
}

