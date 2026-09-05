import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, PackageOpen } from 'lucide-react'
import { InputField } from '../../components/ui/FormField'
import {
  completeOnboarding,
  createCatalogItem,
  saveBusinessDNASection,
} from '../business-dna/api'
import type { BusinessDNASectionName, BusinessDNASections, CatalogItem } from '../business-dna/types'
import { parseApiError } from '../../lib/api'
import { VoiceTextarea } from './VoiceTextarea'

type DraftSections = BusinessDNASections

interface ManualBusinessWizardProps {
  initialSections: DraftSections
  initialStep: number
  catalogItems: CatalogItem[]
  onComplete: () => void
  onBackToChoice: () => void
}

const steps = [
  { title: 'Identidad del negocio', subtitle: 'Empecemos por lo esencial.', section: 'identity' as const, required: true },
  { title: 'Productos y servicios', subtitle: 'Agrega al menos una oferta principal.', section: null, required: true },
  { title: 'Propuesta de valor', subtitle: 'Explica por qué deberían elegirte.', section: 'positioning' as const, required: true },
  { title: 'Audiencia y mercado', subtitle: 'Describe con quién quieres comunicarte.', section: 'audience_profile' as const, required: true },
  { title: 'Personalidad y tono', subtitle: 'Define cómo debe sonar tu marca.', section: 'communication' as const, required: true },
  { title: 'Mensajes y límites', subtitle: 'Indica qué decir y qué evitar.', section: 'communication' as const, required: false },
  { title: 'Identidad visual', subtitle: 'Colores y tipografías que representan tu marca.', section: 'visual_identity' as const, required: false },
  { title: 'Ubicación y contacto', subtitle: 'Datos operativos para tus clientes.', section: 'operations' as const, required: false },
  { title: 'Web y redes sociales', subtitle: 'Conecta tu presencia digital.', section: 'operations' as const, required: false },
  { title: 'Testimonios y confianza', subtitle: 'Agrega evidencia que respalde tu negocio.', section: 'social_proof' as const, required: false },
  { title: 'Revisión final', subtitle: 'Confirma que el contexto esencial esté correcto.', section: null, required: true },
]

export function ManualBusinessWizard({ initialSections, initialStep, catalogItems, onComplete, onBackToChoice }: ManualBusinessWizardProps) {
  const [current, setCurrent] = useState(Math.min(Math.max(initialStep || 1, 1), 11))
  const [sections, setSections] = useState<DraftSections>(initialSections)
  const [catalog, setCatalog] = useState(catalogItems)
  const [catalogDraft, setCatalogDraft] = useState<{ name: string; kind: 'product' | 'service'; description: string }>({ name: '', kind: 'product', description: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const step = steps[current - 1]

  const requiredReady = useMemo(() => ({
    identity: Boolean(sections.identity.name && (sections.identity.industry || sections.identity.description)),
    catalog: catalog.length > 0,
    positioning: Boolean(sections.positioning.valueProposition),
    audience: Boolean(sections.audience_profile.targetAudience),
    communication: Boolean(sections.communication.tone),
  }), [catalog.length, sections])

  function patchSection<K extends BusinessDNASectionName>(section: K, patch: Partial<BusinessDNASections[K]>) {
    setSections((currentSections) => ({
      ...currentSections,
      [section]: { ...currentSections[section], ...patch },
    }))
  }

  async function saveCurrent(goNext = true) {
    setSaving(true); setMessage(null)
    try {
      if (current === 2 && catalogDraft.name.trim()) {
        const result = await createCatalogItem({
          name: catalogDraft.name.trim(), kind: catalogDraft.kind,
          description: catalogDraft.description, category: '', price: null,
          currency: 'BOB', cta: '', featured: false,
        })
        setCatalog((items) => [...items, result.item])
        setCatalogDraft({ name: '', kind: 'product', description: '' })
        await saveBusinessDNASection('identity', sections.identity, { onboardingStep: 2, onboardingPath: 'manual' })
      } else if (current === 2) {
        await saveBusinessDNASection('identity', sections.identity, { onboardingStep: 2, onboardingPath: 'manual' })
      } else if (current === 9) {
        await saveBusinessDNASection('identity', sections.identity, { onboardingStep: 9, onboardingPath: 'manual' })
        await saveBusinessDNASection('operations', sections.operations, { onboardingStep: 9, onboardingPath: 'manual' })
      } else if (step.section) {
        await saveBusinessDNASection(step.section, sections[step.section], {
          onboardingStep: current,
          onboardingPath: 'manual',
        })
      }
      if (goNext) setCurrent((value) => Math.min(value + 1, 11))
      else setMessage('Progreso guardado. Puedes continuar cuando quieras.')
    } catch (reason) {
      setMessage(parseApiError(reason))
    } finally { setSaving(false) }
  }

  async function finish() {
    setSaving(true); setMessage(null)
    try { await completeOnboarding(); onComplete() } catch (reason) { setMessage(parseApiError(reason)) } finally { setSaving(false) }
  }

  function content() {
    if (current === 1) return <div className="wizard-fields"><InputField label="Nombre comercial *" value={sections.identity.name || ''} onChange={(event) => patchSection('identity', { name: event.target.value })} /><InputField label="Industria o actividad *" value={sections.identity.industry || ''} onChange={(event) => patchSection('identity', { industry: event.target.value })} /><VoiceTextarea label="Descripción breve" value={sections.identity.description || ''} onChange={(value) => patchSection('identity', { description: value })} /></div>
    if (current === 2) return (
      <div className="wizard-fields">
        <div className="catalog-inline-list">
          {catalog.map((item) => <span key={item.id}><PackageOpen size={15} />{item.name}<small>{item.kind === 'product' ? 'Producto' : 'Servicio'}</small></span>)}
        </div>
        <div className="segmented-control">
          <button type="button" className={catalogDraft.kind === 'product' ? 'is-active' : ''} onClick={() => setCatalogDraft((value) => ({ ...value, kind: 'product' }))}>Producto</button>
          <button type="button" className={catalogDraft.kind === 'service' ? 'is-active' : ''} onClick={() => setCatalogDraft((value) => ({ ...value, kind: 'service' }))}>Servicio</button>
        </div>
        <InputField label="Nombre de producto o servicio" value={catalogDraft.name} onChange={(event) => setCatalogDraft((value) => ({ ...value, name: event.target.value }))} />
        <VoiceTextarea label="Descripción" value={catalogDraft.description} onChange={(description) => setCatalogDraft((value) => ({ ...value, description }))} />
      </div>
    )
    if (current === 3) return <div className="wizard-fields"><VoiceTextarea label="Propuesta de valor *" value={sections.positioning.valueProposition || ''} onChange={(valueProposition) => patchSection('positioning', { valueProposition })} /><VoiceTextarea label="Diferenciadores" value={sections.positioning.differentiators || ''} onChange={(differentiators) => patchSection('positioning', { differentiators })} /></div>
    if (current === 4) return <div className="wizard-fields"><VoiceTextarea label="Audiencia principal *" value={sections.audience_profile.targetAudience || ''} onChange={(targetAudience) => patchSection('audience_profile', { targetAudience })} /><VoiceTextarea label="Mercado" value={sections.audience_profile.market || ''} onChange={(market) => patchSection('audience_profile', { market })} /></div>
    if (current === 5) return <div className="wizard-fields"><VoiceTextarea label="Tono de comunicación *" value={sections.communication.tone || ''} onChange={(tone) => patchSection('communication', { tone })} /><VoiceTextarea label="Estilo" value={sections.communication.style || ''} onChange={(style) => patchSection('communication', { style })} /></div>
    if (current === 6) return <div className="wizard-fields"><VoiceTextarea label="Mensajes clave" value={sections.communication.keyMessages || ''} onChange={(keyMessages) => patchSection('communication', { keyMessages })} /><VoiceTextarea label="Llamados a la acción" value={sections.communication.callsToAction || ''} onChange={(callsToAction) => patchSection('communication', { callsToAction })} /><VoiceTextarea label="Palabras o temas que deben evitarse" value={sections.communication.forbiddenWords || ''} onChange={(forbiddenWords) => patchSection('communication', { forbiddenWords })} /></div>
    if (current === 7) return <div className="wizard-fields"><InputField label="Colores HEX separados por coma" value={(sections.visual_identity.colors || []).join(', ')} onChange={(event) => patchSection('visual_identity', { colors: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} placeholder="#A77BFF, #1B1B1B" /><InputField label="Tipografías separadas por coma" value={(sections.visual_identity.fonts || []).join(', ')} onChange={(event) => patchSection('visual_identity', { fonts: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} /></div>
    if (current === 8) return <div className="wizard-fields"><InputField label="Dirección" value={sections.operations.address || ''} onChange={(event) => patchSection('operations', { address: event.target.value })} /><div className="form-row"><InputField label="Ciudad" value={sections.operations.city || ''} onChange={(event) => patchSection('operations', { city: event.target.value })} /><InputField label="País" value={sections.operations.country || ''} onChange={(event) => patchSection('operations', { country: event.target.value })} /></div><InputField label="Teléfonos separados por coma" value={(sections.operations.phones || []).join(', ')} onChange={(event) => patchSection('operations', { phones: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} /><InputField label="Emails separados por coma" value={(sections.operations.emails || []).join(', ')} onChange={(event) => patchSection('operations', { emails: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} /><VoiceTextarea label="Horarios" value={sections.operations.openingHours || ''} onChange={(openingHours) => patchSection('operations', { openingHours })} /></div>
    if (current === 9) return <div className="wizard-fields"><InputField label="Página web" type="url" value={sections.identity.websiteUrl || ''} onChange={(event) => patchSection('identity', { websiteUrl: event.target.value })} /><InputField label="Enlaces de redes separados por coma" value={(sections.operations.socialLinks || []).map((item) => item.url).join(', ')} onChange={(event) => patchSection('operations', { socialLinks: event.target.value.split(',').map((url) => ({ network: 'other', url: url.trim() })).filter((item) => item.url) })} /><InputField label="Enlaces de reserva, compra o cotización" value={(sections.operations.importantLinks || []).join(', ')} onChange={(event) => patchSection('operations', { importantLinks: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} /></div>
    if (current === 10) return <div className="wizard-fields"><VoiceTextarea label="Testimonios" value={sections.social_proof.testimonials || ''} onChange={(testimonials) => patchSection('social_proof', { testimonials })} /><VoiceTextarea label="Señales de confianza" value={sections.social_proof.trustSignals || ''} onChange={(trustSignals) => patchSection('social_proof', { trustSignals })} /><VoiceTextarea label="Preguntas frecuentes" value={sections.social_proof.frequentlyAskedQuestions || ''} onChange={(frequentlyAskedQuestions) => patchSection('social_proof', { frequentlyAskedQuestions })} /></div>
    return <div className="onboarding-review"><div className={requiredReady.identity ? 'is-ready' : ''}><Check size={17} /> Identidad del negocio</div><div className={requiredReady.catalog ? 'is-ready' : ''}><Check size={17} /> Producto o servicio</div><div className={requiredReady.positioning ? 'is-ready' : ''}><Check size={17} /> Propuesta de valor</div><div className={requiredReady.audience ? 'is-ready' : ''}><Check size={17} /> Audiencia</div><div className={requiredReady.communication ? 'is-ready' : ''}><Check size={17} /> Tono de comunicación</div></div>
  }

  const canAdvance =
    (current === 1 && requiredReady.identity) ||
    (current === 2 && (requiredReady.catalog || Boolean(catalogDraft.name.trim()))) ||
    (current === 3 && requiredReady.positioning) ||
    (current === 4 && requiredReady.audience) ||
    (current === 5 && requiredReady.communication) ||
    !step.required
  return (
    <div className="manual-wizard">
      <div className="wizard-progress"><button type="button" onClick={onBackToChoice}><ArrowLeft size={16} /> Cambiar método</button><span>Paso {current} de 11</span><div><span style={{ width: `${(current / 11) * 100}%` }} /></div></div>
      <header><span>{step.required ? 'Esencial' : 'Opcional'}</span><h1>{step.title}</h1><p>{step.subtitle}</p></header>
      <div className="wizard-card">{content()}</div>
      {message && <p className="wizard-message" role="status">{message}</p>}
      <footer className="wizard-footer"><button type="button" className="button button-ghost" disabled={saving} onClick={() => void saveCurrent(false)}><Clock3 size={16} /> Guardar y continuar después</button><div><button type="button" className="button button-secondary" disabled={current === 1 || saving} onClick={() => setCurrent((value) => value - 1)}>Atrás</button>{current < 11 ? <button type="button" className="button button-primary" disabled={saving || !canAdvance} onClick={() => void saveCurrent()}>{saving ? 'Guardando…' : step.required ? 'Guardar y seguir' : 'Continuar'} <ArrowRight size={16} /></button> : <button type="button" className="button button-primary" disabled={saving || !Object.values(requiredReady).every(Boolean)} onClick={() => void finish()}>{saving ? 'Confirmando…' : 'Confirmar ADN'} <Check size={16} /></button>}</div></footer>
    </div>
  )
}
