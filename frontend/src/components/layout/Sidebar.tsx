import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  History,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import baralLogo from '../../assets/login/logo baral dark.png'
import { useAuth } from '../../hooks/useAuth'

const items = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/studio',    label: 'Estudio',    Icon: Sparkles },
  { to: '/history',   label: 'Historial',  Icon: History },
  { to: '/analytics', label: 'Analíticas', Icon: BarChart3 },
] as const

export function Sidebar() {
  const { user, logout } = useAuth()
  const email = user?.email ?? 'Sin sesión'
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={baralLogo} alt="Baral AI" />
      </div>

      <nav>
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-section-label">CUENTA</div>
      <nav className="sidebar-secondary-nav">
        <button type="button" className="sidebar-action">
          <Bell size={16} strokeWidth={1.75} />
          Notificaciones
          <i className="sidebar-action-dot" />
        </button>
        <span className="sidebar-link-disabled" aria-disabled="true">
          <Settings size={16} strokeWidth={1.75} />
          Configuración
          <small>Pronto</small>
        </span>
        {user ? (
          <button type="button" className="sidebar-action sidebar-action-danger" onClick={() => void logout()}>
            <LogOut size={16} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        ) : null}
      </nav>

      <div className="sidebar-stars" aria-hidden="true" />

      <div className="sidebar-profile">
        <span className="sidebar-avatar">{initials}</span>
        <span className="sidebar-profile-copy">
          <strong>{email}</strong>
          <small>Prototipo local</small>
        </span>
        <ChevronDown size={14} className="sidebar-chevron" />
      </div>
    </aside>
  )
}
