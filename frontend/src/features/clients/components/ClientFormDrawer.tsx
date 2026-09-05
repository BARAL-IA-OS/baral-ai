import { useState } from 'react'
import { Drawer } from '../../../components/ui/Drawer'
import { InputField, TextareaField } from '../../../components/ui/FormField'
import type { Client360, Client360Input, ClientLifecycleStatus } from '../types'

interface ClientFormDrawerProps {
  open: boolean
  client: Client360 | null
  saving: boolean
  onClose: () => void
  onSave: (input: Client360Input) => Promise<void>
}

const emptyClient: Client360Input = {
  nombre: '', email: '', telefono: '', company: '', producto: '', interest: '', source: '',
  lifecycle_status: 'new', ultima_compra: '', last_purchase_amount: null, tags: [], notes: '',
  contact_consent: true,
}

function toInput(client: Client360 | null): Client360Input {
  return client ? {
    nombre: client.nombre, email: client.email || '', telefono: client.telefono || '',
    company: client.company || '', producto: client.producto || '', interest: client.interest || '',
    source: client.source || '', lifecycle_status: client.lifecycle_status,
    ultima_compra: client.ultima_compra || '', last_purchase_amount: client.last_purchase_amount,
    tags: client.tags || [], notes: client.notes || '', contact_consent: client.contact_consent,
  } : emptyClient
}

export function ClientFormDrawer({ open, client, saving, onClose, onSave }: ClientFormDrawerProps) {
  const [draft, setDraft] = useState<Client360Input>(() => toInput(client))

  return (
    <Drawer open={open} title={client ? 'Ficha del cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); void onSave(draft) }}>
        <InputField label="Nombre *" value={draft.nombre} onChange={(event) => setDraft((value) => ({ ...value, nombre: event.target.value }))} required />
        <div className="form-row"><InputField label="Email" type="email" value={draft.email || ''} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} /><InputField label="Teléfono" value={draft.telefono || ''} onChange={(event) => setDraft((value) => ({ ...value, telefono: event.target.value }))} /></div>
        <InputField label="Empresa" value={draft.company || ''} onChange={(event) => setDraft((value) => ({ ...value, company: event.target.value }))} />
        <div className="form-row"><InputField label="Producto" value={draft.producto || ''} onChange={(event) => setDraft((value) => ({ ...value, producto: event.target.value }))} /><InputField label="Interés" value={draft.interest || ''} onChange={(event) => setDraft((value) => ({ ...value, interest: event.target.value }))} /></div>
        <div className="form-field"><label htmlFor="client-status">Estado</label><select id="client-status" value={draft.lifecycle_status} onChange={(event) => setDraft((value) => ({ ...value, lifecycle_status: event.target.value as ClientLifecycleStatus }))}><option value="new">Nuevo</option><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="vip">VIP</option><option value="do_not_contact">No contactar</option></select></div>
        <InputField label="Origen" value={draft.source || ''} onChange={(event) => setDraft((value) => ({ ...value, source: event.target.value }))} placeholder="Web, tienda, referido…" />
        <div className="form-row"><InputField label="Última compra" type="date" value={draft.ultima_compra || ''} onChange={(event) => setDraft((value) => ({ ...value, ultima_compra: event.target.value }))} /><InputField label="Monto" type="number" min="0" step="0.01" value={draft.last_purchase_amount ?? ''} onChange={(event) => setDraft((value) => ({ ...value, last_purchase_amount: event.target.value ? Number(event.target.value) : null }))} /></div>
        <InputField label="Etiquetas separadas por coma" value={draft.tags.join(', ')} onChange={(event) => setDraft((value) => ({ ...value, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} />
        <TextareaField label="Notas internas" rows={4} value={draft.notes || ''} onChange={(event) => setDraft((value) => ({ ...value, notes: event.target.value }))} />
        <label className="check-control"><input type="checkbox" checked={draft.contact_consent} onChange={(event) => setDraft((value) => ({ ...value, contact_consent: event.target.checked }))} /> Tiene consentimiento para recibir comunicaciones</label>
        {draft.lifecycle_status === 'do_not_contact' && <p className="form-warning">Este cliente será excluido de todas las audiencias.</p>}
        <div className="drawer-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving || !draft.nombre.trim()}>{saving ? 'Guardando…' : 'Guardar cliente'}</button></div>
      </form>
    </Drawer>
  )
}
