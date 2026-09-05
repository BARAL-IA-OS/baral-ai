import { useEffect, useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Globe2, Loader2, Plus, Sparkles } from 'lucide-react'
import { InputField, TextareaField } from '../../components/ui/FormField'
import { completeOnboarding, confirmBusinessExtraction, getBusinessExtraction, startBusinessExtraction } from '../business-dna/api'
import type { BusinessDNASections, ExtractionJob } from '../business-dna/types'
import { parseApiError } from '../../lib/api'

interface WebsiteOnboardingProps { onComplete: () => void; onBack: () => void; initialJobId?: string | null }

export function WebsiteOnboarding({ onComplete, onBack, initialJobId }: WebsiteOnboardingProps) {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<ExtractionJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!initialJobId) return
    getBusinessExtraction(initialJobId).then((result) => setJob(result.job)).catch((reason) => setError(parseApiError(reason)))
  }, [initialJobId])

  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return undefined
    const timer = window.setInterval(() => {
      getBusinessExtraction(job.id).then((result) => setJob(result.job)).catch((reason) => setError(parseApiError(reason)))
    }, 1200)
    return () => window.clearInterval(timer)
  }, [job])

  async function start() {
    setError(null)
    try { setJob((await startBusinessExtraction(url)).job) } catch (reason) { setError(parseApiError(reason)) }
  }

  function updateSection<K extends keyof BusinessDNASections>(section: K, key: string, value: string) {
    setJob((current) => {
      if (!current?.result) return current
      return { ...current, result: { ...current.result, sections: { ...current.result.sections, [section]: { ...current.result.sections[section], [key]: value } } } }
    })
  }

  async function confirm() {
    if (!job?.result) return
    const sections = job.result.sections
    if (!sections.identity.name || !sections.identity.industry || !sections.positioning.valueProposition || !sections.audience_profile.targetAudience || !sections.communication.tone || !job.result.catalogItems.some((item) => item.name)) {
      setError('Revisa los campos esenciales y agrega al menos un producto o servicio.')
      return
    }
    setConfirming(true); setError(null)
    try { await confirmBusinessExtraction(job); await completeOnboarding(job.result.sources.map((source) => source.id)); onComplete() } catch (reason) { setError(parseApiError(reason)) } finally { setConfirming(false) }
  }

  const result = job?.result
  return (
    <div className="website-onboarding">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Cambiar método</button>
      <header><span className="onboarding-icon"><Globe2 size={24} /></span><div><span className="page-eyebrow">Análisis asistido</span><h1>Construye tu ADN desde tu web</h1><p>Analizaremos páginas públicas y tú confirmarás cada resultado.</p></div></header>
      {!job && <div className="website-url-card"><InputField label="Página web de tu negocio" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://tuempresa.com" /><button type="button" className="button button-primary" disabled={!url.trim()} onClick={() => void start()}><Sparkles size={17} /> Analizar mi página</button></div>}
      {job && job.status !== 'completed' && job.status !== 'failed' && <div className="extraction-progress-card"><Loader2 className="spin" size={28} /><strong>{job.stage_label}</strong><span>{job.progress}%</span><div className="progress-track"><span style={{ width: `${job.progress}%` }} /></div><p>El progreso corresponde a tareas reales del análisis. Puedes mantener esta página abierta.</p></div>}
      {job?.status === 'failed' && <div className="error-banner"><CircleAlert size={18} />{job.error || 'No se pudo analizar la página.'}<button type="button" onClick={() => setJob(null)}>Intentar otra URL</button></div>}
      {result && <div className="extraction-review"><div className="review-heading"><div><span className="page-eyebrow"><Check size={15} /> Análisis listo</span><h2>Revisa antes de confirmar</h2><p>Los campos son sugerencias editables. Nada se guarda hasta que confirmes.</p></div><span>{result.pagesRead.length} páginas leídas</span></div><div className="review-grid"><InputField label="Nombre comercial *" value={result.sections.identity.name || ''} onChange={(event) => updateSection('identity', 'name', event.target.value)} /><InputField label="Industria *" value={result.sections.identity.industry || ''} onChange={(event) => updateSection('identity', 'industry', event.target.value)} /><TextareaField label="Descripción" value={result.sections.identity.description || ''} onChange={(event) => updateSection('identity', 'description', event.target.value)} /><TextareaField label="Propuesta de valor *" value={result.sections.positioning.valueProposition || ''} onChange={(event) => updateSection('positioning', 'valueProposition', event.target.value)} /><TextareaField label="Audiencia *" value={result.sections.audience_profile.targetAudience || ''} onChange={(event) => updateSection('audience_profile', 'targetAudience', event.target.value)} /><TextareaField label="Tono *" value={result.sections.communication.tone || ''} onChange={(event) => updateSection('communication', 'tone', event.target.value)} /></div><section className="detected-catalog"><header><h3>Productos y servicios</h3><button type="button" onClick={() => setJob((current) => current?.result ? { ...current, result: { ...current.result, catalogItems: [...current.result.catalogItems, { kind: 'product', name: '', description: '', currency: 'BOB', featured: false }] } } : current)}><Plus size={15} /> Agregar</button></header>{result.catalogItems.length === 0 && <p>No se detectaron ofertas. Agrega al menos una.</p>}{result.catalogItems.map((item, index) => <div className="detected-item" key={`${index}-${item.source_url}`}><select value={item.kind || 'product'} onChange={(event) => setJob((current) => { if (!current?.result) return current; const catalogItems = [...current.result.catalogItems]; catalogItems[index] = { ...catalogItems[index], kind: event.target.value as 'product' | 'service' }; return { ...current, result: { ...current.result, catalogItems } } })}><option value="product">Producto</option><option value="service">Servicio</option></select><input value={item.name || ''} placeholder="Nombre" onChange={(event) => setJob((current) => { if (!current?.result) return current; const catalogItems = [...current.result.catalogItems]; catalogItems[index] = { ...catalogItems[index], name: event.target.value }; return { ...current, result: { ...current.result, catalogItems } } })} /></div>)}</section><button type="button" className="button button-primary review-confirm" disabled={confirming} onClick={() => void confirm()}>{confirming ? 'Guardando…' : 'Confirmar y entrar a Baral'} <Check size={17} /></button></div>}
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
    </div>
  )
}
