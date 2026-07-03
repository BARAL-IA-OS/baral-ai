import type { TaskDraftContent, Client } from '../../types'

interface EmailPreviewMockProps {
  draft: TaskDraftContent
  recipients?: Client[]
  brandName?: string
}

export function EmailPreviewMock({ draft, recipients = [], brandName = 'Nuestra Empresa' }: EmailPreviewMockProps) {
  const firstRecipient = recipients[0]
  const recipientName = firstRecipient?.nombre || 'Cliente'
  const recipientEmail = firstRecipient?.email || 'cliente@example.com'

  // Reemplazar dinámicamente las etiquetas de nombre en el saludo para simular la personalización real
  const customizedGreeting = (draft.saludo || '')
    .replace(/\{\{nombre\}\}/g, recipientName)
    .replace(/\{\{nombre_cliente\}\}/g, recipientName)
    .replace(/\{\{nombre_destinatario\}\}/g, recipientName)

  // Obtener fecha actual
  const todayStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Obtener inicial para el logo avatar
  const senderInitial = brandName.charAt(0).toUpperCase()

  return (
    <div className="email-mock-envelope">
      {/* Cabecera estilo cliente de correo (Mail Client Shell) */}
      <div className="email-mock-chrome">
        <div className="email-mock-chrome-dot red" />
        <div className="email-mock-chrome-dot yellow" />
        <div className="email-mock-chrome-dot green" />
        <span className="email-mock-chrome-title">{draft.asunto || '(Sin asunto)'}</span>
      </div>

      <div className="email-mock-header">
        <div className="email-mock-avatar">{senderInitial}</div>
        <div className="email-mock-meta stack" style={{ gap: '2px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="email-mock-sender">
              <strong>{brandName}</strong> <span className="email-mock-email">&lt;campana@baral.ai&gt;</span>
            </span>
            <span className="email-mock-date">{todayStr}</span>
          </div>
          <span className="email-mock-to">
            Para: <strong>{recipientName}</strong> &lt;{recipientEmail}&gt;
          </span>
        </div>
      </div>

      {/* Cuerpo del correo con contenedor estilizado (Email Body) */}
      <div className="email-mock-body-container">
        <div className="email-mock-inner-card">
          {/* Logo / Branding Placeholder */}
          <div className="email-mock-logo-area">
            <span className="email-mock-logo-text">{brandName}</span>
          </div>

          <div className="email-mock-message-content">
            <h3 className="email-mock-greeting">{customizedGreeting}</h3>
            
            <p className="email-mock-body-text">{draft.cuerpo}</p>

            {draft.cta && (
              <div className="email-mock-cta-wrapper">
                <a
                  href="#cta-preview"
                  onClick={(e) => e.preventDefault()}
                  className="email-mock-cta-button"
                >
                  {draft.cta}
                </a>
              </div>
            )}
          </div>

          <div className="email-mock-footer">
            <p>Recibiste este correo de parte de {brandName} porque estás registrado en nuestra base de clientes.</p>
            <p style={{ marginTop: '6px' }}>© {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
