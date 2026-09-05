import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, Mail, Megaphone, Pencil, Phone, Plus, Save, Search, Trash2, Upload, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ClientFormDrawer } from '../features/clients/components/ClientFormDrawer'
import { ClientImportDrawer } from '../features/clients/components/ClientImportDrawer'
import { createClient, deleteClient, getClients, getClientSegments, getClientStats, saveClientSegment, updateClient } from '../features/clients/api'
import type { Client360, Client360Input, ClientLifecycleStatus, ClientSegment, ClientStats } from '../features/clients/types'
import { parseApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'
import { InputField } from '../components/ui/FormField'

const statusLabels: Record<ClientLifecycleStatus, string> = {
  new: 'Nuevo', active: 'Activo', inactive: 'Inactivo', vip: 'VIP', do_not_contact: 'No contactar',
}

export function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client360[]>([])
  const [stats, setStats] = useState<ClientStats>({ total: 0, active: 0, inactive: 0, new: 0, withoutContact: 0 })
  const [segments, setSegments] = useState<ClientSegment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [interest, setInterest] = useState('')
  const [product, setProduct] = useState('')
  const [purchasedAfter, setPurchasedAfter] = useState('')
  const [purchasedBefore, setPurchasedBefore] = useState('')
  const [sort, setSort] = useState<'nombre' | 'created_at' | 'ultima_compra' | 'lifecycle_status'>('nombre')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Client360 | null | 'new'>(null)
  const [showImport, setShowImport] = useState(false)
  const [showSegmentSave, setShowSegmentSave] = useState(false)
  const [segmentName, setSegmentName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [clientResult, statsResult, segmentResult] = await Promise.all([
        getClients({ page, pageSize: 25, search, status, source, interest, product, purchasedAfter, purchasedBefore, sort, direction }), getClientStats(), getClientSegments(),
      ])
      setClients(clientResult.clients); setTotal(clientResult.total); setStats(statsResult); setSegments(segmentResult.segments)
    } catch (reason) { setError(parseApiError(reason)) } finally { setLoading(false) }
  }, [direction, interest, page, product, purchasedAfter, purchasedBefore, search, sort, source, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  async function save(input: Client360Input) {
    setSaving(true); setError(null)
    try {
      const payload = {
        ...input,
        email: input.email || null,
        telefono: input.telefono || null,
        ultima_compra: input.ultima_compra || null,
      }
      if (editing === 'new') await createClient(payload)
      else if (editing) await updateClient(editing.id, payload)
      setEditing(null); await load()
    } catch (reason) { setError(parseApiError(reason)) } finally { setSaving(false) }
  }

  async function remove(client: Client360) {
    if (!window.confirm(`Eliminar a ${client.nombre}?`)) return
    try { await deleteClient(client.id); await load() } catch (reason) { setError(parseApiError(reason)) }
  }

  async function createSegment() {
    const name = segmentName.trim()
    if (!name) return
    const filters = selected.size > 0
      ? { clientIds: Array.from(selected) }
      : { status: status || undefined, search: search || undefined, source: source || undefined, interest: interest || undefined, product: product || undefined, purchasedAfter: purchasedAfter || undefined, purchasedBefore: purchasedBefore || undefined }
    try { await saveClientSegment({ name, filters }); setSegmentName(''); setShowSegmentSave(false); setSelected(new Set()); await load() } catch (reason) { setError(parseApiError(reason)) }
  }

  function toggleSort(nextSort: typeof sort) {
    if (sort === nextSort) setDirection((value) => value === 'asc' ? 'desc' : 'asc')
    else { setSort(nextSort); setDirection('asc') }
  }

  const pages = Math.max(1, Math.ceil(total / 25))
  return (
    <section className="page clients-360-page">
      <div className="feature-page-header"><div><span className="page-eyebrow"><Users size={15} /> Gestión</span><h1>Clientes 360</h1><p>Organiza tu base, crea segmentos y prepara audiencias para campañas.</p></div><div className="header-actions"><button type="button" className="button button-secondary" onClick={() => setShowImport(true)}><Upload size={17} /> Importar CSV</button><button type="button" className="button button-primary" onClick={() => setEditing('new')}><Plus size={17} /> Agregar cliente</button></div></div>
      <div className="client-stats-row"><div><strong>{stats.total}</strong><span>Total</span></div><div><strong>{stats.active}</strong><span>Activos</span></div><div><strong>{stats.inactive}</strong><span>Inactivos</span></div><div><strong>{stats.new}</strong><span>Nuevos</span></div><div><strong>{stats.withoutContact}</strong><span>Sin contacto</span></div></div>
      <div className="clients-toolbar"><label className="search-control"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar nombre, email, teléfono o producto…" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" className="button button-secondary" onClick={() => setShowSegmentSave(true)}><Save size={16} /> Guardar segmento</button></div>
      {showSegmentSave && <div className="segment-save-panel"><InputField label="Nombre del segmento" value={segmentName} autoFocus onChange={(event) => setSegmentName(event.target.value)} placeholder="Ej. Clientes VIP de la web" /><button type="button" className="button button-secondary" onClick={() => setShowSegmentSave(false)}>Cancelar</button><button type="button" className="button button-primary" disabled={!segmentName.trim()} onClick={() => void createSegment()}>Guardar</button></div>}
      <details className="advanced-client-filters"><summary>Filtros avanzados</summary><div><InputField label="Origen exacto" value={source} onChange={(event) => { setSource(event.target.value); setPage(1) }} placeholder="Ej. Web" /><InputField label="Producto exacto" value={product} onChange={(event) => { setProduct(event.target.value); setPage(1) }} /><InputField label="Interés exacto" value={interest} onChange={(event) => { setInterest(event.target.value); setPage(1) }} /><InputField label="Compró desde" type="date" value={purchasedAfter} onChange={(event) => { setPurchasedAfter(event.target.value); setPage(1) }} /><InputField label="Compró hasta" type="date" value={purchasedBefore} onChange={(event) => { setPurchasedBefore(event.target.value); setPage(1) }} /></div></details>
      {segments.length > 0 && <div className="segment-row"><span>Segmentos:</span>{segments.map((segment) => <button type="button" key={segment.id} title="Crear campaña con este segmento" aria-label={`Crear campaña con el segmento ${segment.name}`} onClick={() => navigate(`/studio?segmentId=${segment.id}`)}>{segment.name}<Megaphone size={14} /></button>)}</div>}
      {selected.size > 0 && <div className="selection-bar"><strong>{selected.size} clientes seleccionados</strong><span>La selección está lista para convertirse en segmento.</span><button type="button" onClick={() => setShowSegmentSave(true)}><Save size={16} /> Guardar selección</button></div>}
      {error && <div className="error-banner"><CircleAlert size={17} />{error}</div>}
      {loading ? <Spinner label="Cargando clientes…" /> : clients.length === 0 ? <div className="empty-state"><Users size={28} /><strong>No encontramos clientes</strong><p>Agrega un cliente o importa un CSV para comenzar.</p></div> : <div className="clients-table-panel"><table className="clients-360-table"><thead><tr><th><input type="checkbox" aria-label="Seleccionar página" checked={clients.length > 0 && clients.every((client) => selected.has(client.id))} onChange={(event) => setSelected((current) => { const next = new Set(current); clients.forEach((client) => event.target.checked ? next.add(client.id) : next.delete(client.id)); return next })} /></th><th><button type="button" onClick={() => toggleSort('nombre')}>Cliente</button></th><th>Contacto</th><th>Interés</th><th><button type="button" onClick={() => toggleSort('lifecycle_status')}>Estado</button></th><th><button type="button" onClick={() => toggleSort('ultima_compra')}>Última compra</button></th><th aria-label="Acciones" /></tr></thead><tbody>{clients.map((client) => <tr key={client.id}><td><input type="checkbox" aria-label={`Seleccionar ${client.nombre}`} checked={selected.has(client.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(client.id)) next.delete(client.id); else next.add(client.id); return next })} /></td><td><button type="button" className="client-name-button" onClick={() => setEditing(client)}><strong>{client.nombre}</strong><span>{client.company || client.source || 'Sin empresa'}</span></button></td><td><span className="client-contact">{client.email && <small><Mail size={13} />{client.email}</small>}{client.telefono && <small><Phone size={13} />{client.telefono}</small>}{!client.email && !client.telefono && <em>Sin datos</em>}</span></td><td>{client.interest || client.producto || '—'}</td><td><span className={`client-status status-${client.lifecycle_status}`}>{statusLabels[client.lifecycle_status]}</span></td><td>{client.ultima_compra ? new Date(client.ultima_compra).toLocaleDateString('es-BO') : '—'}</td><td><div className="row-actions"><button type="button" onClick={() => setEditing(client)} aria-label="Editar"><Pencil size={15} /></button><button type="button" className="danger-action" onClick={() => void remove(client)} aria-label="Eliminar"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
      <div className="pagination"><span>{total} resultados · página {page} de {pages}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={17} /></button><button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={17} /></button></div></div>
      <ClientFormDrawer key={editing === 'new' ? 'new' : editing?.id || 'closed'} open={editing !== null} client={editing === 'new' ? null : editing} saving={saving} onClose={() => setEditing(null)} onSave={save} />
      <ClientImportDrawer open={showImport} onClose={() => setShowImport(false)} onSuccess={() => void load()} />
    </section>
  )
}
