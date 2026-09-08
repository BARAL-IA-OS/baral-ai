import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers3, RefreshCw, Save, Sparkles } from 'lucide-react'
import { SocialPreview } from '../components/preview/SocialPreview'
import type { MockContent } from '../components/preview/ChannelMocks'
import { getBrandBrain } from '../hooks/useBrandBrain'
import { getBrandAssets } from '../features/business-dna/api'
import type { BrandAsset } from '../features/business-dna/types'
import { getCampaign, parseApiError, regenerateCampaignChannel, updateCampaignChannel } from '../lib/api'
import type { BrandBrain, ChannelType, ContentItem, CreativeCampaign } from '../types'

const channelLabels: Record<ChannelType, string> = {
  email: 'Email', whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
}

function brandIdentity(brand: BrandBrain | null) {
  const source = brand?.business_name || (brand?.website_url
    ? brand.website_url.replace(/^https?:\/\//, '').split('.')[0]
    : brand?.industria || 'Tu marca')
  const brandName = source.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const compact = brandName.replace(/\s/g, '')
  return {
    brandName,
    handle: compact.toLowerCase(),
    initials: brandName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  }
}

function toMock(item: ContentItem | undefined, brand: BrandBrain | null, fallback: string): MockContent {
  return {
    ...brandIdentity(brand), recipient: 'Cliente',
    subject: item?.subject || fallback.slice(0, 60), caption: item?.caption || fallback,
    hashtags: item?.hashtags || [], cta: item?.cta || 'Conocer más',
    mediaAlt: item?.media_alt || 'Recurso visual de campaña',
  }
}

export function Studio() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<CreativeCampaign | null>(null)
  const [brand, setBrand] = useState<BrandBrain | null>(null)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [mediaError, setMediaError] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('instagram')
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!campaignId) return
    void Promise.all([getCampaign(campaignId), getBrandBrain()])
      .then(([response, brandData]) => {
        setCampaign(response.campaign)
        setBrand(brandData)
        if (response.campaign.channels[0]) setSelectedChannel(response.campaign.channels[0])
      })
      .catch((reason) => setError(parseApiError(reason)))
      .finally(() => setLoading(false))
  }, [campaignId])

  useEffect(() => {
    let active = true
    getBrandAssets().then((response) => {
      if (active) setAssets(response.assets)
    }).catch(() => { if (active) setMediaError('No pudimos cargar las imágenes. Recarga para volver a intentarlo.') })
    return () => { active = false }
  }, [])

  const selectedAssets = useMemo(() => (campaign?.selected_assets ?? [])
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is BrandAsset => Boolean(asset)), [assets, campaign])

  const mockByChannel = useMemo(() => {
    if (!campaign) return {}
    return Object.entries(campaign.content_by_channel).reduce<Partial<Record<ChannelType, MockContent>>>((result, [channel, item]) => {
      result[channel as ChannelType] = toMock(item, brand, campaign.prompt)
      result[channel as ChannelType]!.imageUrl = selectedAssets[0]?.signed_url || undefined
      return result
    }, {})
  }, [brand, campaign, selectedAssets])

  async function regenerate() {
    if (!campaignId || regenerating) return
    setRegenerating(true)
    setError('')
    try {
      const response = await regenerateCampaignChannel(campaignId, selectedChannel, instruction)
      setCampaign(response.campaign)
      setInstruction('')
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setRegenerating(false)
    }
  }

  function editCaption(value: string) {
    setCampaign((current) => current ? {
      ...current,
      content_by_channel: {
        ...current.content_by_channel,
        [selectedChannel]: {
          ...(current.content_by_channel[selectedChannel] || { channel: selectedChannel }),
          channel: selectedChannel,
          caption: value,
        },
      },
    } : current)
  }

  async function saveChannel() {
    if (!campaignId || !campaign || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await updateCampaignChannel(campaignId, selectedChannel, campaign.content_by_channel[selectedChannel] || {})
      setCampaign(response.campaign)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setSaving(false)
    }
  }

  if (!campaignId) return <Navigate to="/campaigns" replace />
  if (loading) return <section className="page omar-page"><p className="omar-loading">Abriendo el Estudio…</p></section>
  if (!campaign) return <section className="page omar-page"><p className="omar-alert error">{error || 'No se encontró la campaña.'}</p></section>

  const fallback = toMock(campaign.content_by_channel[selectedChannel], brand, campaign.prompt)
  return (
    <section className="page omar-page studio-v2-page">
      <header className="studio-v2-header">
        <button type="button" className="icon-button" onClick={() => navigate('/campaigns')} aria-label="Volver a campañas"><ArrowLeft size={18} /></button>
        <div><span className="omar-eyebrow"><Layers3 size={14} /> Estudio de campaña</span><h1>{campaign.name}</h1></div>
        <div className="studio-meta">
          <span>{campaign.provider || 'Sin proveedor'}</span><span>${Number(campaign.cost_usd || 0).toFixed(4)}</span><span>v{Math.max(campaign.versions?.length || 1, 1)}</span>
        </div>
      </header>
      {error && <p className="omar-alert error">{error}</p>}
      {mediaError && <p className="omar-alert error" role="status">{mediaError}</p>}
      <div className="studio-v2-layout">
        <aside className="studio-editor omar-panel">
          <div className="studio-brief-summary">
            <span>Brief confirmado</span><h2>{campaign.brief.objective}</h2>
            <dl>
              <div><dt>Producto</dt><dd>{campaign.brief.product}</dd></div>
              <div><dt>Audiencia</dt><dd>{campaign.brief.audience}</dd></div>
              <div><dt>Tono</dt><dd>{campaign.brief.tone}</dd></div>
            </dl>
          </div>
          <div className="studio-channel-tabs">
            {campaign.channels.map((channel) => <button key={channel} type="button" className={selectedChannel === channel ? 'is-selected' : ''} onClick={() => setSelectedChannel(channel)}>{channelLabels[channel]}</button>)}
          </div>
          <div className="channel-copy-editor">
            <label>Contenido generado</label>
            <textarea value={campaign.content_by_channel[selectedChannel]?.caption || ''} onChange={(event) => editCaption(event.target.value)} />
            <button type="button" className="button button-secondary" onClick={() => void saveChannel()} disabled={saving}><Save size={16} />{saving ? 'Guardando…' : 'Guardar edición'}</button>
            <label>Ajuste opcional para este canal</label>
            <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Ej. Más breve, con un CTA directo y sin emojis." />
            <button type="button" className="button button-primary" onClick={() => void regenerate()} disabled={regenerating}>
              {regenerating ? <Sparkles size={16} /> : <RefreshCw size={16} />}{regenerating ? 'Regenerando…' : `Regenerar solo ${channelLabels[selectedChannel]}`}
            </button>
          </div>
          <div className="studio-resource-row"><span>Recursos</span>{selectedAssets.length ? selectedAssets.map((asset) => <small key={asset.id}>{asset.title || asset.original_filename}</small>) : <small>Sin imágenes disponibles</small>}</div>
          {selectedAssets.length > 1 && <p className="omar-footnote">La vista previa usa la primera imagen seleccionada para todos los canales.</p>}
          <p className="omar-footnote">Baral genera y previsualiza. La publicación directa en redes no forma parte de esta fase.</p>
        </aside>
        <main className="studio-preview-v2 omar-panel">
          <div className="preview-title"><span>Vista previa real por canal</span><small>{campaign.status}</small></div>
          <SocialPreview key={selectedChannel} content={fallback} contentByChannel={mockByChannel} initialChannel={selectedChannel} loading={regenerating} />
        </main>
      </div>
    </section>
  )
}
