import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Users, Rocket, ArrowRight, Sparkles } from 'lucide-react'
import baralLogo from '../assets/login/logo baral AI.png'
import { markWelcomeSeen } from '../hooks/useWelcomeSeen'

const steps = [
  {
    Icon: Brain,
    title: 'Configura tu marca',
    description: 'Cuentanos sobre tu negocio: industria, tono, audiencia y lo que tu marca nunca diria.',
    color: '#7C3AED',
  },
  {
    Icon: Users,
    title: 'Importa tus clientes',
    description: 'Sube tu base de clientes en CSV. Baral la usará para personalizar cada campaña.',
    color: '#6366F1',
  },
  {
    Icon: Rocket,
    title: 'Ejecuta acciones',
    description: 'Elige una receta, la IA genera el contenido, tu apruebas y Baral lo envia.',
    color: '#8B5CF6',
  },
]

export function Welcome() {
  const navigate = useNavigate()
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  function handleStart() {
    markWelcomeSeen()
    navigate('/onboarding', { replace: true })
  }

  return (
    <section className="welcome-page">
      <div className="welcome-bg-glow" aria-hidden="true" />
      <div className="welcome-bg-glow-2" aria-hidden="true" />

      <div className="welcome-container">
        <div className="welcome-logo">
          <img src={baralLogo} alt="Baral AI" />
        </div>

        <div className="welcome-hero">
          <span className="welcome-badge">
            <Sparkles size={14} strokeWidth={2} />
            Plataforma de acciones de negocio
          </span>
          <h1 className="welcome-title">
            Bienvenido a <span className="welcome-title-brand">Baral AI</span>
          </h1>
          <p className="welcome-subtitle">
            Tu plataforma de acciones de negocio potenciada por inteligencia artificial.
            Configura, ejecuta y escala sin esfuerzo.
          </p>
        </div>

        <div className="welcome-steps">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`welcome-step ${hoveredStep === i ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(null)}
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              <div className="welcome-step-number">{i + 1}</div>
              <div
                className="welcome-step-icon"
                style={{ background: `${step.color}15`, color: step.color }}
              >
                <step.Icon size={24} strokeWidth={1.75} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>

        <button type="button" className="welcome-cta" onClick={handleStart}>
          Comenzar configuracion
          <ArrowRight size={18} strokeWidth={2} />
        </button>

        <p className="welcome-footnote">
          Solo tomará 2 minutos. Podrás editar todo después.
        </p>
      </div>
    </section>
  )
}
