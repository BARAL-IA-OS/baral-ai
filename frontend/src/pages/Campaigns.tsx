import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Megaphone, Mic, Package, Paperclip, Sparkles, Users } from 'lucide-react'
import { createCampaignBrief, generateCampaignContent, getClients, parseApiError } from '../lib/api'
import { getBrandBrain } from '../hooks/useBrandBrain'
import type { BrandBrain, CampaignBrief, ChannelType, Client, CreativeCampaign } from '../types'

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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

export function Campaigns() {
  const navigate = useNavigate()
  const [brand, setBrand] = useState<BrandBrain | null>(null)
  const [clients, setClients] = useState<Client[]>([])
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

  useEffect(() => {
    void Promise.all([getBrandBrain(), getClients().catch(() => ({ clients: [] }))]).then(([brandData, clientData]) => {
      setBrand(brandData)
      setClients(clientData.clients)
      if (brandData?.audiencia) setAudience(brandData.audiencia)
    })
  }, [])

  const contactableClients = useMemo(() => clients.filter((client) => !client.no_contactar), [clients])
  const products = useMemo(
    () => Array.from(new Set(contactableClients.map((client) => client.producto).filter(Boolean))) as string[],
    [contactableClients],
  )
  const segments = useMemo(() => [
    { value: brand?.audiencia || 'Audiencia definida en el ADN', label: 'Audiencia del ADN' },
    { value: 'Clientes activos', label: `Clientes activos (${contactableClients.filter((client) => client.ultima_compra).length})` },
    { value: 'Clientes inactivos', label: `Clientes inactivos (${contactableClients.filter((client) => !client.ultima_compra).length})` },
    { value: 'Nuevos prospectos', label: `Nuevos prospectos (${contactableClients.length})` },
  ], [brand, contactableClients])

  const suggestions = useMemo(() => {
    const offer = brand?.propuesta || 'tu producto o servicio principal'
    const target = brand?.audiencia || 'tu audiencia ideal'
    return [
      `Presenta ${offer} a ${target} con una propuesta clara y cercana.`,
      `Crea una campaña de confianza que destaque ${brand?.diferenciador || 'el diferencial del negocio'}.`,
      `Reactiva clientes con una oferta relevante y un llamado a la acción directo.`,
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
    const recognition = new ctor()
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
    recognition.start()
  }

  async function generateBrief() {
    if (!prompt.trim() || channels.length === 0 || loading) return
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
      <header className="omar-page-header">
        <span className="omar-eyebrow"><Megaphone size={14} /> Centro creativo</span>
        <h1>Campañas</h1>
        <p>Cuéntale a Baral qué quieres lograr. El contexto de tu negocio completa el resto.</p>
      </header>

      <div className="campaign-composer omar-panel">
        <div className="campaign-prompt-row">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe la campaña que quieres crear…"
            aria-label="Descripción de la campaña"
          />
          <button type="button" className={`icon-button ${listening ? 'is-live' : ''}`} onClick={dictate} aria-label="Dictar campaña">
            <Mic size={19} />
          </button>
        </div>
        <div className="campaign-controls">
          <label><Package size={15} />
            <select value={product} onChange={(event) => setProduct(event.target.value)}>
              <option value="">Producto del ADN</option>
              {products.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label><Users size={15} />
            <select value={audience} onChange={(event) => setAudience(event.target.value)}>
              {segments.map((segment) => <option key={segment.value} value={segment.value}>{segment.label}</option>)}
            </select>
          </label>
          <label className="campaign-resource-picker"><Paperclip size={15} />
            <span>{resources.length ? `${resources.length} recurso(s)` : 'Recursos'}</span>
            <input type="file" accept="image/*" multiple onChange={(event) => setResources(Array.from(event.target.files || []).map((file) => file.name))} />
          </label>
          <label><Image size={15} />
            <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
              <option>1:1</option><option>4:5</option><option>9:16</option><option>16:9</option>
            </select>
          </label>
          <button type="button" className="button button-primary campaign-generate" disabled={!prompt.trim() || channels.length === 0 || loading} onClick={() => void generateBrief()}>
            <Sparkles size={16} /> {loading ? 'Preparando…' : 'Generar brief'}
          </button>
        </div>
        <div className="channel-picker" aria-label="Canales de campaña">
          {CHANNELS.map((channel) => (
            <button key={channel.value} type="button" className={channels.includes(channel.value) ? 'is-selected' : ''} onClick={() => toggleChannel(channel.value)}>
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="omar-alert error">{error}</p>}

      <section className="omar-section">
        <div className="omar-section-title">
          <div><span>Sugerencias desde tu ADN</span><h2>Empieza con una dirección</h2></div>
        </div>
        <div className="suggestion-grid">
          {suggestions.map((suggestion, index) => (
            <button key={suggestion} type="button" className="suggestion-card omar-card" onClick={() => setPrompt(suggestion)}>
              <span>0{index + 1}</span><p>{suggestion}</p><small>Usar esta idea →</small>
            </button>
          ))}
        </div>
      </section>

      {brief && (
        <div className="omar-modal-backdrop" role="presentation">
          <section className="omar-modal brief-modal" role="dialog" aria-modal="true" aria-labelledby="brief-title">
            <div className="omar-modal-head">
              <div><span>Brief editable</span><h2 id="brief-title">Confirma la dirección creativa</h2></div>
              <button type="button" className="icon-button" onClick={() => setBrief(null)}>×</button>
            </div>
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
            <div className="brief-array-field"><span>Recursos seleccionados</span><div className="resource-chips">{brief.resources.length ? brief.resources.map((resource) => <button type="button" key={resource} onClick={() => setBrief((current) => current ? { ...current, resources: current.resources.filter((item) => item !== resource) } : current)}>{resource} ×</button>) : <small>Sin recursos; puedes continuar solo con texto.</small>}</div></div>
            <div className="omar-modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setBrief(null)}>Seguir editando después</button>
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
