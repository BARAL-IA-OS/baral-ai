import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, ExternalLink, ImagePlus, Save } from 'lucide-react'
import { getBrandBrain } from '../hooks/useBrandBrain'
import { createBrandBook, exportBrandBookPdf, parseApiError, uploadGeneratedAsset } from '../lib/api'
import type { BrandBook as BrandBookType, BrandBrain } from '../types'

type LocalAsset = { id: string; name: string; url: string; storagePath: string }

function escapeHtml(value: string | undefined) {
  return (value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

export function BrandBook() {
  const [brand, setBrand] = useState<BrandBrain | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [cover, setCover] = useState('gradient')
  const [coverAsset, setCoverAsset] = useState<{ url: string; path: string } | null>(null)
  const [assets, setAssets] = useState<LocalAsset[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [book, setBook] = useState<BrandBookType | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { void getBrandBrain().then(setBrand).catch((reason) => setError(parseApiError(reason))) }, [])
  const brandName = useMemo(() => brand?.website_url?.replace(/^https?:\/\//, '').split('.')[0] || brand?.industria || 'Tu negocio', [brand])

  async function addAssets(files: FileList | null) {
    if (!files) return
    setUploading(true); setError('')
    try {
      const incoming = await Promise.all(Array.from(files).slice(0, 7).map(async (file) => {
        const response = await uploadGeneratedAsset(file)
        return {
          id: response.asset.id, name: response.asset.name || file.name,
          url: response.asset.url || URL.createObjectURL(file),
          storagePath: response.asset.storage_path || response.asset.id,
        }
      }))
      setAssets(incoming)
      setSelected(incoming.map((item) => item.id))
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setUploading(false)
    }
  }

  function toggleAsset(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 7 ? [...current, id] : current)
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return
    setUploading(true); setError('')
    try {
      const response = await uploadGeneratedAsset(file)
      setCoverAsset({ url: response.asset.url || URL.createObjectURL(file), path: response.asset.storage_path || response.asset.id })
      setCover('upload')
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setUploading(false)
    }
  }

  async function saveBook() {
    if (selected.length < 3 || selected.length > 7 || loading) return
    setLoading(true); setError('')
    try {
      const response = await createBrandBook({
        title: `${brandName} · Brand Book`, cover_url: coverAsset?.path || cover,
        selected_assets: assets.filter((asset) => selected.includes(asset.id)).map((asset) => asset.storagePath),
      })
      setBook(response.brand_book)
    } catch (reason) {
      setError(parseApiError(reason))
    } finally {
      setLoading(false)
    }
  }

  async function downloadPdf() {
    if (!book) return
    try {
      const blob = await exportBrandBookPdf(book.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `brand-book-${brandName}-v${book.version}.pdf`; link.click()
      URL.revokeObjectURL(url)
    } catch (reason) { setError(parseApiError(reason)) }
  }

  function openPreview() {
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win || !brand) return
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(brandName)} Brand Book</title><style>body{font:16px Arial;background:#1b1b1b;color:#eee;padding:64px;max-width:850px;margin:auto}h1{color:#a77bff;font-size:48px}section{background:#282a2c;padding:24px;margin:16px 0;border-radius:16px}small{color:#a77bff;text-transform:uppercase}</style></head><body><small>Baral AI · Brand Book</small><h1>${escapeHtml(brandName)}</h1><section><h2>Propuesta de valor</h2><p>${escapeHtml(brand.propuesta)}</p></section><section><h2>Audiencia</h2><p>${escapeHtml(brand.audiencia)}</p></section><section><h2>Tono</h2><p>${escapeHtml(brand.tono)}</p></section><section><h2>Diferenciador</h2><p>${escapeHtml(brand.diferenciador)}</p></section></body></html>`)
    win.document.close()
  }

  return (
    <section className="page omar-page brandbook-page">
      <header className="omar-page-header"><span className="omar-eyebrow"><BookOpen size={14} /> Identidad documentada</span><h1>Brand Book</h1><p>Convierte el ADN confirmado de tu negocio en una guía práctica y versionada.</p></header>
      <div className="brandbook-layout">
        <section className="brandbook-builder omar-panel">
          <div className="stepper"><span className={step === 1 ? 'is-active' : 'is-done'}>1 <small>Portada</small></span><i /><span className={step === 2 ? 'is-active' : ''}>2 <small>Imágenes</small></span></div>
          {step === 1 ? (
            <div className="cover-step"><h2>Elige una portada</h2><p>Las propuestas usan el tema Baral Eclipse y la información real de tu ADN.</p><div className="cover-grid">
              {['gradient', 'minimal', 'editorial', 'bold'].map((option) => <button key={option} type="button" className={`cover-option cover-${option} ${cover === option ? 'is-selected' : ''}`} onClick={() => setCover(option)}><strong>{brandName}</strong><small>Brand Book</small></button>)}
              {coverAsset && <button type="button" className={`cover-option cover-upload ${cover === 'upload' ? 'is-selected' : ''}`} style={{ backgroundImage: `linear-gradient(rgba(15,12,19,.2),rgba(15,12,19,.72)),url(${coverAsset.url})` }} onClick={() => setCover('upload')}><strong>{brandName}</strong><small>Portada subida</small></button>}
            </div><div className="cover-step-actions"><label className="button button-secondary"><ImagePlus size={16} /> Subir portada<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void uploadCover(event.target.files?.[0])} /></label><button type="button" className="button button-primary" onClick={() => setStep(2)}>Continuar con imágenes</button></div></div>
          ) : (
            <div className="asset-step"><h2>Confirma entre 3 y 7 imágenes</h2><p>Estas imágenes acompañarán las secciones internas de la guía.</p>
              <label className="asset-add"><ImagePlus size={22} /><span>{uploading ? 'Subiendo a biblioteca privada…' : 'Subir imágenes'}</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading} onChange={(event) => void addAssets(event.target.files)} /></label>
              <div className="brandbook-assets">{assets.map((asset) => <button key={asset.id} type="button" className={selected.includes(asset.id) ? 'is-selected' : ''} onClick={() => toggleAsset(asset.id)}><img src={asset.url} alt={asset.name} /><span>{selected.includes(asset.id) ? '✓' : '+'}</span></button>)}</div>
              <div className="omar-modal-actions"><button type="button" className="button button-secondary" onClick={() => setStep(1)}>Atrás</button><button type="button" className="button button-primary" disabled={selected.length < 3 || selected.length > 7 || loading} onClick={() => void saveBook()}><Save size={16} />{loading ? 'Guardando…' : `Guardar versión (${selected.length}/7)`}</button></div>
            </div>
          )}
          {error && <p className="omar-alert error">{error}</p>}
        </section>
        <aside className="brandbook-preview omar-panel">
          <div className={`brandbook-cover-preview cover-${cover}`} style={cover === 'upload' && coverAsset ? { backgroundImage: `linear-gradient(rgba(15,12,19,.25),rgba(15,12,19,.8)),url(${coverAsset.url})` } : undefined}><small>Brand Book</small><h2>{brandName}</h2><p>{brand?.propuesta || 'Completa el ADN para documentar tu identidad.'}</p><span>Baral AI</span></div>
          <div className="brandbook-sections"><article><small>01</small><div><strong>Audiencia</strong><p>{brand?.audiencia}</p></div></article><article><small>02</small><div><strong>Voz y tono</strong><p>{brand?.tono}</p></div></article><article><small>03</small><div><strong>Diferenciador</strong><p>{brand?.diferenciador}</p></div></article></div>
          <div className="brandbook-actions"><button type="button" className="button button-secondary" onClick={openPreview}><ExternalLink size={16} /> Abrir vista</button><button type="button" className="button button-primary" disabled={!book} onClick={() => void downloadPdf()}><Download size={16} /> Descargar PDF</button></div>
          {!book && <p className="omar-footnote">Completa los dos pasos para habilitar la exportación.</p>}
        </aside>
      </div>
    </section>
  )
}
