import { useState } from 'react'
import { Check, Upload } from 'lucide-react'
import { Drawer } from '../../../components/ui/Drawer'
import { confirmClientImport, mapClientImport, previewClientImport } from '../api'
import type { ClientImportJob, ClientImportSummary } from '../types'
import { parseApiError } from '../../../lib/api'

const fields = [
  ['', 'No importar'], ['nombre', 'Nombre'], ['email', 'Email'], ['telefono', 'Teléfono'],
  ['company', 'Empresa'], ['producto', 'Producto'], ['interest', 'Interés'], ['source', 'Origen'],
  ['lifecycle_status', 'Estado'], ['ultima_compra', 'Última compra'],
  ['last_purchase_amount', 'Monto'], ['tags', 'Etiquetas'], ['notes', 'Notas'],
]

interface ClientImportDrawerProps { open: boolean; onClose: () => void; onSuccess: () => void }

export function ClientImportDrawer({ open, onClose, onSuccess }: ClientImportDrawerProps) {
  const [step, setStep] = useState(1)
  const [job, setJob] = useState<ClientImportJob | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<ClientImportSummary | null>(null)
  const [strategy, setStrategy] = useState<'skip' | 'update'>('skip')
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() { setStep(1); setJob(null); setMapping({}); setSummary(null); setResult(null); setError(null) }
  async function upload(file: File | undefined) {
    if (!file) return
    setWorking(true); setError(null)
    try { const response = await previewClientImport(file); setJob(response.import); setMapping(response.import.suggested_mapping); setStep(2) } catch (reason) { setError(parseApiError(reason)) } finally { setWorking(false) }
  }
  async function review() {
    if (!job) return
    setWorking(true); setError(null)
    try { const response = await mapClientImport(job.id, mapping); setJob(response.import); setSummary(response.summary); setStep(3) } catch (reason) { setError(parseApiError(reason)) } finally { setWorking(false) }
  }
  async function confirm() {
    if (!job) return
    setWorking(true); setError(null)
    try { const response = await confirmClientImport(job.id, strategy); setResult(response); onSuccess() } catch (reason) { setError(parseApiError(reason)) } finally { setWorking(false) }
  }

  function downloadErrors(errors: string[]) {
    const blob = new Blob([errors.join('\n')], { type: 'text/plain;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = 'errores-importacion-clientes.txt'
    anchor.click()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <Drawer open={open} title="Importar clientes" onClose={() => { reset(); onClose() }}>
      <div className="import-steps"><span className={step >= 1 ? 'is-active' : ''}>1. Cargar</span><span className={step >= 2 ? 'is-active' : ''}>2. Mapear</span><span className={step >= 3 ? 'is-active' : ''}>3. Revisar</span></div>
      {step === 1 && <label className="client-import-drop"><Upload size={24} /><strong>{working ? 'Leyendo archivo…' : 'Selecciona un archivo CSV'}</strong><span>Máximo 5.000 filas y 10 MB</span><input type="file" accept=".csv,text/csv" disabled={working} onChange={(event) => void upload(event.target.files?.[0])} /></label>}
      {step === 2 && job && <div className="mapping-list"><p>Indica qué significa cada columna de <strong>{job.filename}</strong>.</p>{job.headers.map((header) => <label key={header}><span>{header}</span><select value={mapping[header] || ''} onChange={(event) => setMapping((value) => ({ ...value, [header]: event.target.value }))}>{fields.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}<button type="button" className="button button-primary" disabled={working || !Object.values(mapping).includes('nombre')} onClick={() => void review()}>{working ?'Validando…':'Revisar importación'}</button></div>}
      {step === 3 && summary && !result && <div className="import-review"><div className="import-summary-grid"><div><strong>{summary.valid}</strong><span>Filas válidas</span></div><div><strong>{summary.duplicates}</strong><span>Duplicados</span></div><div><strong>{summary.errors.length}</strong><span>Errores</span></div></div>{summary.duplicates > 0 && <div className="form-field"><label htmlFor="duplicate-strategy">Qué hacer con duplicados</label><select id="duplicate-strategy" value={strategy} onChange={(event) => setStrategy(event.target.value as 'skip' | 'update')}><option value="skip">Omitir existentes</option><option value="update">Actualizar existentes</option></select></div>}<div className="import-preview-table"><table><thead><tr><th>Nombre</th><th>Email</th><th>Estado</th></tr></thead><tbody>{job?.preview_rows.slice(0, 8).map((row, index) => <tr key={index}><td>{String(row.nombre || '—')}</td><td>{String(row.email || '—')}</td><td>{row._duplicate_id ? 'Duplicado' : 'Nuevo'}</td></tr>)}</tbody></table></div><button type="button" className="button button-primary" disabled={working} onClick={() => void confirm()}>{working ? 'Importando…' : 'Confirmar importación'}</button></div>}
      {result && <div className="import-result"><span><Check size={28} /></span><h3>Importación finalizada</h3><p>{result.created} creados · {result.updated} actualizados · {result.skipped} omitidos</p>{result.errors.length > 0 && <details><summary>{result.errors.length} errores</summary><pre>{result.errors.join('\n')}</pre><button type="button" className="button button-secondary" onClick={() => downloadErrors(result.errors)}>Descargar errores</button></details>}<button type="button" className="button button-primary" onClick={() => { reset(); onClose() }}>Terminar</button></div>}
      {error && <p className="form-message form-message-error">{error}</p>}
    </Drawer>
  )
}
