import { NavLink } from 'react-router-dom'
import baralLogo from '../../assets/login/logo baral dark.png'
import { useAuth } from '../../hooks/useAuth'
import { AppIcon } from '../ui/AppIcon'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/history', label: 'Historial', icon: 'calendar' },
  { to: '/analytics', label: 'Analíticas', icon: 'analytics' },
] as const

export function Sidebar() {
  const { user } = useAuth()
  const email = user?.email ?? 'Sin sesión'
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <img src={baralLogo} alt="" />
        </span>
      </div>
      <nav>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <AppIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-stars" aria-hidden="true" />
      <div className="sidebar-profile">
        <span className="sidebar-avatar">{initials}</span>
        <span className="sidebar-profile-copy">
          <strong>{email}</strong>
          <small>Prototipo local</small>
        </span>
        <span className="sidebar-chevron">⌄</span>
      </div>
    </aside>
  )
}
