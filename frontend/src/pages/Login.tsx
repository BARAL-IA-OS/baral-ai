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
  const [message, setMessage] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <h1>Baral AI</h1>
        <p>Ingresa para configurar tu empresa y lanzar campanas.</p>
        {!isSupabaseConfigured ? (
          <p className="warning">
            Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
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
          <Button type="submit">Entrar</Button>
          {message ? <p>{message}</p> : null}
        </form>
      </Card>
    </main>
  )
}
