import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Music2,
  Plus,
  Search,
  Star,
  Image as ImageIcon,
  CheckCheck,
  ChevronLeft,
} from 'lucide-react'

export interface MockContent {
  brandName: string
  handle: string
  initials: string
  recipient: string
  subject: string
  caption: string
  hashtags: string[]
  cta: string
  mediaAlt: string
}

/** Placeholder de la imagen/infografía generada por IA. */
function GeneratedMedia({ alt, ratio = 'square' }: { alt: string; ratio?: 'square' | 'vertical' | 'wide' }) {
  return (
    <div className={`mock-media mock-media-${ratio}`} role="img" aria-label={alt}>
      <ImageIcon size={22} strokeWidth={1.5} />
      <span>{alt}</span>
      <small>Imagen generada por IA</small>
    </div>
  )
}

/* ── Email (Gmail) ──────────────────────────────────────────────── */
export function EmailMock({ c }: { c: MockContent }) {
  return (
    <div className="mock mock-email">
      <div className="mock-email-toolbar">
        <ChevronLeft size={16} />
        <span className="mock-email-actions"><Star size={15} /><MoreHorizontal size={15} /></span>
      </div>
      <div className="mock-email-subject">{c.subject}</div>
      <div className="mock-email-sender">
        <span className="mock-avatar">{c.initials}</span>
        <div>
          <strong>{c.brandName}</strong>
          <small>para mí</small>
        </div>
        <span className="mock-email-time">9:41</span>
      </div>
      <div className="mock-email-body">
        <p>Hola {c.recipient},</p>
        <p>{c.caption}</p>
        <GeneratedMedia alt={c.mediaAlt} ratio="wide" />
        <a className="mock-email-cta" href="#preview" onClick={(e) => e.preventDefault()}>{c.cta}</a>
        <p className="mock-email-signature">— Equipo {c.brandName}</p>
      </div>
    </div>
  )
}

/* ── WhatsApp ───────────────────────────────────────────────────── */
export function WhatsAppMock({ c }: { c: MockContent }) {
  return (
    <div className="mock mock-whatsapp">
      <div className="mock-wa-header">
        <span className="mock-avatar mock-avatar-wa">{c.initials}</span>
        <div>
          <strong>{c.brandName}</strong>
          <small>en línea</small>
        </div>
      </div>
      <div className="mock-wa-chat">
        <div className="mock-wa-bubble">
          <GeneratedMedia alt={c.mediaAlt} ratio="square" />
          <p>Hola {c.recipient} 👋 {c.caption}</p>
          <button type="button" className="mock-wa-cta">{c.cta}</button>
          <span className="mock-wa-time">9:41 <CheckCheck size={13} /></span>
        </div>
      </div>
    </div>
  )
}

/* ── Instagram ──────────────────────────────────────────────────── */
export function InstagramMock({ c }: { c: MockContent }) {
  return (
    <div className="mock mock-instagram">
      <div className="mock-ig-header">
        <span className="mock-avatar mock-avatar-ig">{c.initials}</span>
        <strong>{c.handle}</strong>
        <MoreHorizontal size={18} className="mock-ig-more" />
      </div>
      <GeneratedMedia alt={c.mediaAlt} ratio="square" />
      <div className="mock-ig-actions">
        <Heart size={22} />
        <MessageCircle size={22} />
        <Send size={22} />
        <Bookmark size={22} className="mock-ig-save" />
      </div>
      <div className="mock-ig-caption">
        <strong>1.248 Me gusta</strong>
        <p><strong>{c.handle}</strong> {c.caption}</p>
        <p className="mock-hashtags">{c.hashtags.join(' ')}</p>
      </div>
    </div>
  )
}

/* ── Facebook ───────────────────────────────────────────────────── */
export function FacebookMock({ c }: { c: MockContent }) {
  return (
    <div className="mock mock-facebook">
      <div className="mock-fb-header">
        <span className="mock-avatar mock-avatar-fb">{c.initials}</span>
        <div>
          <strong>{c.brandName}</strong>
          <small>Publicación · 9:41 · 🌎</small>
        </div>
        <MoreHorizontal size={18} className="mock-fb-more" />
      </div>
      <p className="mock-fb-text">{c.caption} {c.hashtags.join(' ')}</p>
      <GeneratedMedia alt={c.mediaAlt} ratio="wide" />
      <div className="mock-fb-cta-row">
        <span>{c.brandName.toLowerCase().replace(/\s/g, '')}.com</span>
        <button type="button">{c.cta}</button>
      </div>
      <div className="mock-fb-actions">
        <span><ThumbsUp size={17} /> Me gusta</span>
        <span><MessageCircle size={17} /> Comentar</span>
        <span><Share2 size={17} /> Compartir</span>
      </div>
    </div>
  )
}

/* ── TikTok (carrusel 9:16) ─────────────────────────────────────── */
export function TikTokMock({ c }: { c: MockContent }) {
  return (
    <div className="mock mock-tiktok">
      <div className="mock-tt-stage">
        <GeneratedMedia alt={c.mediaAlt} ratio="vertical" />
        <div className="mock-tt-topbar">
          <Search size={18} />
          <span className="mock-tt-tabs"><b>Para ti</b> · Siguiendo</span>
          <span />
        </div>
        <div className="mock-tt-carousel-dots"><i className="on" /><i /><i /></div>
        <div className="mock-tt-rail">
          <span className="mock-avatar mock-avatar-tt">{c.initials}<i className="mock-tt-plus"><Plus size={10} /></i></span>
          <span><Heart size={26} fill="currentColor" /><b>12.4k</b></span>
          <span><MessageCircle size={26} fill="currentColor" /><b>318</b></span>
          <span><Bookmark size={26} fill="currentColor" /><b>1.2k</b></span>
          <span><Share2 size={26} fill="currentColor" /><b>540</b></span>
          <span className="mock-tt-disc"><Music2 size={16} /></span>
        </div>
        <div className="mock-tt-caption">
          <strong>@{c.handle}</strong>
          <p>{c.caption}</p>
          <p className="mock-hashtags">{c.hashtags.join(' ')}</p>
          <span className="mock-tt-music"><Music2 size={13} /> Audio original — {c.brandName}</span>
        </div>
      </div>
    </div>
  )
}
