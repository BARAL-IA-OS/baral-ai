import { useEffect, useState } from 'react'
import { ArrowRight, Megaphone, MessageCircle, PenLine, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MetricsPanel } from '../components/dashboard/MetricsPanel'
import { RecentTasks } from '../components/dashboard/RecentTasks'
import { SavedStrategies } from '../components/dashboard/SavedStrategies'
import { getBusinessDNA } from '../features/business-dna/api'
import type { BusinessDNA } from '../features/business-dna/types'

const quickActions = [
  { title: 'Reactivar clientes', description: 'Recupera clientes inactivos con un mensaje personalizado.', to: '/recipe/reactivacion', Icon: MessageCircle },
  { title: 'Crear contenido', description: 'Genera piezas para redes usando el ADN de tu marca.', to: '/studio', Icon: PenLine },
  { title: 'Anunciar lanzamiento', description: 'Prepara una campaña para tu nuevo producto o servicio.', to: '/recipe/lanzamiento', Icon: Megaphone },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [dna, setDna] = useState<BusinessDNA | null>(null)

  useEffect(() => { getBusinessDNA().then((result) => setDna(result.businessDNA)).catch(() => undefined) }, [])

  function startCreating() {
    const query = prompt.trim() ? `?prompt=${encodeURIComponent(prompt.trim())}` : ''
    navigate(`/studio${query}`)
  }

  return (
    <section className="page dashboard-page dashboard-eclipse">
      <div className="dashboard-compact-header"><div><h1>Dashboard</h1><p>Tu centro de trabajo en Baral AI.</p></div><button type="button" className="button button-primary" onClick={() => navigate('/studio')}><Sparkles size={16} /> Crear campaña</button></div>
      <div className="dashboard-lead-grid">
        <section className="dashboard-create-panel"><span className="page-eyebrow">Creación rápida</span><h2>¿Qué quieres crear hoy?</h2><p>Describe brevemente tu idea y comienza con el contexto de tu negocio.</p><div className="dashboard-prompt"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') startCreating() }} placeholder="Ej. Una campaña para promocionar nuestro servicio principal…" /><button type="button" onClick={startCreating} aria-label="Comenzar"><ArrowRight size={18} /></button></div><div className="dashboard-quick-grid">{quickActions.map(({ title, description, to, Icon }) => <button type="button" key={to} onClick={() => navigate(to)}><Icon size={20} /><strong>{title}</strong><span>{description}</span></button>)}</div></section>
        <aside className="dashboard-dna-panel"><span className="page-eyebrow">ADN del negocio</span><div className="dashboard-dna-score"><strong>{dna?.completionPercentage ?? 0}%</strong><span>completo</span></div><div className="progress-track"><span style={{ width: `${dna?.completionPercentage ?? 0}%` }} /></div><p>{dna?.sections.identity.name || 'Tu negocio'} ya aporta contexto a las herramientas creativas.</p><button type="button" className="button button-secondary" onClick={() => navigate('/adn')}>Revisar ADN <ArrowRight size={15} /></button></aside>
      </div>
      <MetricsPanel />
      <div className="dashboard-bottom-grid"><RecentTasks /><SavedStrategies /></div>
    </section>
  )
}
