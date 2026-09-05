import { useEffect, useState } from 'react'
import { Megaphone, Mic, MicOff, Sparkles, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { SocialPreview } from '../components/preview/SocialPreview'
import type { MockContent } from '../components/preview/ChannelMocks'
import { generateContent, generateImage, parseApiError } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { ChannelType, ContentItem } from '../types'
import { getBusinessDNA } from '../features/business-dna/api'

interface Campaign {
  id: string
  name: string
  prompt: string
  content: MockContent
  contentByChannel: Partial<Record<ChannelType, MockContent>>
}

interface StudioCampaignRow {
  id: string
  name: string
  prompt: string
  content: MockContent
  content_by_channel: Partial<Record<ChannelType, MockContent>> | null
}

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

const DEFAULT_BRAND = { brandName: 'Tu negocio', handle: 'tunegocio', initials: 'TN' }
const CHANNELS: ChannelType[] = ['email', 'whatsapp', 'instagram', 'facebook', 'tiktok']

function contentFromText(prompt: string, brand = DEFAULT_BRAND, imageUrl?: string): MockContent {
  const clean = prompt.trim()
  return {
    ...brand,
    recipient: 'María García',
    subject: clean.slice(0, 60) || 'Tu nueva campaña',
    caption: clean || 'Describe tu campaña para generar el contenido.',
    hashtags: ['#Campaña', '#StudioFoto', '#Medellín'],
    cta: 'Más información',
    mediaAlt: 'Imagen generada a partir de tu descripción',
    imageUrl,
  }
}

function contentFromItem(item: ContentItem, fallback: string, brand = DEFAULT_BRAND, imageUrl?: string): MockContent {
  const base = contentFromText(fallback, brand, imageUrl)
  return {
    ...base,
    subject: item.subject || base.subject,
    caption: item.caption || base.caption,
    hashtags: item.hashtags?.length ? item.hashtags : base.hashtags,
    cta: item.cta || base.cta,
    mediaAlt: item.media_alt || base.mediaAlt,
    imageUrl,
  }
}

function nameFromPrompt(prompt: string, index: number): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ')
  return words || `Campaña ${index}`
}

function rowToCampaign(row: StudioCampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    content: row.content,
    contentByChannel: row.content_by_channel ?? {},
  }
}

export function Studio() {
  const [searchParams] = useSearchParams()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [prompt, setPrompt] = useState(() => searchParams.get('prompt') || '')
  const [brand, setBrand] = useState(DEFAULT_BRAND)
  const [generating, setGenerating] = useState(false)
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [listening, setListening] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? null

  useEffect(() => {
    getBusinessDNA().then(({ businessDNA }) => {
      const name = businessDNA?.sections.identity.name?.trim()
      if (!name) return
      const initials = name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
      const handle = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')
      setBrand({ brandName: name, handle: handle || 'tunegocio', initials: initials || 'TN' })
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCampaigns() {
      setLoadingCampaigns(true)

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        if (!cancelled) setLoadingCampaigns(false)
        return
      }

      const { data, error } = await supabase
        .from('studio_campaigns')
        .select('id,name,prompt,content,content_by_channel')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        setMessage('No se pudieron cargar campañas guardadas. Verifica que exista la tabla studio_campaigns en Supabase.')
        setLoadingCampaigns(false)
        return
      }

      const savedCampaigns = ((data ?? []) as StudioCampaignRow[]).map(rowToCampaign)
      setCampaigns(savedCampaigns)
      setSelectedId(savedCampaigns[0]?.id ?? '')
      setLoadingCampaigns(false)
    }

    void loadCampaigns()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleGenerate() {
    const clean = prompt.trim()
    if (!clean || generating) return

    setGenerating(true)
    setMessage(null)

    try {
      const response = await generateContent({ prompt: clean, channels: CHANNELS })
      const firstMediaPrompt = response.items.find((item) => item.media_alt)?.media_alt
      let imageUrl: string | undefined

      if (firstMediaPrompt) {
        try {
          const image = await generateImage(firstMediaPrompt)
          imageUrl = image.image_url || (image.image_b64 ? `data:image/png;base64,${image.image_b64}` : undefined)
        } catch {
          imageUrl = undefined
        }
      }

      const byChannel = response.items.reduce<Partial<Record<ChannelType, MockContent>>>((acc, item) => {
        acc[item.channel] = contentFromItem(item, clean, brand, imageUrl)
        return acc
      }, {})

      const fallback = byChannel.email ?? contentFromText(clean, brand, imageUrl)
      const localCampaign: Campaign = {
        id: crypto.randomUUID(),
        name: nameFromPrompt(clean, campaigns.length + 1),
        prompt: clean,
        content: fallback,
        contentByChannel: byChannel,
      }

      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        throw new Error('No hay una sesión activa para guardar la campaña.')
      }

      const { data: inserted, error: saveError } = await supabase
        .from('studio_campaigns')
        .insert({
          user_id: userId,
          name: localCampaign.name,
          prompt: localCampaign.prompt,
          content: localCampaign.content,
          content_by_channel: localCampaign.contentByChannel,
        })
        .select('id,name,prompt,content,content_by_channel')
        .single()

      if (saveError) {
        setCampaigns((prev) => [localCampaign, ...prev])
        setSelectedId(localCampaign.id)
        setPrompt('')
        setMessage('Campaña generada, pero no se guardó en Supabase. Ejecuta el SQL de studio_campaigns.')
        return
      }

      const savedCampaign = rowToCampaign(inserted as StudioCampaignRow)
      setCampaigns((prev) => [savedCampaign, ...prev])
      setSelectedId(savedCampaign.id)
      setPrompt('')
    } catch (error) {
      setMessage(parseApiError(error))
    } finally {
      setGenerating(false)
    }
  }

  function handleDelete(id: string) {
    void supabase.from('studio_campaigns').delete().eq('id', id)
    setCampaigns((prev) => {
      const next = prev.filter((campaign) => campaign.id !== id)
      if (id === selectedId) setSelectedId(next[0]?.id ?? '')
      return next
    })
  }

  function handleVoiceInput() {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setMessage('Tu navegador no soporta dictado por voz desde esta pantalla.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'es-ES'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
      setPrompt((current) => `${current}${current ? ' ' : ''}${transcript}`.trim())
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setMessage('No se pudo capturar el audio. Inténtalo nuevamente.')
    }
    setListening(true)
    recognition.start()
  }

  return (
    <section className="page studio-page">
      <div className="studio-workspace">
        <div className="studio-main">
          <div className="dashboard-heading studio-heading">
            <h1>Estudio de contenido</h1>
            <p>Describe tu campaña, genérala y mira cómo quedaría en cada canal.</p>
          </div>

          <div className="studio-generator">
            <label htmlFor="studio-prompt">¿Qué campaña quieres generar?</label>
            <div className="studio-prompt-wrap">
              <textarea
                id="studio-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ej. Anuncia un 2x1 en sesiones de fotos para el Día de la Madre, tono cálido y cercano."
              />
              <button
                type="button"
                className={`studio-mic-btn ${listening ? 'is-listening' : ''}`}
                onClick={handleVoiceInput}
                aria-label="Dictar campaña con micrófono"
                title="Dictar campaña"
              >
                {listening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            </div>
            <div className="studio-generator-footer">
              <span className="studio-generator-note">
                La IA generará texto + imagen para cada red.
              </span>
              <button
                type="button"
                className="button button-primary"
                onClick={() => void handleGenerate()}
                disabled={!prompt.trim() || generating}
              >
                <Sparkles size={15} strokeWidth={2} />
                {generating ? 'Generando...' : 'Generar campaña'}
              </button>
            </div>
            {message && <p className="form-message form-message-error">{message}</p>}
          </div>

          <div className="studio-list">
            <div className="studio-list-head">
              <span>Mis campañas</span>
              <small>{campaigns.length}</small>
            </div>
            <div className="studio-list-scroll">
              {loadingCampaigns ? (
                <p className="studio-empty">Cargando campañas guardadas...</p>
              ) : campaigns.length === 0 ? (
                <p className="studio-empty">Aún no has generado campañas. Describe una arriba.</p>
              ) : (
                campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    className={`studio-card ${campaign.id === selectedId ? 'is-active' : ''}`}
                    onClick={() => setSelectedId(campaign.id)}
                  >
                    <span className="studio-card-icon">
                      <Megaphone size={16} strokeWidth={1.9} />
                    </span>
                    <span className="studio-card-copy">
                      <strong>{campaign.name}</strong>
                      <small>{campaign.prompt}</small>
                    </span>
                    <span
                      className="studio-card-delete"
                      role="button"
                      tabIndex={0}
                      aria-label="Eliminar campaña"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(campaign.id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.stopPropagation()
                          handleDelete(campaign.id)
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="studio-preview">
          {selected ? (
            <SocialPreview content={selected.content} contentByChannel={selected.contentByChannel} loading={generating} />
          ) : (
            <div className="studio-preview-empty">
              <Sparkles size={28} strokeWidth={1.3} />
              <strong>Sin campaña seleccionada</strong>
              <p>Genera o elige una campaña para ver el preview.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
