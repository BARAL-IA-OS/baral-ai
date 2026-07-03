import { useState } from 'react'
import { Mail, MessageCircle, Camera, Globe, Music2, ChevronDown } from 'lucide-react'
import type { ChannelType } from '../../types'
import {
  EmailMock,
  WhatsAppMock,
  InstagramMock,
  FacebookMock,
  TikTokMock,
  type MockContent,
} from './ChannelMocks'

const CHANNELS: { id: ChannelType; label: string; Icon: React.ElementType }[] = [
  { id: 'email', label: 'Email', Icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', Icon: Camera },
  { id: 'facebook', label: 'Facebook', Icon: Globe },
  { id: 'tiktok', label: 'TikTok', Icon: Music2 },
]

const SAMPLE: MockContent = {
  brandName: 'Studio Foto',
  handle: 'studiofoto',
  initials: 'SF',
  recipient: 'María García',
  subject: 'María, te extrañamos en Studio Foto',
  caption:
    'Ya está abierta la agenda de sesiones de primavera. Luz natural, exteriores y entrega en 48h para que tu familia tenga recuerdos que duran.',
  hashtags: ['#FotografíaFamiliar', '#Medellín', '#SesiónDeFotos'],
  cta: 'Reservar mi sesión',
  mediaAlt: 'Familia en sesión al aire libre, tonos cálidos de atardecer',
}

interface SocialPreviewProps {
  content?: MockContent
  contentByChannel?: Partial<Record<ChannelType, MockContent>>
  initialChannel?: ChannelType
  loading?: boolean
}

export function SocialPreview({ content = SAMPLE, contentByChannel, initialChannel = 'email', loading = false }: SocialPreviewProps) {
  const [channel, setChannel] = useState<ChannelType>(initialChannel)
  const [open, setOpen] = useState(false)

  const current = CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0]
  const activeContent = contentByChannel?.[channel] ?? content

  return (
    <div className={`social-preview social-preview-${channel}`}>
      <div className="channel-dd">
        <button type="button" className="channel-dd-btn" onClick={() => setOpen((value) => !value)}>
          <current.Icon size={15} strokeWidth={1.9} />
          <span>{current.label}</span>
          <ChevronDown size={14} className="chev" />
        </button>
        {open ? (
          <>
            <div className="channel-dd-backdrop" onClick={() => setOpen(false)} />
            <ul className="channel-dd-menu" role="listbox">
              {CHANNELS.map(({ id, label, Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={channel === id}
                    className={channel === id ? 'is-active' : ''}
                    onClick={() => {
                      setChannel(id)
                      setOpen(false)
                    }}
                  >
                    <Icon size={15} strokeWidth={1.9} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="cp-stage">
        <div className="phone">
          <span className="phone-notch" />
          <div className="phone-screen">
            {channel === 'email' && <EmailMock c={activeContent} />}
            {channel === 'whatsapp' && <WhatsAppMock c={activeContent} />}
            {channel === 'instagram' && <InstagramMock c={activeContent} />}
            {channel === 'facebook' && <FacebookMock c={activeContent} />}
            {channel === 'tiktok' && <TikTokMock c={activeContent} />}
            {loading && (
              <div className="phone-loading-overlay">
                <div className="phone-spinner" />
                <p>Generando...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
