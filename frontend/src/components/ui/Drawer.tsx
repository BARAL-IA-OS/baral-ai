import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  variant?: 'drawer' | 'modal'
}

export function Drawer({ open, title, children, onClose, variant = 'drawer' }: DrawerProps) {
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null
  const isModal = variant === 'modal'
  return (
    <div className={`drawer-backdrop${isModal ? ' drawer-backdrop-modal' : ''}`} role="presentation" onMouseDown={onClose}>
      <aside className={`drawer-panel${isModal ? ' drawer-panel-modal' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}
