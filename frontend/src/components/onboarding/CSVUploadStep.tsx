import { useCallback, useState } from 'react'
import { AppIcon } from '../ui/AppIcon'
import type { CSVData, CSVRow } from '../../pages/Onboarding'

interface CSVUploadStepProps {
  csvData: CSVData | null
  onCsvData: (data: CSVData | null) => void
  onBack: () => void
  onFinish: () => void
}

/* ── CSV parser ─────────────────────────────────────────────────── */

function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i]
      .split(',')
      .map((v) => v.trim().replace(/^["']|["']$/g, ''))
    const row: CSVRow = {}
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

/* ── Template CSV generator ─────────────────────────────────────── */

function downloadTemplate() {
  const csv = '\uFEFFnombre,email,ultima_compra,producto,telefono\nMaria Lopez,maria@ejemplo.com,15/03/2026,Plan Premium,+52 55 1234 5678\nCarlos Ruiz,carlos@ejemplo.com,02/01/2026,Plan Basico,\nAna Martinez,ana@ejemplo.com,20/04/2026,Plan Premium,+52 55 9876 5432\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_clientes_baral.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Component ──────────────────────────────────────────────────── */

export function CSVUploadStep({
  csvData,
  onCsvData,
  onBack,
  onFinish,
}: CSVUploadStepProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      setError(null)

      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('El archivo debe ser un CSV.')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo excede el límite recomendado de 10 MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const { headers, rows } = parseCSV(text)

          if (headers.length === 0) {
            setError('El CSV está vacío o no tiene encabezados.')
            return
          }

          onCsvData({ headers, rows, fileName: file.name })
        } catch {
          setError('No se pudo leer el archivo CSV.')
        }
      }
      reader.onerror = () => setError('Error leyendo el archivo.')
      reader.readAsText(file, 'UTF-8')
    },
    [onCsvData],
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setDragOver(false)
      const file = event.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const expectedCols = ['nombre', 'email', 'ultima_compra', 'producto', 'telefono']

  return (
    <div className="ob-step-card">
      {/* Step heading */}
      <div className="ob-step-heading">
        <span className="ob-step-icon ob-step-icon-csv">
          <AppIcon name="upload" size={25} />
        </span>
        <div>
          <span className="ob-step-eyebrow">Paso 2</span>
          <h2>Sube tu base de clientes</h2>
          <p>Importa tu archivo CSV para segmentar tus primeras campañas.</p>
        </div>
      </div>

      {/* Upload zone */}
      <label
        className={`ob-upload-zone ${csvData ? 'ob-upload-ready' : ''} ${dragOver ? 'ob-upload-dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="ob-upload-icon">
          <AppIcon name={csvData ? 'check' : 'file'} size={30} />
        </span>

        {csvData ? (
          <>
            <strong>{csvData.fileName}</strong>
            <span className="ob-upload-sub">Archivo cargado · clic para cambiar</span>
          </>
        ) : (
          <>
            <strong>Arrastra tu CSV aquí o haz clic</strong>
            <span className="ob-upload-sub">Formato CSV · máximo 10 MB</span>
          </>
        )}

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </label>

      {/* Error */}
      {error && <p className="ob-message ob-message-error">⚠ {error}</p>}

      {/* Expected columns + template download */}
      <div className="ob-expected-cols">
        <div className="ob-expected-header">
          <strong>Columnas esperadas:</strong>
          <button
            type="button"
            className="ob-download-link"
            onClick={downloadTemplate}
          >
            <AppIcon name="file" size={15} />
            Descargar plantilla CSV
          </button>
        </div>
        <div className="ob-col-tags">
          {expectedCols.map((col) => {
            const isOptional = col === 'telefono'
            const isMatched =
              csvData?.headers.some(
                (h) => h.toLowerCase() === col.toLowerCase(),
              ) ?? false

            return (
              <span
                key={col}
                className={`ob-col-tag ${isMatched ? 'ob-col-matched' : ''}`}
              >
                {col}
                {isOptional && <small>(opcional)</small>}
              </span>
            )
          })}
        </div>
      </div>

      {/* Table preview */}
      {csvData && csvData.rows.length > 0 && (
        <div className="ob-table-wrap">
          <table className="ob-preview-table">
            <thead>
              <tr>
                {csvData.headers.slice(0, 6).map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {csvData.headers.length > 6 && <th>…</th>}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {csvData.headers.slice(0, 6).map((h) => (
                    <td key={h}>{row[h]}</td>
                  ))}
                  {csvData.headers.length > 6 && <td>…</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {csvData.rows.length > 5 && (
            <p className="ob-table-more">
              …y {csvData.rows.length - 5} filas más
            </p>
          )}
          <p className="ob-clients-count">
            <strong>{csvData.rows.length} clientes encontrados</strong>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="ob-step-footer">
        <div className="ob-step-actions ob-step-actions-split">
          <button
            type="button"
            className="ob-btn ob-btn-ghost"
            onClick={onBack}
          >
            <AppIcon name="arrow" size={18} />
            Anterior
          </button>
          <button
            type="button"
            className="ob-btn ob-btn-primary"
            onClick={onFinish}
          >
            {csvData ? 'Confirmar e ir al App' : 'Saltar e ir al App'}
            <AppIcon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
