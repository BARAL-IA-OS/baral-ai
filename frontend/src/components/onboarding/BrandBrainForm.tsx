import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, MessageSquare, Target, Shield, Sparkles, Users, Globe } from 'lucide-react'
import { Button } from '../ui/Button'
import { InfoUploadModal } from '../dashboard/InfoUploadModal'
import { BrandExtractModal } from './BrandExtractModal'
import { saveBrandBrain } from '../../hooks/useBrandBrain'
import type { BrandBrainInput } from '../../hooks/useBrandBrain'
import type { BrandBrain, BrandExtractFields } from '../../types'
import { supabase } from '../../lib/supabase'
import { AppIcon } from '../ui/AppIcon'

const initialForm: BrandBrainInput = {
  industria: '',
  propuesta: '',
  tono: '',
  audiencia: '',
  diferenciador: '',
  prohibiciones: '',
  website_url: '',
}

const fields: Array<{
  name: keyof BrandBrainInput
  label: string
  helper: string
  modalSubtitle: string
  Icon: React.ElementType
}> = [
  {
    name: 'industria',
    label: 'Industria y actividad',
    helper: '¿En qué sector opera tu empresa?',
    modalSubtitle: 'Fuentes para industria y actividad',
    Icon: Briefcase,
  },
  {
    name: 'propuesta',
    label: 'Propuesta de valor',
    helper: 'Resume el principal beneficio que entregas.',
    modalSubtitle: 'Fuentes para propuesta de valor',
    Icon: Sparkles,
  },
  {
    name: 'tono',
    label: 'Tono de comunicación',
    helper: 'Describe cómo debe sonar tu marca.',
    modalSubtitle: 'Fuentes para tono de marca',
    Icon: MessageSquare,
  },
  {
    name: 'audiencia',
    label: 'Audiencia principal',
    helper: '¿A quién quieres atraer y convertir?',
    modalSubtitle: 'Fuentes para audiencia principal',
    Icon: Users,
  },
  {
    name: 'diferenciador',
    label: 'Diferenciador',
    helper: '¿Qué te hace distinto frente a otras alternativas?',
    modalSubtitle: 'Fuentes para diferenciador',
    Icon: Target,
  },
  {
    name: 'prohibiciones',
    label: 'Límites y prohibiciones',
    helper: 'Indica palabras, promesas o temas que debemos evitar.',
    modalSubtitle: 'Fuentes para límites de marca',
    Icon: Shield,
  },
]

interface BrandBrainFormProps {
  initialBrandBrain?: BrandBrain | null
}

export function BrandBrainForm({ initialBrandBrain }: BrandBrainFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<BrandBrainInput>(() => (
    initialBrandBrain
      ? {
          industria: initialBrandBrain.industria ?? '',
          propuesta: initialBrandBrain.propuesta ?? '',
          tono: initialBrandBrain.tono ?? '',
          audiencia: initialBrandBrain.audiencia ?? '',
          diferenciador: initialBrandBrain.diferenciador ?? '',
          prohibiciones: initialBrandBrain.prohibiciones ?? '',
          website_url: initialBrandBrain.website_url ?? '',
        }
      : initialForm
  ))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [activeInfoField, setActiveInfoField] = useState<(typeof fields)[number] | null>(null)
  const [showExtract, setShowExtract] = useState(false)

  function updateField(name: keyof BrandBrainInput, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleApplyExtract(result: { nombre_empresa: string; fields: BrandExtractFields; url?: string }) {
    const { nombre_empresa, fields: extracted, url } = result
    setForm((current) => ({
      ...current,
      industria: extracted.industria || current.industria,
      propuesta: extracted.propuesta || current.propuesta,
      tono: extracted.tono || current.tono,
      audiencia: extracted.audiencia || current.audiencia,
      diferenciador: extracted.diferenciador || current.diferenciador,
      website_url: url || current.website_url,
    }))
    // El nombre de empresa vive en user_metadata (misma fuente que el Perfil / saludo del dashboard).
    if (nombre_empresa) {
      void supabase.auth.updateUser({ data: { company_name: nombre_empresa } })
    }
    setMessage('Campos autocompletados. Revisa y ajusta antes de guardar.')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requiredFields: Array<keyof BrandBrainInput> = [
      'industria',
      'propuesta',
      'tono',
      'audiencia',
      'diferenciador',
      'prohibiciones',
    ]
    if (requiredFields.some((field) => (form[field] ?? '').trim().length === 0)) {
      setMessage('Error: completa cada bloque agregando contexto desde su modal.')
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await saveBrandBrain(form)
      if (error) {
        setMessage(`Error: ${error.message}`)
        return
      }

      setMessage('Brand Brain guardado correctamente.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'No se pudo guardar la información.'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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

        <button
          type="button"
          className="brand-extract-card"
          onClick={() => setShowExtract(true)}
        >
          <span className="brand-extract-card-icon">
            <Globe size={20} strokeWidth={1.75} />
          </span>
          <span className="brand-extract-card-copy">
            <strong>Autocompletar con tu página web</strong>
            <small>Pega tu URL o sube un documento y la IA rellena tu Brand Brain. Tú revisas.</small>
          </span>
          <span className="brand-extract-card-cta">
            <Sparkles size={16} />
            Autocompletar
          </span>
        </button>

        <div className="brand-fields">
          {fields.map((field) => (
            <article className={`brand-field ${form[field.name] ? 'brand-field-complete' : ''}`} key={field.name}>
              <button
                type="button"
                className="brand-field-source-btn"
                onClick={() => setActiveInfoField(field)}
              >
                <span className="brand-field-source-icon">
                  <field.Icon size={18} strokeWidth={1.75} />
                </span>
                <span>
                  <strong>{field.label}</strong>
                  <small>{form[field.name] ? 'Contexto agregado' : 'Agregar contexto'}</small>
                </span>
              </button>
              <p className="brand-field-summary">
                {form[field.name] ? (form[field.name] ?? '').slice(0, 130) : 'Pendiente'}
              </p>
            </article>
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

      {activeInfoField && (
        <InfoUploadModal
          title={activeInfoField.label}
          subtitle={activeInfoField.modalSubtitle}
          initialText={form[activeInfoField.name]}
          onSaveText={(value) => updateField(activeInfoField.name, value)}
          onClose={() => setActiveInfoField(null)}
        />
      )}

      {showExtract && (
        <BrandExtractModal
          onApply={handleApplyExtract}
          onClose={() => setShowExtract(false)}
        />
      )}
    </>
  )
}
