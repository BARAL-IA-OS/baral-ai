import type { BrandBrainInput } from '../../hooks/useBrandBrain'
import { AppIcon } from '../ui/AppIcon'

interface BrandBrainFormProps {
  form: BrandBrainInput
  onChange: (form: BrandBrainInput) => void
  message: string | null
  saving: boolean
  onNext: () => void
}

const fields: Array<{
  name: keyof BrandBrainInput
  label: string
  helper: string
  placeholder: string
}> = [
  {
    name: 'industria',
    label: 'Industria *',
    helper: '¿En qué sector opera tu empresa?',
    placeholder: 'Ej. Agencia de marketing para empresas de tecnología.',
  },
  {
    name: 'propuesta',
    label: 'Propuesta de valor *',
    helper: 'Resume el principal beneficio que entregas.',
    placeholder: 'Ej. Ayudamos a empresas B2B a conseguir clientes de forma predecible.',
  },
  {
    name: 'tono',
    label: 'Tono de voz *',
    helper: 'Describe cómo debe sonar tu marca.',
    placeholder: 'Ej. Cercano, experto, claro y optimista; sin exageraciones.',
  },
  {
    name: 'audiencia',
    label: 'Público objetivo *',
    helper: '¿A quién quieres atraer y convertir?',
    placeholder: 'Ej. Fundadores y líderes comerciales de empresas B2B.',
  },
  {
    name: 'diferenciador',
    label: 'Diferenciador *',
    helper: '¿Qué te hace distinto frente a otras alternativas?',
    placeholder: 'Ej. Combinamos estrategia, creatividad y automatización en un solo equipo.',
  },
  {
    name: 'prohibiciones',
    label: 'Prohibiciones *',
    helper: 'Palabras que NUNCA debe decir la IA (ej: gratis, oferta).',
    placeholder: 'Ej. No prometer resultados garantizados ni utilizar lenguaje agresivo.',
  },
]

export function BrandBrainForm({
  form,
  onChange,
  message,
  saving,
  onNext,
}: BrandBrainFormProps) {
  function updateField(name: keyof BrandBrainInput, value: string) {
    onChange({ ...form, [name]: value })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onNext()
  }

  return (
    <form
      className="ob-step-card"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      {/* Step heading */}
      <div className="ob-step-heading">
        <span className="ob-step-icon">
          <AppIcon name="brain" size={25} />
        </span>
        <div>
          <span className="ob-step-eyebrow">Paso 1</span>
          <h2>Perfil de Empresa</h2>
          <p>Esta información será la memoria estratégica de tu marca.</p>
        </div>
      </div>

      {/* Fields grid */}
      <div className="ob-fields-grid">
        {fields.map((field) => (
          <label className="ob-field" key={field.name}>
            <span className="ob-field-heading">
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

      {/* Prohibiciones info box */}
      <div className="ob-info-box">
        <span>ℹ️</span>
        <p>
          En el campo <strong>Prohibiciones</strong>, indica palabras que NUNCA debe
          decir la IA (ej: <em>gratis, oferta, garantizado</em>). Esto protege la
          coherencia de tu marca.
        </p>
      </div>

      {/* Footer */}
      <div className="ob-step-footer">
        {message && (
          <p
            className={`ob-message ${message.startsWith('Error') ? 'ob-message-error' : 'ob-message-warning'}`}
          >
            {message}
          </p>
        )}
        <div className="ob-step-actions">
          <p className="ob-footer-note">Podrás editar esta información más adelante.</p>
          <button
            type="submit"
            className="ob-btn ob-btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Siguiente'}
            {!saving && <AppIcon name="arrow" size={18} />}
          </button>
        </div>
      </div>
    </form>
  )
}
