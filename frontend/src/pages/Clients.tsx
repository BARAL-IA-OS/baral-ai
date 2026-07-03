import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Trash2, Mail, Phone, ShoppingBag, Upload } from 'lucide-react'
import { getClients, deleteClient, parseApiError } from '../lib/api'
import type { Client } from '../types'
import { Spinner } from '../components/ui/Spinner'
import { CSVUpload } from '../components/onboarding/CSVUpload'

function formatRelativeDate(dateStr?: string) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const ms = Date.now() - date.getTime()
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
  
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days} días`
  if (days < 60) return 'Hace 1 mes'
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return `Hace ${Math.floor(days / 365)} año(s)`
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    setError(null)
    try {
      const res = await getClients()
      setClients(res.clients)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este cliente?')) return
    setDeleting(id)
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.telefono?.toLowerCase().includes(q) ?? false) ||
      (c.producto?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <section className="page clients-page">
      <div className="clients-header">
        <div className="clients-header-left">
          <div className="clients-icon-wrap">
            <Users size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1>Clientes</h1>
            <p>
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} importados
            </p>
          </div>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setShowImportModal(true)}
        >
          <Upload size={15} strokeWidth={2} />
          Importar CSV
        </button>
      </div>

      {/* Search */}
      <div className="clients-search">
        <Search size={16} strokeWidth={1.75} className="clients-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, telefono o producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner label="Cargando clientes..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={24} strokeWidth={1.75} />
          </div>
          <strong>
            {clients.length === 0
              ? 'No hay clientes importados'
              : 'Sin resultados'}
          </strong>
          <p>
            {clients.length === 0
              ? 'Importa tu base de clientes desde un archivo CSV para empezar.'
              : `No se encontraron clientes con "${search}".`}
          </p>
          {clients.length === 0 && (
            <Link to="/onboarding?force=true">Ir a importar clientes →</Link>
          )}
        </div>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Producto</th>
                <th>Ultima compra</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td>
                    <span className="clients-name">{client.nombre}</span>
                  </td>
                  <td>
                    <span className="clients-cell-icon">
                      <Mail size={13} strokeWidth={1.75} />
                      {client.email}
                    </span>
                  </td>
                  <td>
                    {client.telefono ? (
                      <span className="clients-cell-icon">
                        <Phone size={13} strokeWidth={1.75} />
                        {client.telefono}
                      </span>
                    ) : (
                      <span className="clients-cell-empty">—</span>
                    )}
                  </td>
                  <td>
                    {client.producto ? (
                      <span className="badge badge-product">
                        <ShoppingBag size={12} strokeWidth={2} />
                        {client.producto}
                      </span>
                    ) : (
                      <span className="clients-cell-empty">—</span>
                    )}
                  </td>
                  <td>
                    {client.ultima_compra ? (
                      <div className="clients-date-col">
                        <strong>{formatRelativeDate(client.ultima_compra)}</strong>
                        <span className="clients-date-raw">{new Date(client.ultima_compra).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}</span>
                      </div>
                    ) : (
                      <span className="clients-cell-empty">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="clients-delete-btn"
                      disabled={deleting === client.id}
                      onClick={() => void handleDelete(client.id)}
                      aria-label={`Eliminar ${client.nombre}`}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content csv-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Importar base de clientes</h2>
              <button type="button" className="modal-close" onClick={() => setShowImportModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <CSVUpload onSuccess={() => {
                // Refresh clients in the background
                loadClients()
                // Auto close modal after a short delay so user sees success message
                setTimeout(() => setShowImportModal(false), 2000)
              }} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
