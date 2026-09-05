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
  brandName: 'Tu marca',
  handle: 'tumarca',
  initials: 'TM',
  recipient: 'María García',
  subject: 'Una novedad pensada para ti',
  caption:
    'Aquí aparecerá el contenido generado a partir del ADN confirmado de tu negocio.',
  hashtags: ['#TuMarca', '#Novedad'],
  cta: 'Conocer más',
  mediaAlt: 'Recurso visual alineado con la identidad del negocio',
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
