import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveBrandBrain } from '../hooks/useBrandBrain'
import type { BrandBrainInput } from '../hooks/useBrandBrain'
import { BrandBrainForm } from '../components/onboarding/BrandBrainForm'
import { CSVUploadStep } from '../components/onboarding/CSVUploadStep'
import { OnboardingStepper } from '../components/onboarding/OnboardingStepper'
import baralLogo from '../assets/login/logo baral AI.png'

/* ── Types shared across steps ──────────────────────────────────── */

export interface CSVRow {
  [key: string]: string
}

export interface CSVData {
  headers: string[]
  rows: CSVRow[]
  fileName: string
}

/* ── Main Onboarding Page ───────────────────────────────────────── */

export function Onboarding() {
  const navigate = useNavigate()

  /* step state */
  const [step, setStep] = useState<1 | 2>(1)

  /* step 1 – Brand Brain */
  const [brandForm, setBrandForm] = useState<BrandBrainInput>({
    industria: '',
    propuesta: '',
    tono: '',
    audiencia: '',
    diferenciador: '',
    prohibiciones: '',
  })
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandMessage, setBrandMessage] = useState<string | null>(null)

  /* step 2 – CSV */
  const [csvData, setCsvData] = useState<CSVData | null>(null)

  /* ── Step 1 → validate & save, then advance ──────────────────── */

  const handleNext = useCallback(async () => {
    const missing = Object.entries(brandForm).some(
      ([, value]) => value.trim() === '',
    )
    if (missing) {
      setBrandMessage('Todos los campos son obligatorios.')
      return
    }

    setBrandSaving(true)
    setBrandMessage(null)

    try {
      const { error } = await saveBrandBrain(brandForm)
      if (error) {
        setBrandMessage(`Error: ${error.message}`)
        return
      }
      setStep(2)
    } catch (err) {
      setBrandMessage(
        `Error: ${err instanceof Error ? err.message : 'No se pudo guardar.'}`,
      )
    } finally {
      setBrandSaving(false)
    }
  }, [brandForm])

  /* ── Step 2 → confirm & go to dashboard ──────────────────────── */

  const handleFinish = useCallback(() => {
    // TODO: POST /api/clients/upload when endpoint is ready
    void navigate('/dashboard', { replace: true })
  }, [navigate])

  return (
    <main className="ob-page">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="ob-header">
        <img
          src={baralLogo}
          alt="Baral AI"
          className="ob-logo"
        />
        <h1 className="ob-title">Cuéntanos sobre tu empresa</h1>
        <p className="ob-subtitle">
          Configura tu espacio para que la IA genere campañas alineadas con tu marca.
        </p>
      </header>

      {/* ── Stepper ───────────────────────────────────────────────── */}
      <OnboardingStepper currentStep={step} />

      {/* ── Step content ──────────────────────────────────────────── */}
      <section className="ob-body">
        {step === 1 ? (
          <BrandBrainForm
            form={brandForm}
            onChange={setBrandForm}
            message={brandMessage}
            saving={brandSaving}
            onNext={() => void handleNext()}
          />
        ) : (
          <CSVUploadStep
            csvData={csvData}
            onCsvData={setCsvData}
            onBack={() => setStep(1)}
            onFinish={handleFinish}
          />
        )}
      </section>
    </main>
  )
}
