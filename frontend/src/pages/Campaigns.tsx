import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Image, LoaderCircle, Mic, Package, Plus, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { createCampaignBrief, generateCampaignContent, parseApiError } from '../lib/api'
import { getBrandBrain } from '../hooks/useBrandBrain'
import { getCatalogItems, getBrandAssets, uploadBrandAssets } from '../features/business-dna/api'
import type { BrandAsset, CatalogItem } from '../features/business-dna/types'
import type { BrandBrain, CampaignBrief, ChannelType, CreativeCampaign } from '../types'

const CHANNELS: Array<{ value: ChannelType; label: string }> = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tiktok', label: 'TikTok' },
]

const briefFields: Array<{ key: keyof CampaignBrief; label: string; multiline?: boolean }> = [
  { key: 'objective', label: 'Objetivo', multiline: true },
  { key: 'product', label: 'Producto o servicio' },
  { key: 'audience', label: 'Audiencia' },
  { key: 'offer_cta', label: 'Oferta y llamada a la acción' },
  { key: 'tone', label: 'Tono' },
  { key: 'format', label: 'Formato' },
  { key: 'restrictions', label: 'Restricciones', multiline: true },
]

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

export function Campaigns() {
  const navigate = useNavigate()
  const [brand, setBrand] = useState<BrandBrain | null>(null)
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [showResources, setShowResources] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [contextError, setContextError] = useState('')
  const [contextLoading, setContextLoading] = useState(true)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [prompt, setPrompt] = useState('')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('Audiencia definida en el ADN del negocio')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [channels, setChannels] = useState<ChannelType[]>(['instagram', 'facebook'])
  const [resources, setResources] = useState<string[]>([])
  const [campaign, setCampaign] = useState<CreativeCampaign | null>(null)
  const [brief, setBrief] = useState<CampaignBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const dialogOpen = Boolean(brief) || showResources

  useEffect(() => {
    if (!dialogOpen) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('.campaigns-page [role="dialog"]')
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"]') || [])
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    focusable()[0]?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) { setBrief(null); setShowResources(false) }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault(); first?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = overflow; previous?.focus() }
  }, [dialogOpen, loading])

  useEffect(() => {
    let active = true
    void Promise.allSettled([getBrandBrain(), getCatalogItems('active'), getBrandAssets()]).then(([dna, products, media]) => {
      if (!active) return
      if (dna.status === 'fulfilled') {
        setBrand(dna.value)
        if (dna.value?.audiencia) setAudience(dna.value.audiencia)
      }
      if (products.status === 'fulfilled') setCatalog(products.value.items)
      if (media.status === 'fulfilled') setAssets(media.value.assets.filter((asset) => asset.status === 'active'))
      if ([dna, products, media].some((result) => result.status === 'rejected')) setContextError('No pudimos cargar todo el contexto del negocio. Recarga la página para volver a intentarlo.')
      setContextLoading(false)
    })
    return () => { active = false; recognitionRef.current?.stop() }
  }, [])

  const suggestions = useMemo(() => {
    const offer = brand?.propuesta || 'tu producto o servicio principal'
    const target = brand?.audiencia || 'tu audiencia ideal'
    return [
      { title: 'Presenta tu próximo favorito', label: 'Lanzamiento', headline: 'Algo nuevo Muy tuyo', style: 'launch',
        description: 'Dale a tu producto una entrada que se recuerde.',
        prompt: `Presenta ${offer} a ${target} con una propuesta clara y cercana.` },
      { title: 'Haz que conozcan tu esencia', label: 'Tu marca', headline: 'Lo que te hace único', style: 'brand',
        description: 'Cuenta tu historia y conecta con las personas correctas.',
        prompt: `Crea una campaña de confianza que destaque ${brand?.diferenciador || 'el diferencial del negocio'}.` },
      { title: 'Vuelve a conectar', label: 'Reactivación', headline: 'Mucho más por compartir', style: 'connect',
        description: 'Una buena razón para que tus clientes vuelvan.',
        prompt: 'Reactiva clientes con una oferta relevante y un llamado a la acción directo.' },
    ]
  }, [brand])

  function toggleChannel(channel: ChannelType) {
    setChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel])
  }

  function dictate() {
    const ctor = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
    if (!ctor) {
      setError('El dictado por voz no está disponible en este navegador.')
      return
    }
    if (listening) { recognitionRef.current?.stop(); return }
    const recognition = new ctor()
    recognitionRef.current = recognition
    recognition.lang = 'es-BO'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ')
      setPrompt((current) => `${current} ${transcript}`.trim())
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setError('No se pudo capturar el audio.')
    }
    setListening(true)
    try { recognition.start() } catch { setListening(false); setError('No se pudo iniciar el micrófono. Puedes escribir tu idea.') }
  }

  async function uploadResources(files: File[]) {
    if (!files.length || uploading) return
    if (resources.length + files.length > 12) {
      setError('Puedes seleccionar hasta 12 imágenes por campaña.')
      return
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setError('Usa imágenes JPG, PNG o WebP de hasta 10 MB.')
      return
    }
    setUploading(true); setError('')
    try {
      const result = await uploadBrandAssets(files, 'reference')
      setAssets((current) => [...result.assets, ...current])
      setResources((current) => [...new Set([...current, ...result.assets.map((asset) => asset.id)])])
    } catch (reason) { setError(parseApiError(reason)) }
    finally { setUploading(false) }
  }

  function chooseSuggestion(value: string) {
    setPrompt(value)
    promptRef.current?.focus()
    promptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function generateBrief() {
    if (!prompt.trim() || channels.length === 0 || loading || uploading || contextLoading) return
    if (resources.length > 12) { setError('Selecciona hasta 12 imágenes por campaña.'); return }
    setLoading(true)
    setError('')
    try {
      const response = await createCampaignBrief({
        prompt, product, audience, aspect_ratio: aspectRatio, channels,
        resources, idempotency_key: crypto.randomUUID(),
      })
      setCampaign(response.campaign)
      setBrief(response.campaign.brief)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  async function confirmBrief() {
    if (!campaign || !brief || loading) return
    setLoading(true)
    setError('')
    try {
      const response = await generateCampaignContent(campaign.id, brief)
      navigate(`/studio/${response.campaign.id}`)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  function updateBrief(key: keyof CampaignBrief, value: string) {
    setBrief((current) => current ? { ...current, [key]: value } : current)
  }

  function toggleBriefChannel(channel: ChannelType) {
    setBrief((current) => {
      if (!current) return current
      const next = current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel]
      return next.length ? { ...current, channels: next } : current
    })
  }

  return (
    <section className="page omar-page campaigns-page">
      <header className="campaign-welcome">
        <span className="campaign-kicker"><span /> TU PRÓXIMA GRAN IDEA EMPIEZA AQUÍ</span>
        <h1>Hagamos crecer <em>tu negocio</em></h1>
        <p>Una idea. Tu marca. Una campaña lista para tomar forma.</p>
      </header>
      <div className="campaign-composer omar-panel" aria-busy={loading || uploading}>
        <div className="campaign-prompt-row">
          <textarea ref={promptRef} value={prompt} onChange={(event) => setPrompt(event.target.value)}
            placeholder="¿Qué quieres promocionar hoy? Cuéntanos tu idea…"
            aria-label="Describe la campaña que quieres crear" maxLength={5000}
            onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); void generateBrief() } }} />
          <button type="button" className={`icon-button ${listening ? 'is-live' : ''}`} onClick={dictate}
            aria-label={listening ? 'Detener dictado' : 'Dictar campaña'} aria-pressed={listening}><Mic size={19} /></button>
        </div>
        <div className="campaign-controls">
          <label><Package size={16} /><select aria-label="Producto del catálogo" value={product} disabled={contextLoading} onChange={(event) => setProduct(event.target.value)}>
            <option value="">{contextLoading ? 'Cargando…' : 'Producto'}</option>
            {catalog.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select><ChevronDown size={12} /></label>
          <button type="button" className="composer-pill" onClick={() => setShowResources(true)}><Image size={16} /> Imágenes {resources.length > 0 && <span>{resources.length}</span>}</button>
          <label><SlidersHorizontal size={15} /><select aria-label="Formato de campaña" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
            <option value="1:1">Cuadrado</option><option value="4:5">Vertical</option><option value="9:16">Historia</option><option value="16:9">Horizontal</option>
          </select><ChevronDown size={12} /></label>
          <button type="button" className="button button-primary campaign-generate" disabled={!prompt.trim() || !channels.length || loading || uploading || contextLoading} onClick={() => void generateBrief()}>
            {loading ? <LoaderCircle className="is-spinning" size={16} /> : <Sparkles size={16} />}{loading ? 'Preparando tu idea…' : 'Crear campaña'}
          </button>
        </div>
        <details className="campaign-options">
          <summary>Canales y audiencia <span>{channels.map((channel) => CHANNELS.find((item) => item.value === channel)?.label).join(' · ')}</span><ChevronDown size={13} /></summary>
          <div className="channel-picker" aria-label="Canales de campaña">{CHANNELS.map((channel) => <button key={channel.value} type="button" aria-pressed={channels.includes(channel.value)} className={channels.includes(channel.value) ? 'is-selected' : ''} onClick={() => toggleChannel(channel.value)}>{channel.label}</button>)}</div>
          <label className="campaign-audience">¿A quién quieres llegar?<input value={audience} onChange={(event) => setAudience(event.target.value)} /></label>
          {!channels.length && <p role="status">Selecciona al menos un canal para continuar.</p>}
        </details>
      </div>
      <p className="composer-caption"><Check size={13} /> Primero revisas la propuesta. Después generas el contenido.</p>
      {contextError && <p className="omar-alert error" role="status">{contextError}</p>}
      {error && !brief && !showResources && <p className="omar-alert error" role="alert">{error}</p>}
      <section className="campaign-inspiration" aria-labelledby="inspiration-title">
        <div className="inspiration-heading"><div><h2 id="inspiration-title">Un poco de inspiración</h2><p>{brand ? 'Ideas con la esencia de tu negocio. Hazlas tuyas.' : 'Elige una idea y dale tu propio toque.'}</p></div><span>ELIGE · PERSONALIZA · CREA</span></div>
        <div className="suggestion-grid">{suggestions.map((suggestion, index) => (
          <button key={suggestion.style} type="button" className="creative-suggestion" onClick={() => chooseSuggestion(suggestion.prompt)}>
            <div className={`suggestion-art art-${suggestion.style}`} aria-hidden="true"><span className="art-edition">BARAL STUDIO / 0{index + 1}</span><div className="art-orbit" /><div className="art-shape" /><strong>{suggestion.headline}</strong><small>Una idea para tu marca</small><span className="art-format">{index === 1 ? 'HISTORIA DE MARCA' : 'CAMPAÑA SOCIAL'}</span></div>
            <div className="suggestion-copy"><span>{suggestion.label}</span><h3>{suggestion.title}</h3><p>{suggestion.description}</p><span className="suggestion-action">Usar esta idea <ArrowUpRight size={17} /></span></div>
          </button>
        ))}</div>
      </section>
      <footer className="creative-tools"><span>Tu marca también puede…</span><button onClick={() => navigate('/photoshoot')}>Crear imágenes <ArrowUpRight size={14} /></button><button onClick={() => navigate('/brand-book')}>Diseñar un Brand Book <ArrowUpRight size={14} /></button><button onClick={() => navigate('/audit')}>Auditar su sitio web <ArrowUpRight size={14} /></button></footer>
      {showResources && <div className="omar-modal-backdrop"><section className="omar-modal resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-title">
        <div className="omar-modal-head"><div><span>Recursos de tu negocio</span><h2 id="resource-title">Elige tus imágenes</h2></div><button type="button" className="icon-button" aria-label="Cerrar selector de imágenes" onClick={() => setShowResources(false)}><X size={20} /></button></div>
        <p className="resource-help">Las imágenes seleccionadas acompañarán el contenido en el Estudio.</p>
        <label className="resource-upload"><Plus size={18} /> {uploading ? 'Subiendo imágenes…' : 'Subir imágenes'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={(event) => { void uploadResources(Array.from(event.target.files || [])); event.target.value = '' }} /></label>
        {error && <p className="omar-alert error" role="alert">{error}</p>}
        <div className="resource-library">{assets.filter((asset) => asset.mime_type.startsWith('image/')).map((asset) => <button type="button" key={asset.id} aria-pressed={resources.includes(asset.id)} className={resources.includes(asset.id) ? 'is-selected' : ''} onClick={() => setResources((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id])}>
          {asset.signed_url && <img src={asset.signed_url} alt={asset.title || asset.original_filename} loading="lazy" />}<span>{asset.title || asset.original_filename}</span>{resources.includes(asset.id) && <Check size={17} />}
        </button>)}</div>
        {!assets.length && <p className="resource-help">Aún no tienes imágenes. Sube una foto de tu producto o continúa con texto.</p>}
        <div className="omar-modal-actions"><button type="button" className="button button-primary" disabled={uploading} onClick={() => setShowResources(false)}>Usar selección{resources.length ? ` (${resources.length})` : ''}</button></div>
      </section></div>}
      {brief && (
        <div className="omar-modal-backdrop" role="presentation">
          <section className="omar-modal brief-modal" role="dialog" aria-modal="true" aria-labelledby="brief-title">
            <div className="omar-modal-head">
              <div><span>Brief editable</span><h2 id="brief-title">Confirma la dirección creativa</h2></div>
              <button type="button" className="icon-button" onClick={() => setBrief(null)} disabled={loading} aria-label="Cerrar propuesta"><X size={20} /></button>
            </div>
            {error && <p className="omar-alert error" role="alert">{error}</p>}
            <div className="brief-grid">
              {briefFields.map((field) => (
                <label key={field.key} className={field.multiline ? 'span-2' : ''}>
                  <span>{field.label}</span>
                  {field.multiline ? (
                    <textarea value={String(brief[field.key])} onChange={(event) => updateBrief(field.key, event.target.value)} />
                  ) : (
                    <input value={String(brief[field.key])} onChange={(event) => updateBrief(field.key, event.target.value)} />
                  )}
                </label>
              ))}
            </div>
            <div className="brief-array-field"><span>Canales</span><div className="channel-picker">{CHANNELS.map((channel) => <button key={channel.value} type="button" className={brief.channels.includes(channel.value) ? 'is-selected' : ''} onClick={() => toggleBriefChannel(channel.value)}>{channel.label}</button>)}</div></div>
            <div className="brief-array-field"><span>Recursos seleccionados</span><div className="resource-chips">{brief.resources.length ? brief.resources.map((resource) => <button type="button" key={resource} onClick={() => setBrief((current) => current ? { ...current, resources: current.resources.filter((item) => item !== resource) } : current)}>{assets.find((asset) => asset.id === resource)?.title || assets.find((asset) => asset.id === resource)?.original_filename || resource} ×</button>) : <small>Sin recursos; puedes continuar solo con texto.</small>}</div></div>
            <div className="omar-modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setBrief(null)} disabled={loading}>Volver a mi idea</button>
              <button type="button" className="button button-primary" onClick={() => void confirmBrief()} disabled={loading}>
                <Sparkles size={16} /> {loading ? 'Generando contenido…' : 'Confirmar y abrir Estudio'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
