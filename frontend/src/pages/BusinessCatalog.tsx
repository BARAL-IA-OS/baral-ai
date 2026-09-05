import { useEffect, useMemo, useState } from 'react'
import { Archive, CircleAlert, Globe2, Loader2, PackageOpen, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { Drawer } from '../components/ui/Drawer'
import { InputField, TextareaField } from '../components/ui/FormField'
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItems,
  getBrandAssets,
  getBusinessExtraction,
  startBusinessExtraction,
  updateCatalogItem,
  uploadBrandAssets,
  type CatalogItemInput,
} from '../features/business-dna/api'
import type { BrandAsset, CatalogItem, ExtractionJob } from '../features/business-dna/types'
import { parseApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'

const emptyItem: CatalogItemInput = {
  kind: 'product', name: '', category: '', description: '', price: null,
  currency: 'BOB', cta: '', featured: false,
}

export function BusinessCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'product' | 'service' | 'archived'>('all')
  const [editing, setEditing] = useState<CatalogItem | null | 'new'>(null)
  const [showUrlImport, setShowUrlImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importJob, setImportJob] = useState<ExtractionJob | null>(null)
  const [draft, setDraft] = useState<CatalogItemInput>(emptyItem)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [catalogResult, assetResult] = await Promise.all([getCatalogItems('all'), getBrandAssets()])
      setItems(catalogResult.items)
      setAssets(assetResult.assets)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([getCatalogItems('all'), getBrandAssets()])
      .then(([catalogResult, assetResult]) => { setItems(catalogResult.items); setAssets(assetResult.assets) })
      .catch((reason) => setError(parseApiError(reason)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!importJob || !['queued', 'running'].includes(importJob.status)) return undefined
    const timer = window.setInterval(() => {
      getBusinessExtraction(importJob.id).then((result) => setImportJob(result.job)).catch((reason) => setError(parseApiError(reason)))
    }, 1200)
    return () => window.clearInterval(timer)
  }, [importJob])

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === 'all'
      ? item.status === 'active'
      : filter === 'archived' ? item.status === 'archived' : item.status === 'active' && item.kind === filter
    const query = search.toLowerCase()
    return matchesFilter && (!query || item.name.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query))
  }), [filter, items, search])

  function openNew() {
    setDraft(emptyItem)
    setEditing('new')
  }

  function openEdit(item: CatalogItem) {
    setDraft({
      kind: item.kind, name: item.name, category: item.category, description: item.description,
      price: item.price, currency: item.currency, cta: item.cta, featured: item.featured,
      source_url: item.source_url,
    })
    setEditing(item)
  }

  async function save() {
    if (!draft.name.trim()) { setError('Escribe un nombre para el elemento.'); return }
    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') await createCatalogItem(draft)
      else if (editing) await updateCatalogItem(editing.id, draft)
      setEditing(null)
      await load()
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setSaving(false)
    }
  }

  async function changeItem(item: CatalogItem, update: Partial<CatalogItem>) {
    try {
      await updateCatalogItem(item.id, update)
      await load()
    } catch (reason) { setError(parseApiError(reason)) }
  }

  async function remove(item: CatalogItem) {
    if (!window.confirm(`Eliminar “${item.name}” definitivamente?`)) return
    try { await deleteCatalogItem(item.id); await load() } catch (reason) { setError(parseApiError(reason)) }
  }

  async function startUrlImport() {
    setError(null)
    try { setImportJob((await startBusinessExtraction(importUrl)).job) } catch (reason) { setError(parseApiError(reason)) }
  }

  async function importDetected() {
    const detected = importJob?.result?.catalogItems.filter((item) => item.name?.trim()) || []
    if (!detected.length) { setError('No hay elementos válidos para importar.'); return }
    setSaving(true)
    try {
      await Promise.all(detected.map((item) => createCatalogItem({
        kind: item.kind || 'product', name: item.name || '', category: item.category || '',
        description: item.description || '', price: item.price ?? null, currency: item.currency || 'BOB',
        cta: item.cta || '', featured: Boolean(item.featured), source_url: item.source_url,
      })))
      setShowUrlImport(false); setImportJob(null); setImportUrl(''); await load()
    } catch (reason) { setError(parseApiError(reason)) } finally { setSaving(false) }
  }

  async function uploadCatalogImages(files: FileList | null) {
    if (!files?.length || !editing || editing === 'new') return
    setSaving(true); setError(null)
    try { await uploadBrandAssets(Array.from(files), 'product', editing.id); await load() } catch (reason) { setError(parseApiError(reason)) } finally { setSaving(false) }
  }

  return (
    <section className="page catalog-page">
      <div className="feature-page-header">
        <div><span className="page-eyebrow"><PackageOpen size={15} /> ADN del negocio</span><h1>Catálogo</h1><p>Productos y servicios disponibles para campañas y piezas creativas.</p></div>
        <div className="header-actions"><button type="button" className="button button-secondary" onClick={() => setShowUrlImport(true)}><Globe2 size={17} /> Agregar desde URL</button><button type="button" className="button button-primary" onClick={openNew}><Plus size={17} /> Agregar elemento</button></div>
      </div>
      <div className="catalog-toolbar">
        <label className="search-control"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en el catálogo…" /></label>
        <div className="filter-pills">
          {(['all', 'product', 'service', 'archived'] as const).map((value) => (
            <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>
              {value === 'all' ? 'Todos' : value === 'product' ? 'Productos' : value === 'service' ? 'Servicios' : 'Archivados'}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
      {loading ? <Spinner label="Cargando catálogo…" /> : visibleItems.length === 0 ? (
        <div className="empty-state"><PackageOpen size={28} /><strong>Aún no hay elementos aquí</strong><p>Agrega tu primer producto o servicio para usarlo en campañas.</p><button type="button" className="button button-secondary" onClick={openNew}>Agregar desde cero</button></div>
      ) : (
        <div className="catalog-grid">
          {visibleItems.map((item) => {
            const itemAssets = assets.filter((asset) => asset.catalog_item_id === item.id && asset.status === 'active')
            return <article className={`catalog-card ${item.status === 'archived' ? 'is-archived' : ''}`} key={item.id}>
              {itemAssets[0]?.signed_url && <div className="catalog-card-image"><img src={itemAssets[0].signed_url} alt={item.name} />{itemAssets.length > 1 && <span>+{itemAssets.length - 1}</span>}</div>}
              <div className="catalog-card-top"><span className="badge badge-neutral">{item.kind === 'product' ? 'Producto' : 'Servicio'}</span>{item.featured && <span className="badge badge-featured"><Sparkles size={12} /> Destacado</span>}</div>
              <div><h2>{item.name}</h2><span>{item.category || 'Sin categoría'}</span><p>{item.description || 'Sin descripción.'}</p></div>
              <div className="catalog-price">{item.price != null ? `${item.currency} ${item.price.toFixed(2)}` : 'Precio a consultar'}</div>
              <footer>
                <button type="button" onClick={() => void changeItem(item, { featured: !item.featured })}><Sparkles size={16} />{item.featured ? 'Quitar destacado' : 'Destacar'}</button>
                <button type="button" onClick={() => openEdit(item)} aria-label={`Editar ${item.name}`}><Pencil size={16} /></button>
                <button type="button" onClick={() => void changeItem(item, { status: item.status === 'active' ? 'archived' : 'active' })} aria-label="Archivar"><Archive size={16} /></button>
                <button type="button" className="danger-action" onClick={() => void remove(item)} aria-label="Eliminar"><Trash2 size={16} /></button>
              </footer>
            </article>
          })}
        </div>
      )}
      <Drawer open={editing !== null} title={editing === 'new' ? 'Nuevo producto o servicio' : 'Editar elemento'} onClose={() => setEditing(null)}>
        <div className="drawer-form">
          <div className="segmented-control">
            <button type="button" className={draft.kind === 'product' ? 'is-active' : ''} onClick={() => setDraft((current) => ({ ...current, kind: 'product' }))}>Producto</button>
            <button type="button" className={draft.kind === 'service' ? 'is-active' : ''} onClick={() => setDraft((current) => ({ ...current, kind: 'service' }))}>Servicio</button>
          </div>
          <InputField label="Nombre" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required />
          <InputField label="Categoría" value={draft.category || ''} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
          <TextareaField label="Descripción" value={draft.description || ''} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={5} />
          <div className="form-row"><InputField label="Precio opcional" type="number" min="0" step="0.01" value={draft.price ?? ''} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value ? Number(event.target.value) : null }))} /><InputField label="Moneda" maxLength={3} value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} /></div>
          <InputField label="Llamado a la acción" value={draft.cta || ''} onChange={(event) => setDraft((current) => ({ ...current, cta: event.target.value }))} placeholder="Ej. Reservar ahora" />
          {editing !== 'new' && editing && <div className="catalog-image-field"><span>Imágenes y galería</span><div>{assets.filter((asset) => asset.catalog_item_id === editing.id && asset.status === 'active').map((asset) => asset.signed_url ? <img key={asset.id} src={asset.signed_url} alt={asset.title} /> : null)}</div><label><Plus size={16} /> Agregar imágenes<input type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={(event) => void uploadCatalogImages(event.target.files)} /></label></div>}
          <label className="check-control"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} /> Mostrar como destacado</label>
          <div className="drawer-actions"><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancelar</button><button type="button" className="button button-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
        </div>
      </Drawer>
      <Drawer open={showUrlImport} title="Agregar catálogo desde una web" onClose={() => { setShowUrlImport(false); setImportJob(null) }}>
        <div className="drawer-form catalog-url-import">
          {!importJob && <><InputField label="URL del catálogo o sitio" type="url" value={importUrl} onChange={(event) => setImportUrl(event.target.value)} placeholder="https://tuempresa.com/catalogo" /><button type="button" className="button button-primary" disabled={!importUrl.trim()} onClick={() => void startUrlImport()}><Sparkles size={16} /> Analizar</button></>}
          {importJob && !importJob.result && importJob.status !== 'failed' && <div className="catalog-import-progress"><Loader2 size={24} className="spin" /><strong>{importJob.stage_label}</strong><span>{importJob.progress}%</span><div className="progress-track"><span style={{ width: `${importJob.progress}%` }} /></div></div>}
          {importJob?.status === 'failed' && <div className="error-banner">{importJob.error || 'No se pudo analizar el sitio.'}</div>}
          {importJob?.result && <><p className="drawer-helper">Revisa y corrige los elementos detectados antes de importarlos.</p>{importJob.result.catalogItems.length === 0 && <div className="empty-state"><strong>No se detectaron productos estructurados</strong><p>Prueba con la URL directa del catálogo o agrégalos desde cero.</p></div>}<div className="detected-catalog-list">{importJob.result.catalogItems.map((item, index) => <div className="detected-item" key={`${index}-${item.source_url}`}><select value={item.kind || 'product'} onChange={(event) => setImportJob((current) => { if (!current?.result) return current; const catalogItems = [...current.result.catalogItems]; catalogItems[index] = { ...catalogItems[index], kind: event.target.value as 'product' | 'service' }; return { ...current, result: { ...current.result, catalogItems } } })}><option value="product">Producto</option><option value="service">Servicio</option></select><input value={item.name || ''} onChange={(event) => setImportJob((current) => { if (!current?.result) return current; const catalogItems = [...current.result.catalogItems]; catalogItems[index] = { ...catalogItems[index], name: event.target.value }; return { ...current, result: { ...current.result, catalogItems } } })} /></div>)}</div>{importJob.result.catalogItems.length > 0 && <button type="button" className="button button-primary" disabled={saving} onClick={() => void importDetected()}>{saving ? 'Importando…' : `Importar ${importJob.result.catalogItems.length} elementos`}</button>}</>}
        </div>
      </Drawer>
    </section>
  )
}
