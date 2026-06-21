import type { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  title: string
  children: ReactNode
  open: boolean
  onClose: () => void
}

export function Modal({ title, children, open, onClose }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2>{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}
