import { useState } from 'react'
import { Button } from '../ui/Button'
import { saveBrandBrain } from '../../hooks/useBrandBrain'
import type { BrandBrainInput } from '../../hooks/useBrandBrain'
import { AppIcon } from '../ui/AppIcon'

const initialForm: BrandBrainInput = {
  industria: '',
  propuesta: '',
  tono: '',
  audiencia: '',
  diferenciador: '',
  prohibiciones: '',
}

const fields: Array<{
  name: keyof BrandBrainInput
  label: string
  helper: string
  placeholder: string
}> = [
  {
    name: 'industria',
    label: 'Industria y actividad',
    helper: '¿En qué sector opera tu empresa?',
    placeholder: 'Ej. Agencia de marketing para empresas de tecnología.',
  },
  {
    name: 'propuesta',
    label: 'Propuesta de valor',
    helper: 'Resume el principal beneficio que entregas.',
    placeholder: 'Ej. Ayudamos a empresas B2B a conseguir clientes de forma predecible.',
  },
  {
    name: 'tono',
    label: 'Tono de comunicación',
    helper: 'Describe cómo debe sonar tu marca.',
    placeholder: 'Ej. Cercano, experto, claro y optimista; sin exageraciones.',
  },
  {
    name: 'audiencia',
    label: 'Audiencia principal',
    helper: '¿A quién quieres atraer y convertir?',
    placeholder: 'Ej. Fundadores y líderes comerciales de empresas B2B.',
  },
  {
    name: 'diferenciador',
    label: 'Diferenciador',
    helper: '¿Qué te hace distinto frente a otras alternativas?',
    placeholder: 'Ej. Combinamos estrategia, creatividad y automatización en un solo equipo.',
  },
  {
    name: 'prohibiciones',
    label: 'Límites y prohibiciones',
    helper: 'Indica palabras, promesas o temas que debemos evitar.',
    placeholder: 'Ej. No prometer resultados garantizados ni utilizar lenguaje agresivo.',
  },
]

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

    try {
      const { error } = await saveBrandBrain(form)
      if (error) {
        setMessage(`Error: ${error.message}`)
        return
      }
      setMessage('Brand Brain guardado correctamente.')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'No se pudo guardar la información.'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="brand-brain-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="onboarding-card-heading">
        <span className="onboarding-card-icon">
          <AppIcon name="brain" size={25} />
        </span>
        <div>
          <span>Paso principal</span>
          <h2>Construye el Brand Brain</h2>
          <p>Esta información será la memoria estratégica de tu marca.</p>
        </div>
      </div>
      <div className="brand-fields">
        {fields.map((field) => (
          <label className="brand-field" key={field.name}>
            <span className="brand-field-heading">
              <strong>{field.label}</strong>
              <small>{field.helper}</small>
            </span>
          <textarea
            required
              rows={3}
              placeholder={field.placeholder}
              value={form[field.name]}
            onChange={(event) =>
                updateField(field.name, event.target.value)
            }
          />
        </label>
        ))}
      </div>
      <div className="brand-form-footer">
        {message ? (
          <p className={`form-message ${message.startsWith('Error:') ? 'form-message-error' : 'form-message-success'}`}>
            {message}
          </p>
        ) : (
          <p className="brand-form-note">Podrás editar esta información más adelante.</p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Brand Brain'}
          {!saving && <AppIcon name="arrow" size={18} />}
        </Button>
      </div>
    </form>
  )
}
