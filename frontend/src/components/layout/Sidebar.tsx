import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import baralLogoDark from '../../assets/login/logo baral dark.png'
import { navigationGroups } from '../../config/navigation'
import { getOnboardingProgress } from '../../features/business-dna/api'
import { useAuth } from '../../hooks/useAuth'
import { AccountDropdown } from './AccountDropdown'

const STORAGE_KEY = 'baral-sidebar-collapsed'

export function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const email = user?.email ?? 'Sin sesión'
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = email.split('@')[0] || 'Usuario'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    getOnboardingProgress()
      .then((status) => setProgress(status.completionPercentage))
      .catch(() => setProgress(0))
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((current) => !current)
    setDropdownOpen(false)
  }, [])

  return (
    <>
      <button
        type="button"
        className="mobile-menu-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir navegación"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="sidebar-logo-mark"><img src={baralLogoDark} alt="Baral AI" /></span>
            <strong>Baral AI</strong>
          </div>
          <button
            type="button"
            className="sidebar-toggle sidebar-desktop-toggle"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            type="button"
            className="sidebar-toggle sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar navegación"
          >
            <X size={18} />
          </button>
        </div>

        <button type="button" className="sidebar-progress-card" onClick={() => navigate('/adn')}>
          <span className="sidebar-progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
            <small>{progress}</small>
          </span>
          <span>ADN del negocio</span>
          <strong>{progress}%</strong>
        </button>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigationGroups.map((group) => (
            <div className="sidebar-section" key={group.label}>
              <span className="sidebar-section-title">{group.label}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.Icon size={18} strokeWidth={1.75} />
                  <span className="sidebar-label">{item.label}</span>
                  <span className="sidebar-tooltip">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer-actions">
          <button type="button" aria-label="Configuración" onClick={() => navigate('/profile')}>
            <Settings size={18} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Notificaciones" className="sidebar-bell">
            <Bell size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="sidebar-profile-container" ref={profileRef}>
          <button
            type="button"
            className="sidebar-profile"
            onClick={() => setDropdownOpen((current) => !current)}
            aria-expanded={dropdownOpen}
          >
            <span className="sidebar-avatar">{initials}</span>
            <span className="sidebar-profile-copy"><strong>{displayName}</strong><small>Administrador</small></span>
          </button>
          {dropdownOpen && (
            <AccountDropdown
              email={email}
              initials={initials}
              onClose={() => setDropdownOpen(false)}
              anchorRef={profileRef}
            />
          )}
        </div>
      </aside>
    </>
  )
}
