interface SpinnerProps {
  label?: string
}

export function Spinner({ label = 'Cargando…' }: SpinnerProps) {
  return (
    <div className="spinner-container">
      <span className="spinner" aria-label="Cargando" />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  )
}
