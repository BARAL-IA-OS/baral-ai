import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Download, ImagePlus, Save, Sparkles, WandSparkles } from 'lucide-react'
import { generatePhotoshoot, parseApiError, saveGeneratedAsset } from '../lib/api'
import type { GeneratedAsset } from '../types'

export function Photoshoot() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'guided' | 'free'>('guided')
  const [product, setProduct] = useState('')
  const [scene, setScene] = useState('Estudio limpio')
  const [style, setStyle] = useState('Editorial')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [variants, setVariants] = useState(1)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [references, setReferences] = useState<string[]>([])
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function addReferences(files: FileList | null) {
    if (!files) return
    setReferences(Array.from(files).slice(0, 4).map((file) => URL.createObjectURL(file)))
  }

  async function generate() {
    if (!product.trim() || loading) return
    setLoading(true); setError(''); setMessage('')
    try {
      const response = await generatePhotoshoot({
        product, prompt, negative_prompt: negativePrompt, scene, style,
        aspect_ratio: aspectRatio, variants, reference_assets: references,
      })
      setAssets(response.assets)
      setMessage(`${response.assets.length} imagen(es) generadas · costo $${response.cost_usd.toFixed(4)}`)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  async function save(asset: GeneratedAsset) {
    try {
      await saveGeneratedAsset(asset.id, `Photoshoot · ${product}`)
      setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, status: 'SAVED' } : item))
      setMessage('Recurso guardado en la biblioteca privada.')
    } catch (reason) {
      setError(parseApiError(reason))
    }
  }

  function download(asset: GeneratedAsset) {
    const href = asset.url || (asset.image_b64 ? `data:image/png;base64,${asset.image_b64}` : '')
    if (!href) return
    const link = document.createElement('a')
    link.href = href
    link.download = `baral-photoshoot-${asset.id}.png`
    link.target = '_blank'
    link.click()
  }

  return (
    <section className="page omar-page photoshoot-page">
      <header className="omar-page-header">
        <span className="omar-eyebrow"><Camera size={14} /> Creación visual</span>
        <h1>Photoshoot</h1>
        <p>Fotografía de producto guiada por el ADN de tu marca, con control creativo y costos visibles.</p>
      </header>
      <div className="mode-tabs">
        <button type="button" className={mode === 'guided' ? 'is-selected' : ''} onClick={() => setMode('guided')}><Camera size={17} /> Sesión guiada</button>
        <button type="button" className={mode === 'free' ? 'is-selected' : ''} onClick={() => setMode('free')}><WandSparkles size={17} /> Generar o editar</button>
        <span>Video <small>Próximamente</small></span>
      </div>
      <div className="photoshoot-layout">
        <form className="photoshoot-form omar-panel" onSubmit={(event) => { event.preventDefault(); void generate() }}>
          <div className="field-grid">
            <label className="span-2"><span>Producto o servicio</span><input value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Ej. Café de especialidad en bolsa de 250 g" /></label>
            <label><span>Escena</span><select value={scene} onChange={(event) => setScene(event.target.value)}><option>Estudio limpio</option><option>Uso cotidiano</option><option>Naturaleza</option><option>Fondo de marca</option></select></label>
            <label><span>Estilo</span><select value={style} onChange={(event) => setStyle(event.target.value)}><option>Editorial</option><option>Minimalista</option><option>Premium</option><option>Enérgico</option></select></label>
            <label><span>Formato</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}><option>1:1</option><option>4:5</option><option>9:16</option><option>16:9</option></select></label>
            <label><span>Variantes</span><select value={variants} onChange={(event) => setVariants(Number(event.target.value))}><option value={1}>1 · menor costo</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
            <label className="span-2"><span>{mode === 'guided' ? 'Dirección creativa' : 'Prompt de generación o edición'}</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Luz, composición, ambiente y detalles importantes…" /></label>
            <label className="span-2"><span>Qué debe evitar la imagen</span><input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="Texto deformado, colores fuera de marca, objetos extra…" /></label>
          </div>
          <label className="reference-uploader">
            <ImagePlus size={20} /><span>Agregar referencias del producto</span><small>Hasta 4 imágenes</small>
            <input type="file" accept="image/*" multiple onChange={(event) => addReferences(event.target.files)} />
          </label>
          {references.length > 0 && <div className="reference-strip">{references.map((src) => <img key={src} src={src} alt="Referencia" />)}</div>}
          <button type="submit" className="button button-primary wide" disabled={!product.trim() || loading}><Sparkles size={16} />{loading ? 'Generando imágenes…' : 'Generar photoshoot'}</button>
          {error && <p className="omar-alert error">{error}</p>}{message && <p className="omar-alert success">{message}</p>}
        </form>
        <section className="photoshoot-results omar-panel">
          <div className="preview-title"><span>Resultados</span><small>{assets.length ? `${assets.length} variantes` : 'Aún sin generar'}</small></div>
          {assets.length === 0 ? (
            <div className="empty-creative"><Camera size={34} /><h2>Tu producto será el protagonista</h2><p>Configura la sesión. Baral aplicará la identidad confirmada de tu negocio.</p></div>
          ) : (
            <div className="generated-grid">{assets.map((asset) => {
              const src = asset.url || (asset.image_b64 ? `data:image/png;base64,${asset.image_b64}` : '')
              return <article key={asset.id} className="generated-card"><img src={src} alt={asset.prompt} /><div><button type="button" onClick={() => download(asset)}><Download size={15} /> Descargar</button><button type="button" onClick={() => void save(asset)} disabled={asset.status === 'SAVED'}><Save size={15} />{asset.status === 'SAVED' ? 'Guardado' : 'Guardar'}</button></div></article>
            })}</div>
          )}
          {assets.length > 0 && <button type="button" className="button button-secondary wide" onClick={() => navigate('/campaigns')}>Usar recursos en una campaña</button>}
        </section>
      </div>
    </section>
  )
}
