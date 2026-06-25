import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandBrainForm } from '../components/onboarding/BrandBrainForm'
import { CSVUpload } from '../components/onboarding/CSVUpload'
import { SetupProgress } from '../components/onboarding/SetupProgress'
import { Spinner } from '../components/ui/Spinner'
import { hasBrandBrain } from '../hooks/useBrandBrain'

export function Onboarding() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    hasBrandBrain()
      .then((exists) => {
        if (exists) {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch(() => undefined)
      .finally(() => setChecking(false))
  }, [navigate])

  if (checking) {
    return <Spinner />
  }

  return (
    <section className="page onboarding-page">
      <div className="onboarding-heading">
        <span className="onboarding-eyebrow">Configuración inicial</span>
        <h1>Prepara tu espacio en Baral AI</h1>
        <p>Cuéntanos sobre tu marca para generar campañas más precisas y alineadas con tu negocio.</p>
      </div>
      <SetupProgress />
      <div className="onboarding-layout">
        <BrandBrainForm />
        <aside className="onboarding-aside">
          <CSVUpload />
          <div className="onboarding-tip">
            <span>✦</span>
            <div>
              <strong>¿Por qué necesitamos estos datos?</strong>
              <p>La IA los utiliza como contexto para mantener el tono, la propuesta y los límites de tu marca.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
