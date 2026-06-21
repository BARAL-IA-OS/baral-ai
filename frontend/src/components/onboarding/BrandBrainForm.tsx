import { useState } from 'react'
import { Button } from '../ui/Button'
import { saveBrandBrain } from '../../hooks/useBrandBrain'
import type { BrandBrainInput } from '../../hooks/useBrandBrain'

const initialForm: BrandBrainInput = {
  industria: '',
  propuesta: '',
  tono: '',
  audiencia: '',
  diferenciador: '',
  prohibiciones: '',
}

export function BrandBrainForm() {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function updateField(name: keyof BrandBrainInput, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await saveBrandBrain(form)
    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Brand Brain guardado')
  }

  return (
    <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
      {Object.keys(form).map((field) => (
        <label key={field}>
          <span>{field.replace('_', ' ')}</span>
          <textarea
            required
            value={form[field as keyof BrandBrainInput]}
            onChange={(event) =>
              updateField(field as keyof BrandBrainInput, event.target.value)
            }
          />
        </label>
      ))}
      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Brand Brain'}
      </Button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  )
}
