import { useState } from 'react'
import { AppIcon } from '../ui/AppIcon'

export function CSVUpload() {
  const [fileName, setFileName] = useState('')

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
      <label className={`upload-box ${fileName ? 'upload-box-ready' : ''}`}>
        <span className="upload-icon">
          <AppIcon name={fileName ? 'check' : 'upload'} size={27} />
        </span>
        <strong>{fileName || 'Selecciona o arrastra tu archivo'}</strong>
        <span>{fileName ? 'Archivo listo para procesar' : 'Formato CSV · máximo recomendado 10 MB'}</span>
        <span className="upload-action">{fileName ? 'Cambiar archivo' : 'Elegir archivo'}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
        />
      </label>
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
