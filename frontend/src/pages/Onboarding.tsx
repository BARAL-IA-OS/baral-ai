import { BrandBrainForm } from '../components/onboarding/BrandBrainForm'
import { CSVUpload } from '../components/onboarding/CSVUpload'
import { SetupProgress } from '../components/onboarding/SetupProgress'

export function Onboarding() {
  return (
    <section className="page stack">
      <div>
        <h1>Onboarding</h1>
        <p>Completa el Brand Brain y prepara la base de clientes.</p>
      </div>
      <SetupProgress />
      <BrandBrainForm />
      <CSVUpload />
    </section>
  )
}
