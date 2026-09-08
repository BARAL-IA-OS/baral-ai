import { useEffect, useState } from 'react'
import { CircleAlert, ExternalLink, ImagePlus, Link2, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DNASectionCard, type DNAFieldDefinition } from '../features/business-dna/components/DNASectionCard'
import { getBrandAssets, getBusinessDNA, saveBusinessDNASection } from '../features/business-dna/api'
import type { BrandAsset, BrandSource, BusinessDNA as BusinessDNAType, BusinessDNASectionName, BusinessDNASections } from '../features/business-dna/types'
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
]

const detailCards = [
  { section: 'operations' as const, title: 'Ubicación', description: '', fields: [
    { key: 'address', label: 'Dirección' }, { key: 'city', label: 'Ciudad' }, { key: 'country', label: 'País' },
  ] },
  { section: 'operations' as const, title: 'Contacto', description: '', fields: [
    { key: 'phones', label: 'Teléfonos', list: true }, { key: 'emails', label: 'Emails', list: true },
    { key: 'whatsapp', label: 'WhatsApp' },
  ] },
  { section: 'operations' as const, title: 'Horarios de atención', description: '', fields: [
    { key: 'openingHours', label: 'Horarios', multiline: true },
  ] },
  { section: 'operations' as const, title: 'Redes sociales', description: '', fields: [
    { key: 'socialLinks', label: 'Una red por línea: nombre | https://…', multiline: true, socialLinks: true },
  ] },
  { section: 'operations' as const, title: 'Enlaces importantes', description: '', fields: [
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
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [tab, setTab] = useState<'brand' | 'details'>('brand')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBusinessDNA().then((result) => { setDna(result.businessDNA); setSources(result.sources || []) }).catch((reason) => setError(parseApiError(reason))).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    getBrandAssets().then((result) => { if (active) setAssets(result.assets) })
      .catch(() => { /* El resumen sigue disponible si no se puede cargar el logo. */ })
    return () => { active = false }
  }, [])

  async function save<K extends BusinessDNASectionName>(section: K, value: BusinessDNASections[K]) {
    setError(null)
    try {
      const result = await saveBusinessDNASection(section, value)
      setDna(result.businessDNA)
      window.dispatchEvent(new Event('baral:dna-updated'))
    } catch (reason) {
      setError(parseApiError(reason))
      throw reason
    }
  }

  if (loading) return <Spinner label="Cargando ADN del negocio…" />
  const visual = dna?.sections.visual_identity
  const logo = assets.find((asset) => asset.id === visual?.logoAssetId && asset.status === 'active')
    || assets.find((asset) => asset.asset_type === 'logo' && asset.status === 'active')
  const safeWebUrl = (url?: string) => url && /^https?:\/\//i.test(url) ? url : undefined
  const identity = dna?.sections.identity

  return (
    <section className="page dna-page dna-gallery-page">
      <header className="dna-gallery-heading">
        <h1>El ADN de tu negocio</h1>
        <p>Tu esencia, en un solo lugar. La base de todo lo que creas con Baral.</p>
      </header>
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
      <div className="dna-gallery-shell">
      <div className="feature-tabs" role="tablist" aria-label="ADN del negocio">
        <button id="dna-brand-tab" type="button" role="tab" aria-controls="dna-brand-panel" aria-selected={tab === 'brand'} onKeyDown={(event) => { if (event.key === 'ArrowRight') { setTab('details'); document.getElementById('dna-details-tab')?.focus() } }} className={tab === 'brand' ? 'is-active' : ''} onClick={() => setTab('brand')}>Resumen de marca</button>
        <button id="dna-details-tab" type="button" role="tab" aria-controls="dna-details-panel" aria-selected={tab === 'details'} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { setTab('brand'); document.getElementById('dna-brand-tab')?.focus() } }} className={tab === 'details' ? 'is-active' : ''} onClick={() => setTab('details')}>Detalles del negocio</button>
      </div>
      {!dna ? <div className="empty-state"><strong>No encontramos tu ADN.</strong><p>Completa Primeros pasos para comenzar.</p></div> : (
        <div className={`dna-card-list dna-gallery-grid dna-gallery-${tab}`} role="tabpanel" id={`dna-${tab}-panel`} aria-labelledby={`dna-${tab}-tab`}>
          {tab === 'brand' && <>
            <DNASectionCard section="identity" title="Tu marca" description="" fields={brandCards[0].fields} value={dna.sections.identity} onSave={save} className="dna-identity-card" preview={<div className="dna-brand-preview"><h2>{identity?.name || 'Tu negocio'}</h2>{safeWebUrl(identity?.websiteUrl) ? <a href={safeWebUrl(identity?.websiteUrl)} target="_blank" rel="noreferrer"><Link2 size={17} />{identity?.websiteUrl}<ExternalLink size={13} /></a> : <span>Agrega la web de tu negocio al editar tu marca.</span>}{identity?.industry && <small>{identity.industry}</small>}{identity?.description && <p>{identity.description}</p>}</div>} />
            <Link to="/adn/recursos" className="dna-logo-tile" aria-label="Gestionar logo en Recursos">{logo?.signed_url ? <img src={logo.signed_url} alt={identity?.name ? `Logo de ${identity.name}` : 'Logo del negocio'} /> : <ImagePlus size={32} />}<span>{logo?.signed_url ? 'Gestionar logo' : 'Agregar un logo'}<ArrowUpRight size={14} /></span></Link>
            <DNASectionCard section="visual_identity" title="Tipografías" description="" fields={[{ key: 'fonts', label: 'Tipografías', list: true }]} value={dna.sections.visual_identity} onSave={save} className="dna-font-card" preview={<div className="dna-font-preview"><span aria-hidden="true">Aa</span><strong>{visual?.fonts?.join(' · ') || 'Sin tipografía definida'}</strong></div>} />
            <DNASectionCard section="visual_identity" title="Paleta de colores" description="" fields={[{ key: 'colors', label: 'Colores HEX separados por comas', list: true }]} value={dna.sections.visual_identity} onSave={save} className="dna-colors-card" preview={<div className="dna-swatches">{visual?.colors?.length ? visual.colors.map((color, index) => <div key={`${color}-${index}`}><span style={{ background: /^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(color) ? color : undefined }} /><small>{color}</small></div>) : <p>Define los colores que harán reconocible tu marca.</p>}</div>} />
          </>}
          {(tab === 'brand' ? brandCards.slice(1) : detailCards).map((card) => (
            <DNASectionCard
              key={card.title}
              section={card.section}
              title={card.title}
              description={card.description}
              fields={card.fields}
              value={dna.sections[card.section]}
              onSave={save}
              source={sources.find((source) => source.field_path.startsWith(`${card.section}.`))}
              preview={card.title === 'Redes sociales' ? <div className="dna-social-links">{dna.sections.operations.socialLinks?.length ? dna.sections.operations.socialLinks.map((link, index) => safeWebUrl(link.url) ? <a key={index} href={safeWebUrl(link.url)} target="_blank" rel="noreferrer"><Link2 size={14} />{link.network}<ArrowUpRight size={12} /></a> : <span key={index}>{link.network} · {link.url}</span>) : <p>Agrega las redes donde tus clientes pueden encontrarte.</p>}</div> : undefined}
            />
          ))}
        </div>
      )}
      </div>
      <footer className="dna-gallery-actions"><Link className="button button-secondary" to="/brand-book">Crear Brand Book <ArrowUpRight size={15} /></Link><Link className="button button-primary" to="/campaigns">Crear una campaña <ArrowUpRight size={15} /></Link></footer>
    </section>
  )
}
