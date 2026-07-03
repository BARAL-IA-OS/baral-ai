import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import dashboardPreview from '../assets/login/img1.png'
import baralLogo from '../assets/login/logo baral AI.png'

export function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      setMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmacion.')
    }
  }

  const isSuccess = mode === 'register' && message && !message.toLowerCase().includes('error')

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-showcase-content">
          <h1>
            Bienvenido a
            <strong>Baral AI</strong>
          </h1>
          <p>
            Estrategia creativa, marketing inteligente y soluciones que impulsan tu marca.
          </p>
          <img src={dashboardPreview} alt="Vista previa del dashboard de Baral AI" />
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={(event) => void handleSubmit(event)}>
          <img src={baralLogo} alt="Baral AI" className="login-card-logo" />

          <div className="login-card-heading">
            <h2>{mode === 'login' ? 'Inicia sesión' : 'Crear cuenta'}</h2>
            <p>
              {mode === 'login'
                ? 'Accede a tu espacio de estrategia y marketing.'
                : 'Crea tu cuenta para iniciar el onboarding de Baral AI.'}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="login-message login-message-warning">
              Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
            </div>
          )}

          {message && (
            <div className={`login-message ${isSuccess ? 'login-message-success' : 'login-message-error'}`}>
              {message}
            </div>
          )}

          <label className="login-field" htmlFor="login-email">
            <span>Correo electronico</span>
            <div>
              <Mail size={18} strokeWidth={1.8} />
              <input
                id="login-email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="login-field" htmlFor="login-password">
            <span>Contrasena</span>
            <div>
              <Lock size={18} strokeWidth={1.8} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </label>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            {!loading && <ArrowRight size={18} strokeWidth={2} />}
          </button>

          <p className="login-toggle">
            {mode === 'login' ? 'No tienes cuenta?' : 'Ya tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setMode((current) => (current === 'login' ? 'register' : 'login'))
                setMessage(null)
              }}
            >
              {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
