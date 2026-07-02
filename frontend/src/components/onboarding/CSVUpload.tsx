import { useCallback, useState } from 'react'
import { AppIcon } from '../ui/AppIcon'
import { importClients } from '../../lib/api'

interface CSVRow {
  [key: string]: string
}

interface ParseResult {
  headers: string[]
  rows: CSVRow[]
  total: number
}

function parseCSV(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { headers: [], rows: [], total: 0 }
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    rows.push(row)
  }

  return { headers, rows, total: rows.length }
}

export function CSVUpload() {
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    setError(null)
    setParseResult(null)
    setImportSuccess(null)
    setFileName(file.name)
    setRawFile(file)

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('El archivo debe ser un CSV.')
      setFileName('')
      setRawFile(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo excede el límite recomendado de 10 MB.')
      setFileName('')
      setRawFile(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const result = parseCSV(text)

        if (result.headers.length === 0) {
          setError('El CSV está vacío o no tiene encabezados.')
          setFileName('')
          setRawFile(null)
          return
        }

        setParseResult(result)
      } catch {
        setError('No se pudo leer el archivo CSV.')
        setFileName('')
        setRawFile(null)
      }
    }
    reader.onerror = () => {
      setError('Error leyendo el archivo.')
      setFileName('')
      setRawFile(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

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

  async function handleImport() {
    if (!rawFile) return
    setImporting(true)
    setError(null)
    try {
      const res = await importClients(rawFile)
      if (res.success) {
        setImportSuccess(
          `${res.imported} clientes importados correctamente` +
          (res.skipped > 0 ? ` · ${res.skipped} filas omitidas` : ''),
        )
      } else {
        setError(res.errors?.join(', ') ?? 'Error al importar los clientes.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor.')
    } finally {
      setImporting(false)
    }
  }

  const recommendedCols = ['nombre', 'email', 'teléfono', 'última compra']
  const matchedCols = parseResult
    ? recommendedCols.filter((col) =>
        parseResult.headers.some((h) => h.toLowerCase() === col.toLowerCase()),
      )
    : []

  return (
    <section className="csv-card">
      <div className="csv-card-heading">
        <span className="csv-heading-icon">
          <AppIcon name="file" size={23} />
        </span>
        <div>
          <span>Paso opcional</span>
          <h2>Base de clientes</h2>
        </div>
      </div>
      <p>Sube un archivo CSV para preparar tus primeras campañas segmentadas.</p>

      <label
        className={`upload-box ${fileName ? 'upload-box-ready' : ''} ${dragOver ? 'upload-box-dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="upload-icon">
          <AppIcon name={fileName ? 'check' : 'upload'} size={27} />
        </span>
        <strong>{fileName || 'Selecciona o arrastra tu archivo'}</strong>
        <span>{fileName ? 'Archivo listo para procesar' : 'Formato CSV · máximo recomendado 10 MB'}</span>
        <span className="upload-action">{fileName ? 'Cambiar archivo' : 'Elegir archivo'}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </label>

      {/* Error message */}
      {error && (
        <p className="csv-error">⚠ {error}</p>
      )}

      {/* Parse summary + import action */}
      {parseResult && (
        <div className="csv-summary">
          <div className="csv-summary-header">
            <strong>✓ {parseResult.total} filas detectadas</strong>
            <span>{parseResult.headers.length} columnas</span>
          </div>
          <div className="csv-columns">
            {parseResult.headers.slice(0, 8).map((header) => (
              <span
                key={header}
                className={`csv-col-tag ${matchedCols.includes(header.toLowerCase()) ? 'csv-col-matched' : ''}`}
              >
                {header}
              </span>
            ))}
            {parseResult.headers.length > 8 && (
              <span className="csv-col-tag">+{parseResult.headers.length - 8} más</span>
            )}
          </div>
          {matchedCols.length > 0 && (
            <p className="csv-match-note">
              ✓ {matchedCols.length} de {recommendedCols.length} columnas recomendadas encontradas
            </p>
          )}

          {/* Import result or action button */}
          {importSuccess ? (
            <p className="csv-match-note" style={{ marginTop: '0.75rem' }}>
              ✓ {importSuccess}
            </p>
          ) : (
            <button
              type="button"
              className="button button-primary"
              disabled={importing}
              onClick={() => void handleImport()}
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              {importing ? 'Importando...' : `Importar ${parseResult.total} clientes`}
            </button>
          )}
        </div>
      )}

      <div className="csv-requirements">
        <strong>Columnas recomendadas</strong>
        <span>nombre</span>
        <span>email</span>
        <span>teléfono</span>
        <span>última compra</span>
      </div>
    </section>
  )
}

