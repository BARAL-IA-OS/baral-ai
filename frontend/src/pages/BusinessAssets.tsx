import { useEffect, useMemo, useState } from 'react'
import { Archive, CircleAlert, ExternalLink, FolderOpen, Link2, Maximize2, Trash2, Upload } from 'lucide-react'
import { Drawer } from '../components/ui/Drawer'
import { InputField, TextareaField } from '../components/ui/FormField'
import { deleteBrandAsset, getBrandAssets, importBrandAsset, updateBrandAsset, uploadBrandAssets } from '../features/business-dna/api'
import type { BrandAsset, BrandAssetType } from '../features/business-dna/types'
import { parseApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'

const assetLabels: Record<BrandAssetType, string> = {
  logo: 'Logo', product: 'Producto', photo: 'Fotografía', background: 'Fondo',
  reference: 'Referencia', previous_piece: 'Pieza anterior',
}

export function BusinessAssets() {
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<BrandAsset | null>(null)
  const [type, setType] = useState<BrandAssetType>('reference')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setAssets((await getBrandAssets()).assets) } catch (reason) { setError(parseApiError(reason)) } finally { setLoading(false) }
  }
  useEffect(() => {
    getBrandAssets()
      .then((result) => setAssets(result.assets))
      .catch((reason) => setError(parseApiError(reason)))
      .finally(() => setLoading(false))
  }, [])

  const visibleAssets = useMemo(() => assets.filter((asset) => asset.status === statusFilter), [assets, statusFilter])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    const invalid = Array.from(files).find((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
    if (invalid) { setError('Usa imágenes PNG, JPG o WebP de hasta 10 MB.'); return }
    setUploading(true); setError(null)
    try { await uploadBrandAssets(Array.from(files), type); await load() } catch (reason) { setError(parseApiError(reason)) } finally { setUploading(false) }
  }

  async function importUrl() {
    if (!url.trim()) return
    setUploading(true); setError(null)
    try { await importBrandAsset(url.trim(), type); setUrl(''); await load() } catch (reason) { setError(parseApiError(reason)) } finally { setUploading(false) }
  }

  async function changeSelectedStatus() {
    await Promise.all(Array.from(selected).map((id) => updateBrandAsset(id, { status: statusFilter === 'active' ? 'archived' : 'active' })))
    setSelected(new Set()); await load()
  }

  async function deleteSelected() {
    if (!window.confirm(`Eliminar ${selected.size} recurso(s) definitivamente?`)) return
    await Promise.all(Array.from(selected).map(deleteBrandAsset)); setSelected(new Set()); await load()
  }

  async function savePreview() {
    if (!preview) return
    try {
      await updateBrandAsset(preview.id, {
        title: preview.title, description: preview.description, tags: preview.tags,
        asset_type: preview.asset_type,
      })
      setPreview(null); await load()
    } catch (reason) { setError(parseApiError(reason)) }
  }

  return (
    <section className="page assets-page">
      <div className="feature-page-header"><div><span className="page-eyebrow"><FolderOpen size={15} /> ADN del negocio</span><h1>Recursos</h1><p>Biblioteca visual privada para reutilizar en contenido y campañas.</p></div></div>
      <div className="asset-upload-panel">
        <div className="asset-type-select"><label htmlFor="asset-type">Tipo de recurso</label><select id="asset-type" value={type} onChange={(event) => setType(event.target.value as BrandAssetType)}>{Object.entries(assetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <label className="asset-dropzone"><Upload size={22} /><strong>{uploading ? 'Procesando…' : 'Subir imágenes'}</strong><span>PNG, JPG o WebP · máximo 10 MB</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => void upload(event.target.files)} /></label>
        <div className="asset-url-import"><InputField label="Importar desde una URL pública" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /><button type="button" className="button button-secondary" disabled={uploading || !url.trim()} onClick={() => void importUrl()}><Link2 size={16} /> Importar</button></div>
      </div>
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
      <div className="filter-pills asset-status-filter"><button type="button" className={statusFilter === 'active' ? 'is-active' : ''} onClick={() => { setStatusFilter('active'); setSelected(new Set()) }}>Activos</button><button type="button" className={statusFilter === 'archived' ? 'is-active' : ''} onClick={() => { setStatusFilter('archived'); setSelected(new Set()) }}>Archivados</button></div>
      {selected.size > 0 && <div className="selection-bar"><strong>{selected.size} seleccionados</strong><button type="button" onClick={() => void changeSelectedStatus()}><Archive size={16} /> {statusFilter === 'active' ? 'Archivar' : 'Restaurar'}</button><button type="button" className="danger-action" onClick={() => void deleteSelected()}><Trash2 size={16} /> Eliminar</button></div>}
      {loading ? <Spinner label="Cargando recursos…" /> : visibleAssets.length === 0 ? (
        <div className="empty-state"><FolderOpen size={28} /><strong>Tu biblioteca está vacía</strong><p>Sube logos, fotografías o referencias para reutilizarlas.</p></div>
      ) : (
        <div className="assets-grid">
          {visibleAssets.map((asset) => (
            <article className={`asset-card ${selected.has(asset.id) ? 'is-selected' : ''}`} key={asset.id}>
              <label className="asset-select"><input type="checkbox" checked={selected.has(asset.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id); return next })} /><span className="sr-only">Seleccionar {asset.title}</span></label>
              <button type="button" className="asset-preview-button" onClick={() => setPreview(asset)}>{asset.signed_url ? <img src={asset.signed_url} alt={asset.title} /> : <FolderOpen size={28} />}<span><Maximize2 size={16} /></span></button>
              <div><span className="badge badge-neutral">{assetLabels[asset.asset_type]}</span><h2>{asset.title}</h2><small>{asset.width && asset.height ? `${asset.width} × ${asset.height} · ` : ''}{Math.round(asset.size_bytes / 1024)} KB</small></div>
            </article>
          ))}
        </div>
      )}
      <Drawer open={preview !== null} title={preview?.title || 'Vista previa'} onClose={() => setPreview(null)}>
        {preview && <div className="asset-detail">{preview.signed_url && <img src={preview.signed_url} alt={preview.title} />}<div className="drawer-form"><InputField label="Título" value={preview.title} onChange={(event) => setPreview((current) => current ? { ...current, title: event.target.value } : current)} /><div className="form-field"><label htmlFor="preview-asset-type">Tipo</label><select id="preview-asset-type" value={preview.asset_type} onChange={(event) => setPreview((current) => current ? { ...current, asset_type: event.target.value as BrandAssetType } : current)}>{Object.entries(assetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><TextareaField label="Descripción" value={preview.description || ''} onChange={(event) => setPreview((current) => current ? { ...current, description: event.target.value } : current)} /><InputField label="Etiquetas separadas por coma" value={preview.tags.join(', ')} onChange={(event) => setPreview((current) => current ? { ...current, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) } : current)} /><dl><div><dt>Origen</dt><dd>{preview.source_url ? <a href={preview.source_url} target="_blank" rel="noreferrer">Ver original <ExternalLink size={13} /></a> : 'Subida manual'}</dd></div><div><dt>Fecha</dt><dd>{new Date(preview.created_at).toLocaleDateString('es-BO')}</dd></div></dl><button type="button" className="button button-primary" onClick={() => void savePreview()}>Guardar cambios</button></div></div>}
      </Drawer>
    </section>
  )
}
