import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import dashboardPreview from '../assets/login/img1.png'
import baralLogo from '../assets/login/logo baral AI.png'

/* ── SVG micro-components (icons used in the form) ──────────────── */

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C3AED" strokeWidth="1.5">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" fill="#6C3AED" opacity="0.15" />
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  )
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

function InteractiveParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement

    if (!canvas || !parent || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) return

    let width = 0
    let height = 0
    let animationFrame = 0
    let particles: Particle[] = []
    const pointer = { x: 0, y: 0, active: false }

    const createParticles = () => {
      const amount = Math.min(58, Math.max(28, Math.round((width * height) / 19000)))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        radius: Math.random() * 1.7 + 0.8,
        opacity: Math.random() * 0.45 + 0.25,
      }))
    }

    const resize = () => {
      const bounds = parent.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      createParticles()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top
      pointer.active = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height
      pointer.x = x
      pointer.y = y
    }

    const handlePointerLeave = () => {
      pointer.active = false
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)

      particles.forEach((particle, index) => {
        if (pointer.active) {
          const dx = pointer.x - particle.x
          const dy = pointer.y - particle.y
          const distance = Math.hypot(dx, dy)

          if (distance < 150 && distance > 0) {
            const force = (1 - distance / 150) * 0.018
            particle.vx += (dx / distance) * force
            particle.vy += (dy / distance) * force
          }
        }

        particle.vx = Math.max(-0.7, Math.min(0.7, particle.vx * 0.998 + (Math.random() - 0.5) * 0.002))
        particle.vy = Math.max(-0.7, Math.min(0.7, particle.vy * 0.998 + (Math.random() - 0.5) * 0.002))
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -8) particle.x = width + 8
        if (particle.x > width + 8) particle.x = -8
        if (particle.y < -8) particle.y = height + 8
        if (particle.y > height + 8) particle.y = -8

        for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
          const next = particles[nextIndex]
          const dx = particle.x - next.x
          const dy = particle.y - next.y
          const distance = Math.hypot(dx, dy)

          if (distance < 112) {
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(next.x, next.y)
            context.strokeStyle = `rgba(108, 58, 237, ${(1 - distance / 112) * 0.13})`
            context.lineWidth = 0.7
            context.stroke()
          }
        }

        if (pointer.active) {
          const pointerDistance = Math.hypot(pointer.x - particle.x, pointer.y - particle.y)
          if (pointerDistance < 145) {
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(pointer.x, pointer.y)
            context.strokeStyle = `rgba(79, 70, 229, ${(1 - pointerDistance / 145) * 0.28})`
            context.lineWidth = 0.9
            context.stroke()
          }
        }

        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(108, 58, 237, ${particle.opacity})`
        context.fill()
      })

      animationFrame = window.requestAnimationFrame(draw)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(parent)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    resize()
    draw()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="login-particles" aria-hidden="true" />
}

/* ── Main Login Component ───────────────────────────────────────── */

export function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    if (mode === 'register') {
      setMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmación.')
    }
  }

  /* ── Styles ─────────────────────────────────────────────────── */

  const styles = {
    /* page wrapper */
    page: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 56fr) minmax(480px, 44fr)',
      height: '100svh',
      minHeight: '100svh',
      fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      background: '#F7F5FF',
      overflow: 'hidden',
    } as React.CSSProperties,

    /* ── LEFT HERO ─────────────────────────────────────────────── */
    hero: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 'clamp(40px, 5vw, 88px)',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0,
      height: '100%',
    } as React.CSSProperties,

    heroBg1: {
      position: 'absolute',
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%)',
      top: -100,
      right: -100,
      pointerEvents: 'none',
    } as React.CSSProperties,

    heroBg2: {
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 70%)',
      bottom: -80,
      left: -80,
      pointerEvents: 'none',
    } as React.CSSProperties,

    heroContent: {
      position: 'relative',
      zIndex: 1,
      width: '100%',
      maxWidth: 680,
      margin: '0 auto',
    } as React.CSSProperties,

    logoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 26,
    } as React.CSSProperties,

    heroLogoImg: {
      height: 76,
      width: 'auto',
      objectFit: 'contain',
    } as React.CSSProperties,

    heroTitle: {
      fontSize: 'clamp(2rem, 3vw, 3.25rem)',
      fontWeight: 800,
      lineHeight: 1.04,
      color: '#1E1B4B',
      letterSpacing: '-0.035em',
      marginBottom: 18,
    } as React.CSSProperties,

    heroTitleBrand: {
      background: 'linear-gradient(135deg, #6C3AED 0%, #4F46E5 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: 'clamp(3.25rem, 5.5vw, 5rem)',
      fontWeight: 900,
      display: 'block',
      lineHeight: 1,
      letterSpacing: '-0.055em',
      marginTop: 6,
    } as React.CSSProperties,

    heroDesc: {
      fontSize: 'clamp(1rem, 1.25vw, 1.125rem)',
      color: '#64748B',
      lineHeight: 1.65,
      marginBottom: 32,
      maxWidth: 520,
    } as React.CSSProperties,

    dashboardImg: {
      width: '100%',
      maxWidth: 620,
      display: 'block',
      borderRadius: 22,
      boxShadow: '0 28px 70px rgba(79,70,229,.16), 0 8px 24px rgba(30,27,75,.06)',
      border: '1px solid rgba(139,92,246,.14)',
    } as React.CSSProperties,

    sparkle: {
      position: 'absolute',
      top: 60,
      right: '38%',
      animation: 'loginSparkle 3s ease-in-out infinite',
    } as React.CSSProperties,

    circle: {
      position: 'absolute',
      top: 110,
      right: '28%',
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: '2px solid rgba(139,92,246,.25)',
      animation: 'loginFloat 6s ease-in-out infinite',
    } as React.CSSProperties,

    /* ── RIGHT FORM PANEL ──────────────────────────────────────── */
    formPanel: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(28px, 4vw, 72px)',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'rgba(250,249,255,.76)',
      borderLeft: '1px solid rgba(124,58,237,.06)',
    } as React.CSSProperties,

    card: {
      width: '100%',
      maxWidth: 520,
      background: '#ffffff',
      borderRadius: 28,
      padding: 'clamp(32px, 3vw, 48px)',
      boxShadow: '0 28px 80px rgba(76,29,149,.11), 0 8px 24px rgba(30,27,75,.05)',
      border: '1px solid rgba(124,58,237,.09)',
      margin: 'auto 0',
    } as React.CSSProperties,

    cardLogoWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 24,
    } as React.CSSProperties,

    cardLogoImg: {
      height: 76,
      width: 'auto',
      objectFit: 'contain',
    } as React.CSSProperties,

    cardTitle: {
      fontSize: 'clamp(1.6rem, 2vw, 1.9rem)',
      fontWeight: 800,
      color: '#1E1B4B',
      textAlign: 'center',
      letterSpacing: '-0.025em',
      marginBottom: 8,
    } as React.CSSProperties,

    cardSubtitle: {
      fontSize: '0.95rem',
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 1.55,
    } as React.CSSProperties,

    fieldLabel: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 700,
      color: '#25214F',
      marginBottom: 8,
    } as React.CSSProperties,

    inputWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
      height: 54,
      border: '1px solid #DDE1EA',
      borderRadius: 14,
      background: '#FBFCFE',
      transition: 'border-color .2s, box-shadow .2s',
      marginBottom: 20,
    } as React.CSSProperties,

    input: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontSize: '0.95rem',
      color: '#1E1B4B',
      fontFamily: 'inherit',
    } as React.CSSProperties,

    eyeBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 2,
    } as React.CSSProperties,

    rememberRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 26,
    } as React.CSSProperties,

    checkboxWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    } as React.CSSProperties,

    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background .15s, border-color .15s',
    } as React.CSSProperties,

    checkboxChecked: {
      background: '#6C3AED',
      border: '2px solid #6C3AED',
    } as React.CSSProperties,

    checkboxUnchecked: {
      background: '#ffffff',
      border: '2px solid #D1D5DB',
    } as React.CSSProperties,

    checkboxLabel: {
      fontSize: '0.875rem',
      color: '#374151',
      fontWeight: 500,
    } as React.CSSProperties,

    forgotLink: {
      fontSize: '0.875rem',
      color: '#6C3AED',
      fontWeight: 600,
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      fontFamily: 'inherit',
    } as React.CSSProperties,

    submitBtn: {
      width: '100%',
      height: 56,
      border: 'none',
      borderRadius: 14,
      background: 'linear-gradient(135deg, #7C3AED 0%, #6C3AED 40%, #4F46E5 100%)',
      color: '#ffffff',
      fontSize: '1rem',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      transition: 'transform .15s, box-shadow .15s, opacity .15s',
      boxShadow: '0 4px 16px rgba(108,58,237,.35)',
      fontFamily: 'inherit',
      marginBottom: 26,
    } as React.CSSProperties,

    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 22,
    } as React.CSSProperties,

    dividerLine: {
      flex: 1,
      height: 1,
      background: '#E5E7EB',
    } as React.CSSProperties,

    dividerText: {
      fontSize: '0.84rem',
      color: '#9CA3AF',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    socialRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 30,
    } as React.CSSProperties,

    socialBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      border: '1.5px solid #E5E7EB',
      borderRadius: 12,
      background: '#ffffff',
      cursor: 'pointer',
      fontSize: '0.92rem',
      fontWeight: 600,
      color: '#374151',
      transition: 'border-color .2s, box-shadow .2s',
      fontFamily: 'inherit',
    } as React.CSSProperties,

    bottomText: {
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#64748B',
    } as React.CSSProperties,

    bottomLink: {
      color: '#6C3AED',
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
    } as React.CSSProperties,

    errorMsg: {
      padding: '10px 14px',
      borderRadius: 10,
      background: '#FEF2F2',
      color: '#DC2626',
      fontSize: '0.82rem',
      marginBottom: 16,
      border: '1px solid #FECACA',
    } as React.CSSProperties,

    successMsg: {
      padding: '10px 14px',
      borderRadius: 10,
      background: '#F0FDF4',
      color: '#16A34A',
      fontSize: '0.82rem',
      marginBottom: 16,
      border: '1px solid #BBF7D0',
    } as React.CSSProperties,

    warningMsg: {
      padding: '10px 14px',
      borderRadius: 10,
      background: '#FFFBEB',
      color: '#D97706',
      fontSize: '0.82rem',
      marginBottom: 16,
      border: '1px solid #FDE68A',
    } as React.CSSProperties,
  }

  const keyframes = `
    @keyframes loginSparkle {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
      50% { transform: scale(1.2) rotate(15deg); opacity: 1; }
    }
    @keyframes loginFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes loginSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes loginPulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(108,58,237,.35); }
      50% { box-shadow: 0 6px 24px rgba(108,58,237,.5); }
    }
    .login-input-wrap:focus-within {
      border-color: #6C3AED !important;
      box-shadow: 0 0 0 3px rgba(108,58,237,.1) !important;
      background: #ffffff !important;
    }
    .login-particles {
      position: absolute;
      inset: 0;
      z-index: 0;
      display: block;
      pointer-events: none;
      opacity: .9;
      mask-image: linear-gradient(to right, black 76%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 76%, transparent 100%);
    }
    .login-input-wrap input::placeholder {
      color: #98A2B3;
      opacity: 1;
    }
    .login-page-layout button:focus-visible,
    .login-page-layout [role="checkbox"]:focus-visible {
      outline: 3px solid rgba(108,58,237,.22);
      outline-offset: 3px;
    }
    .login-submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(108,58,237,.45);
    }
    .login-submit-btn:active {
      transform: translateY(0);
    }
    .login-social-btn:hover {
      border-color: #C4B5FD !important;
      box-shadow: 0 2px 8px rgba(108,58,237,.08);
    }
    @media (max-width: 1280px) {
      .login-page-layout {
        grid-template-columns: minmax(0, 52fr) minmax(450px, 48fr) !important;
      }
      .login-hero-side {
        padding: 40px !important;
      }
      .login-form-side {
        padding: 28px !important;
      }
      .login-form-card {
        padding: 34px !important;
      }
    }
    @media (max-width: 900px) {
      .login-page-layout {
        display: block !important;
        height: 100svh !important;
        min-height: 100svh;
        overflow: hidden !important;
      }
      .login-hero-side { display: none !important; }
      .login-form-side {
        max-width: 100% !important;
        height: 100svh !important;
        min-height: 0 !important;
        padding: 32px 20px !important;
        border-left: 0 !important;
        background:
          radial-gradient(circle at 50% 0%, rgba(124,58,237,.13), transparent 34%),
          #F7F5FF !important;
      }
      .login-form-card {
        max-width: 520px !important;
      }
    }
    @media (max-width: 520px) {
      .login-form-side {
        align-items: center !important;
        padding: 18px 12px !important;
      }
      .login-form-card {
        border-radius: 22px !important;
        padding: 28px 22px !important;
      }
      .login-social-row {
        grid-template-columns: 1fr !important;
      }
      .login-remember-row {
        align-items: flex-start !important;
        flex-direction: column !important;
        gap: 14px !important;
      }
    }
    @media (max-height: 850px) {
      .login-hero-side {
        padding-top: 28px !important;
        padding-bottom: 28px !important;
      }
      .login-hero-logo,
      .login-card-logo {
        height: 58px !important;
      }
      .login-hero-logo-row {
        margin-bottom: 14px !important;
      }
      .login-hero-title {
        margin-bottom: 10px !important;
      }
      .login-hero-description {
        margin-bottom: 18px !important;
        line-height: 1.45 !important;
      }
      .login-form-side {
        padding-top: 18px !important;
        padding-bottom: 18px !important;
      }
      .login-form-card {
        padding-top: 24px !important;
        padding-bottom: 24px !important;
      }
      .login-card-logo-wrap {
        margin-bottom: 12px !important;
      }
      .login-card-title {
        font-size: 1.45rem !important;
        margin-bottom: 4px !important;
      }
      .login-card-subtitle {
        margin-bottom: 18px !important;
      }
      .login-input-wrap {
        height: 48px !important;
        margin-bottom: 13px !important;
      }
      .login-remember-row,
      .login-submit-btn {
        margin-bottom: 16px !important;
      }
      .login-submit-btn {
        height: 48px !important;
      }
      .login-divider {
        margin-bottom: 14px !important;
      }
      .login-social-row {
        margin-bottom: 18px !important;
      }
      .login-social-btn {
        height: 44px !important;
      }
    }
    @media (max-height: 680px) {
      .login-card-logo-wrap {
        display: none !important;
      }
      .login-card-subtitle {
        margin-bottom: 12px !important;
      }
      .login-form-card {
        padding-top: 18px !important;
        padding-bottom: 18px !important;
      }
      .login-input-wrap {
        height: 44px !important;
        margin-bottom: 10px !important;
      }
      .login-social-row {
        display: none !important;
      }
      .login-divider {
        display: none !important;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .login-page-layout *,
      .login-page-layout *::before,
      .login-page-layout *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `

  return (
    <>
      <style>{keyframes}</style>
      <main style={styles.page} className="login-page-layout">
        {/* ── LEFT: Hero / Showcase ─────────────────────────────── */}
        <section style={styles.hero} className="login-hero-side">
          <InteractiveParticles />

          {/* Decorative blurs */}
          <div style={styles.heroBg1} />
          <div style={styles.heroBg2} />

          {/* Decorative sparkle & circle */}
          <div style={styles.sparkle}><SparkleIcon /></div>
          <div style={styles.circle} />

          <div style={styles.heroContent}>
            {/* Logo */}
            {/* <div style={styles.logoRow}>
              <img src={baralLogo} alt="Baral AI" style={styles.heroLogoImg} />
            </div> */}

            {/* Title */}
            <h1 style={styles.heroTitle} className="login-hero-title">
              Bienvenido a
              <span style={styles.heroTitleBrand}>Baral AI</span>
            </h1>

            {/* Description */}
            <p style={styles.heroDesc} className="login-hero-description">
              Estrategia creativa, marketing inteligente
              y soluciones que impulsan tu marca.
            </p>

            {/* Dashboard preview */}
            <img
              src={dashboardPreview}
              alt="Dashboard de marketing de Baral"
              style={styles.dashboardImg}
            />
          </div>
        </section>

        {/* ── RIGHT: Login form ─────────────────────────────────── */}
        <section style={styles.formPanel} className="login-form-side">
          <div
            className="login-form-card"
            style={{
              ...styles.card,
              animation: 'loginSlideUp .5s ease-out',
            }}
          >
            {/* Card logo */}
            <div style={styles.cardLogoWrap} className="login-card-logo-wrap">
              <img src={baralLogo} alt="Baral AI" style={styles.cardLogoImg} className="login-card-logo" />
            </div>

            {/* Title */}
            <h2 style={styles.cardTitle} className="login-card-title">
              {mode === 'login' ? 'Inicia sesión' : 'Crear cuenta'}
            </h2>
            <p style={styles.cardSubtitle} className="login-card-subtitle">
              {mode === 'login'
                ? 'Accede a tu plataforma de estrategia y marketing.'
                : 'Crea tu cuenta para iniciar el onboarding de Baral AI.'}
            </p>

            {/* Supabase warning */}
            {!isSupabaseConfigured && (
              <div style={styles.warningMsg}>
                Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
              </div>
            )}

            {/* Error / success message */}
            {message && (
              <div style={mode === 'register' && !message.includes('error') ? styles.successMsg : styles.errorMsg}>
                {message}
              </div>
            )}

            <form onSubmit={(event) => void handleSubmit(event)} autoComplete="on">
              {/* Email */}
              <label style={styles.fieldLabel} htmlFor="login-email">
                Correo electrónico
              </label>
              <div style={styles.inputWrap} className="login-input-wrap">
                <MailIcon />
                <input
                  id="login-email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <label style={styles.fieldLabel} htmlFor="login-password">
                Contraseña
              </label>
              <div style={styles.inputWrap} className="login-input-wrap">
                <LockIcon />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {/* Remember + Forgot */}
              {mode === 'login' && (
                <div style={styles.rememberRow} className="login-remember-row">
                  <div
                    style={styles.checkboxWrap}
                    onClick={() => setRememberMe((v) => !v)}
                    role="checkbox"
                    aria-checked={rememberMe}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setRememberMe((v) => !v)
                    }}
                  >
                    <div
                      style={{
                        ...styles.checkbox,
                        ...(rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked),
                      }}
                    >
                      {rememberMe && <CheckIcon />}
                    </div>
                    <span style={styles.checkboxLabel}>Recordarme</span>
                  </div>
                  <button type="button" style={styles.forgotLink}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                className="login-submit-btn"
                disabled={loading}
              >
                {loading
                  ? 'Cargando...'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Crear cuenta'}
                {!loading && <ArrowRightIcon />}
              </button>

              {/* Divider */}
              {mode === 'login' && (
                <>
                  <div style={styles.divider} className="login-divider">
                    <div style={styles.dividerLine} />
                    <span style={styles.dividerText}>o continúa con</span>
                    <div style={styles.dividerLine} />
                  </div>

                  {/* Social buttons */}
                  <div style={styles.socialRow} className="login-social-row">
                    <button type="button" style={styles.socialBtn} className="login-social-btn">
                      <GoogleIcon />
                      Google
                    </button>
                    <button type="button" style={styles.socialBtn} className="login-social-btn">
                      <MicrosoftIcon />
                      Microsoft
                    </button>
                  </div>
                </>
              )}

              {/* Bottom toggle */}
              <p style={styles.bottomText}>
                {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <button
                  type="button"
                  style={styles.bottomLink}
                  onClick={() => {
                    setMode((m) => (m === 'login' ? 'register' : 'login'))
                    setMessage(null)
                  }}
                >
                  {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
              </p>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
