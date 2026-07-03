import { useEffect, useRef, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Gauge,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { TokenUsageBar } from './TokenUsageBar'

interface AccountDropdownProps {
  email: string
  initials: string
  onClose: () => void
  anchorRef: RefObject<HTMLDivElement | null>
}

export function AccountDropdown({ email, initials, onClose, anchorRef }: AccountDropdownProps) {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, anchorRef])

  return (
    <div className="account-dropdown" ref={menuRef}>
      <div className="account-dd-header">
        <span className="account-dd-avatar">{initials}</span>
        <div className="account-dd-info">
          <strong>{email}</strong>
          <small>Prototipo local</small>
        </div>
      </div>

      <div className="account-dd-divider" />

      <button type="button" className="account-dd-item">
        <Bell size={16} strokeWidth={1.75} />
        <span>Notificaciones</span>
        <i className="account-dd-dot" />
      </button>

      <button
        type="button"
        className="account-dd-item"
        onClick={() => {
          navigate('/profile')
          onClose()
        }}
      >
        <Settings size={16} strokeWidth={1.75} />
        <span>Configuración</span>
      </button>

      <button type="button" className="account-dd-item" onClick={toggleTheme}>
        {theme === 'dark' ? (
          <Sun size={16} strokeWidth={1.75} />
        ) : (
          <Moon size={16} strokeWidth={1.75} />
        )}
        <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>

      <div className="account-dd-divider" />

      <div className="account-dd-usage">
        <div className="account-dd-usage-head">
          <Gauge size={14} strokeWidth={1.75} />
          <span>Uso de tokens</span>
        </div>
        <TokenUsageBar />
      </div>

      <div className="account-dd-divider" />

      <button
        type="button"
        className="account-dd-item account-dd-item-danger"
        onClick={() => void logout()}
      >
        <LogOut size={16} strokeWidth={1.75} />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )
}
