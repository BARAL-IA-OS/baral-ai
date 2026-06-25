import { AppIcon } from '../ui/AppIcon'

interface OnboardingStepperProps {
  currentStep: 1 | 2
}

const steps = [
  { number: 1, label: 'Tu empresa', icon: 'brain' as const },
  { number: 2, label: 'Clientes', icon: 'users' as const },
]

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <div className="ob-stepper">
      {/* Progress bar background */}
      <div className="ob-stepper-track">
        <div
          className="ob-stepper-fill"
          style={{ width: currentStep === 1 ? '0%' : '100%' }}
        />
      </div>

      {/* Step dots */}
      <ol className="ob-stepper-dots">
        {steps.map((s) => {
          const state =
            s.number < currentStep
              ? 'complete'
              : s.number === currentStep
                ? 'active'
                : 'pending'

          return (
            <li key={s.number} className={`ob-dot ob-dot-${state}`}>
              <span className="ob-dot-circle">
                {state === 'complete' ? (
                  <AppIcon name="check" size={16} />
                ) : (
                  <span className="ob-dot-number">{s.number}</span>
                )}
              </span>
              <span className="ob-dot-label">
                Paso {s.number}: {s.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
