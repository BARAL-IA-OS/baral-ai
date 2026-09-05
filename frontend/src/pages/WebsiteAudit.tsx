import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Globe2, Search, ShieldCheck } from 'lucide-react'
import { authorizeWebsiteAudit, parseApiError, runWebsiteAudit } from '../lib/api'
import type { AuditFinding, WebsiteAudit as WebsiteAuditType } from '../types'

const scoreLabels: Record<string, string> = {
  overall: 'Global', performance: 'Rendimiento', seo: 'SEO', accessibility: 'Accesibilidad', conversion: 'Conversión',
}

export function WebsiteAudit() {
  const [showConsent, setShowConsent] = useState(true)
  const [url, setUrl] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [audit, setAudit] = useState<WebsiteAuditType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState<'ALL' | AuditFinding['priority']>('ALL')

  const findings = useMemo(() => {
    const all = audit?.result?.findings || []
    return priority === 'ALL' ? all : all.filter((finding) => finding.priority === priority)
  }, [audit, priority])

  async function authorizeAndRun() {
    if (!url.trim() || !accepted || loading) return
    setLoading(true); setError('')
    try {
      const consent = await authorizeWebsiteAudit(url)
      setShowConsent(false)
      const response = await runWebsiteAudit(consent.consent.id)
      setAudit(response.audit)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  function exportJson() {
    if (!audit?.result) return
    const blob = new Blob([JSON.stringify(audit.result, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = href; link.download = `auditoria-${audit.domain}.json`; link.click(); URL.revokeObjectURL(href)
  }

  return (
    <section className="page omar-page audit-page">
      <header className="omar-page-header audit-header">
        <div><span className="omar-eyebrow"><Globe2 size={14} /> Baral Audit</span><h1>Auditoría web</h1><p>Diagnóstico accionable de rendimiento, SEO, accesibilidad, conversión y preparación para agentes.</p></div>
        {audit?.result && <div className="audit-export-actions"><button type="button" className="button button-secondary" onClick={() => window.print()}><Download size={16} /> PDF / Imprimir</button><button type="button" className="button button-secondary" onClick={exportJson}><Download size={16} /> JSON</button></div>}
      </header>
      {error && <p className="omar-alert error">{error}</p>}
      {loading && !audit && <div className="audit-progress omar-panel"><span><Search size={24} /></span><div><h2>Auditando {url}</h2><p>Baral Audit está recorriendo el sitio y consolidando evidencias. Puede tardar cerca de un minuto.</p><i><b /></i></div></div>}
      {!loading && !audit && <div className="audit-empty omar-panel"><ShieldCheck size={40} /><h2>Primero, autorización. Después, evidencia.</h2><p>No iniciamos rastreos silenciosos. Autoriza un dominio para generar su diagnóstico.</p><button type="button" className="button button-primary" onClick={() => setShowConsent(true)}>Autorizar una auditoría</button></div>}
      {audit?.result && <>
        <section className="score-grid">{Object.entries(audit.result.scores).filter(([, value]) => typeof value === 'number').map(([key, value]) => <article className={`score-card score-${value >= 80 ? 'good' : value >= 55 ? 'medium' : 'low'}`} key={key}><div className="score-ring" style={{ '--score': `${value * 3.6}deg` } as React.CSSProperties}><strong>{Math.round(value)}</strong></div><span>{scoreLabels[key] || key}</span></article>)}</section>
        <div className="audit-dashboard-grid">
          <section className="audit-findings omar-panel"><div className="omar-section-title"><div><span>Hallazgos priorizados</span><h2>Qué corregir primero</h2></div><div className="priority-filter">{(['ALL','P0','P1','P2','P3'] as const).map((item) => <button key={item} type="button" className={priority === item ? 'is-selected' : ''} onClick={() => setPriority(item)}>{item === 'ALL' ? 'Todos' : item}</button>)}</div></div>
            <div className="finding-list">{findings.map((finding, index) => <article key={finding.id || `${finding.title}-${index}`}><span className={`priority priority-${finding.priority}`}>{finding.priority}</span><div><h3>{finding.title}</h3><p>{finding.what || finding.impactBusiness || 'Revisa la evidencia y aplica la recomendación.'}</p><small>{finding.category || 'Diagnóstico'} · Esfuerzo {finding.effort || 'por estimar'}</small></div></article>)}</div>
          </section>
          <aside className="audit-roadmap omar-panel"><span>Roadmap recomendado</span><h2>De riesgo a oportunidad</h2>{(['P0','P1','P2','P3'] as const).map((item, index) => { const count = audit.result?.findings.filter((finding) => finding.priority === item).length || 0; return <div key={item}><i>{index + 1}</i><p><strong>{item} · {count} hallazgos</strong><small>{item === 'P0' ? 'Corregir inmediatamente' : item === 'P1' ? 'Siguiente sprint' : item === 'P2' ? 'Optimización planificada' : 'Mejora continua'}</small></p></div>})}</aside>
        </div>
        <section className="audit-context-grid">
          <article className="omar-panel"><span>Stack tecnológico</span><strong>{audit.result.tech?.length || 0}</strong><p>Tecnologías y señales detectadas durante el recorrido.</p></article>
          <article className="omar-panel"><span>Preparación para IA</span><strong>{audit.result.agentReadiness ? 'Analizada' : 'Sin dato'}</strong><p>Capacidad del sitio para ser entendido y utilizado por agentes.</p></article>
          <article className="omar-panel"><span>Cobertura</span><strong>{audit.result.coverage ? 'Disponible' : 'Parcial'}</strong><p>Alcance y evidencias consideradas en este diagnóstico.</p></article>
        </section>
      </>}
      {showConsent && <div className="omar-modal-backdrop"><section className="omar-modal consent-modal" role="dialog" aria-modal="true"><div className="consent-icon"><ShieldCheck size={24} /></div><span className="omar-eyebrow">Autorización requerida</span><h2>Audita únicamente un sitio que administras</h2><p>Al continuar confirmas que tienes autorización para analizar este dominio. Guardaremos usuario, dominio, fecha y versión del consentimiento.</p><label><span>URL pública</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://tuempresa.com" autoFocus /></label><label className="consent-check"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>Autorizo a Baral AI a ejecutar una auditoría técnica sobre este dominio.</span></label>{error && <p className="omar-alert error"><AlertTriangle size={15} /> {error}</p>}<div className="omar-modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowConsent(false)}>Cancelar</button><button type="button" className="button button-primary" onClick={() => void authorizeAndRun()} disabled={!url.trim() || !accepted || loading}>{loading ? 'Autorizando…' : <><CheckCircle2 size={16} /> Autorizar e iniciar</>}</button></div></section></div>}
    </section>
  )
}
