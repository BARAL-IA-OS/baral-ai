import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          })

    if (error) {
      setMessage(error.message)
      return
    }

    if (mode === 'register') {
      setMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmacion.')
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <h1>Baral AI</h1>
        <p>
          {mode === 'login'
            ? 'Ingresa para configurar tu empresa y lanzar campanas.'
            : 'Crea tu cuenta para iniciar el onboarding de Baral AI.'}
        </p>
        {!isSupabaseConfigured ? (
          <p className="warning">
            Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
          </p>
        ) : null}
        <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <Button type="submit">
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode((current) =>
                current === 'login' ? 'register' : 'login',
              )
              setMessage(null)
            }}
          >
            {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
          </Button>
          {message ? <p>{message}</p> : null}
        </form>
      </Card>
    </main>
  )
}
