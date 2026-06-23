import { AppIcon } from '../ui/AppIcon'

export function SetupProgress() {
  const steps = [
    { label: 'Cuenta creada', description: 'Acceso confirmado', icon: 'check', state: 'complete' },
    { label: 'Brand Brain', description: 'Define tu identidad', icon: 'brain', state: 'active' },
    { label: 'Base de clientes', description: 'Importa tu archivo CSV', icon: 'upload', state: 'pending' },
  ] as const

  return (
    <ol className="setup-progress">
      {steps.map((step, index) => (
        <li className={`setup-step setup-step-${step.state}`} key={step.label}>
          <span className="setup-step-icon">
            <AppIcon name={step.icon} size={21} />
          </span>
          <span className="setup-step-copy">
            <small>Paso {index + 1}</small>
            <strong>{step.label}</strong>
            <span>{step.description}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
