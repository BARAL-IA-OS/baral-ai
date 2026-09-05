import { useEffect, useState } from 'react'
import { Building2, CircleAlert, ExternalLink } from 'lucide-react'
import { DNASectionCard, type DNAFieldDefinition } from '../features/business-dna/components/DNASectionCard'
import { getBusinessDNA, saveBusinessDNASection } from '../features/business-dna/api'
import type { BrandSource, BusinessDNA as BusinessDNAType, BusinessDNASectionName, BusinessDNASections } from '../features/business-dna/types'
import { parseApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'

const brandCards: Array<{
  section: BusinessDNASectionName
  title: string
  description: string
  fields: DNAFieldDefinition[]
}> = [
  { section: 'identity', title: 'Identidad', description: 'La información esencial con la que Baral reconoce tu negocio.', fields: [
    { key: 'name', label: 'Nombre comercial' }, { key: 'websiteUrl', label: 'Página web' },
    { key: 'industry', label: 'Industria' }, { key: 'description', label: 'Descripción', multiline: true },
  ] },
  { section: 'positioning', title: 'Propuesta y diferenciación', description: 'El valor que entregas y aquello que te hace distinto.', fields: [
    { key: 'valueProposition', label: 'Propuesta de valor', multiline: true },
    { key: 'differentiators', label: 'Diferenciadores', multiline: true },
  ] },
  { section: 'audience_profile', title: 'Audiencia y mercado', description: 'Las personas y mercados para los que comunicamos.', fields: [
    { key: 'targetAudience', label: 'Audiencia principal', multiline: true }, { key: 'market', label: 'Mercado', multiline: true },
  ] },
  { section: 'communication', title: 'Voz de la marca', description: 'Tono, mensajes y límites que deben respetar las herramientas creativas.', fields: [
    { key: 'tone', label: 'Tono', multiline: true }, { key: 'style', label: 'Estilo', multiline: true },
    { key: 'keyMessages', label: 'Mensajes clave', multiline: true }, { key: 'callsToAction', label: 'Llamados a la acción', multiline: true },
    { key: 'forbiddenWords', label: 'Palabras o temas a evitar', multiline: true },
  ] },
  { section: 'visual_identity', title: 'Identidad visual', description: 'Colores y tipografías reutilizables.', fields: [
    { key: 'colors', label: 'Colores HEX', list: true }, { key: 'fonts', label: 'Tipografías', list: true },
  ] },
]

const detailCards = [
  { section: 'operations' as const, title: 'Información operativa', description: 'Contacto, ubicación, horarios y presencia digital.', fields: [
    { key: 'address', label: 'Dirección' }, { key: 'city', label: 'Ciudad' }, { key: 'country', label: 'País' },
    { key: 'phones', label: 'Teléfonos', list: true }, { key: 'emails', label: 'Emails', list: true },
    { key: 'whatsapp', label: 'WhatsApp' }, { key: 'openingHours', label: 'Horarios', multiline: true },
    { key: 'importantLinks', label: 'Enlaces importantes', list: true },
  ] },
  { section: 'social_proof' as const, title: 'Prueba social', description: 'Testimonios, preguntas frecuentes y señales de confianza.', fields: [
    { key: 'testimonials', label: 'Testimonios', multiline: true },
    { key: 'trustSignals', label: 'Señales de confianza', multiline: true },
    { key: 'frequentlyAskedQuestions', label: 'Preguntas frecuentes', multiline: true },
  ] },
]

export function BusinessDNA() {
  const [dna, setDna] = useState<BusinessDNAType | null>(null)
  const [sources, setSources] = useState<BrandSource[]>([])
  const [tab, setTab] = useState<'brand' | 'details'>('brand')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBusinessDNA().then((result) => { setDna(result.businessDNA); setSources(result.sources || []) }).catch((reason) => setError(parseApiError(reason))).finally(() => setLoading(false))
  }, [])

  async function save<K extends BusinessDNASectionName>(section: K, value: BusinessDNASections[K]) {
    setError(null)
    try {
      const result = await saveBusinessDNASection(section, value)
      setDna(result.businessDNA)
    } catch (reason) {
      setError(parseApiError(reason))
      throw reason
    }
  }

  if (loading) return <Spinner label="Cargando ADN del negocio…" />

  return (
    <section className="page dna-page">
      <div className="feature-page-header">
        <div><span className="page-eyebrow"><Building2 size={15} /> ADN del negocio</span><h1>{dna?.sections.identity.name || 'Tu negocio'}</h1><p>La fuente de contexto que utilizan las herramientas de Baral AI.</p></div>
        {dna?.sections.identity.websiteUrl && <a className="button button-secondary" href={dna.sections.identity.websiteUrl} target="_blank" rel="noreferrer">Visitar web <ExternalLink size={15} /></a>}
      </div>
      <div className="dna-progress-panel"><div><strong>{dna?.completionPercentage ?? 0}% completo</strong><span>Mejora las recomendaciones completando cada bloque.</span></div><div className="progress-track"><span style={{ width: `${dna?.completionPercentage ?? 0}%` }} /></div></div>
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
      <div className="feature-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'brand'} className={tab === 'brand' ? 'is-active' : ''} onClick={() => setTab('brand')}>Resumen de marca</button>
        <button type="button" role="tab" aria-selected={tab === 'details'} className={tab === 'details' ? 'is-active' : ''} onClick={() => setTab('details')}>Detalles del negocio</button>
      </div>
      {!dna ? <div className="empty-state"><strong>No encontramos tu ADN.</strong><p>Completa Primeros pasos para comenzar.</p></div> : (
        <div className="dna-card-list">
          {(tab === 'brand' ? brandCards : detailCards).map((card) => (
            <DNASectionCard
              key={card.section}
              section={card.section}
              title={card.title}
              description={card.description}
              fields={card.fields}
              value={dna.sections[card.section]}
              onSave={save}
              source={sources.find((source) => source.field_path.startsWith(`${card.section}.`))}
            />
          ))}
        </div>
      )}
    </section>
  )
}
