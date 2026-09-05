import { useEffect, useState } from 'react'
import { ArrowRight, Globe2, PenLine, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCatalogItems, getOnboardingProgress, saveBusinessDNASection } from '../features/business-dna/api'
import type { BusinessDNASections, CatalogItem, OnboardingProgress } from '../features/business-dna/types'
import { ManualBusinessWizard } from '../features/onboarding/ManualBusinessWizard'
import { WebsiteOnboarding } from '../features/onboarding/WebsiteOnboarding'
import { parseApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'

const emptySections: BusinessDNASections = {
  identity: {}, positioning: {}, audience_profile: {}, communication: {},
  visual_identity: {}, operations: {}, social_proof: {},
}

export function Onboarding() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [mode, setMode] = useState<'url' | 'manual' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getOnboardingProgress(), getCatalogItems('active')])
      .then(([status, catalogResult]) => { setProgress(status); setCatalog(catalogResult.items); if (!status.completed) setMode(status.path) })
      .catch((reason) => setError(parseApiError(reason)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Preparando Primeros pasos…" />
  if (mode === 'manual') return <main className="first-steps-page"><ManualBusinessWizard initialSections={progress?.businessDNA?.sections || emptySections} initialStep={progress?.currentStep || 1} catalogItems={catalog} onComplete={() => navigate('/dashboard', { replace: true })} onBackToChoice={() => setMode(null)} /></main>
  if (mode === 'url') return <main className="first-steps-page"><WebsiteOnboarding initialJobId={progress?.activeExtractionJobId} onComplete={() => navigate('/dashboard', { replace: true })} onBack={() => setMode(null)} /></main>

  return (
    <main className="first-steps-page onboarding-choice-page">
      <div className="onboarding-choice-heading"><span className="onboarding-icon"><Sparkles size={25} /></span><span className="page-eyebrow">Primeros pasos</span><h1>Construyamos el ADN de tu negocio</h1><p>Elige cómo quieres empezar. Siempre revisarás los datos antes de confirmarlos.</p></div>
      {error && <div className="error-banner">{error}</div>}
      <div className="onboarding-choice-grid"><button type="button" className="onboarding-choice-card" onClick={() => setMode('url')}><span><Globe2 size={26} /></span><div><strong>Tengo página web</strong><p>Baral analiza tu identidad, oferta, comunicación y presencia digital.</p><small>Recomendado para avanzar más rápido</small></div><ArrowRight size={20} /></button><button type="button" className="onboarding-choice-card" onClick={() => { setMode('manual'); void saveBusinessDNASection('identity', progress?.businessDNA?.sections.identity || {}, { onboardingStep: progress?.currentStep || 1, onboardingPath: 'manual' }).catch((reason) => setError(parseApiError(reason))) }}><span><PenLine size={26} /></span><div><strong>Completar manualmente</strong><p>Un asistente por secciones te ayuda a describir tu negocio.</p><small>Puedes guardar y continuar después</small></div><ArrowRight size={20} /></button></div>
      <div className="onboarding-privacy"><ShieldCheck size={18} /><span><strong>Tú tienes el control.</strong> Solo analizamos información pública y ningún dato se confirma sin tu revisión.</span></div>
    </main>
  )
}
