import { useState } from 'react'
import { Camera, Save, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const LOGO_STORAGE_KEY = 'baral-company-logo'

export function Profile() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(
    () => (user?.user_metadata?.display_name as string) || user?.email?.split('@')[0] || '',
  )
  const [companyName, setCompanyName] = useState(
    () => (user?.user_metadata?.company_name as string) || '',
  )
  const [logoPreview, setLogoPreview] = useState<string | null>(() => localStorage.getItem(LOGO_STORAGE_KEY))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handleLogoChange(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result)
      setLogoPreview(value)
      localStorage.setItem(LOGO_STORAGE_KEY, value)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        company_name: companyName,
      },
    })

    setSaving(false)
    setMessage(error ? `Error: ${error.message}` : 'Perfil actualizado correctamente.')
  }

  return (
    <section className="page profile-page">
      <div className="profile-hero">
        <span className="dashboard-eyebrow">Configuración</span>
        <h1>Perfil y marca</h1>
        <p>Actualiza los datos visibles de tu cuenta y el logo que usaremos en la experiencia.</p>
      </div>

      <form className="profile-card" onSubmit={(event) => void handleSave(event)}>
        <div className="profile-logo-editor">
          <div className="profile-logo-preview">
            {logoPreview ? <img src={logoPreview} alt="Logo de la empresa" /> : <UserRound size={34} />}
          </div>
          <label className="button button-secondary">
            <Camera size={16} />
            Cambiar logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => handleLogoChange(event.target.files?.[0])}
            />
          </label>
        </div>

        <label className="profile-field">
          <span>Nombre de usuario</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>

        <label className="profile-field">
          <span>Nombre de empresa</span>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Ej. Baral AI" />
        </label>

        {message && (
          <p className={`form-message ${message.startsWith('Error:') ? 'form-message-error' : 'form-message-success'}`}>
            {message}
          </p>
        )}

        <button type="submit" className="button button-primary" disabled={saving}>
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}
