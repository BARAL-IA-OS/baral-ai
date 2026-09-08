import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import baralLogoDark from '../../assets/login/logo baral dark.png'
import { navigationGroups } from '../../config/navigation'
import { getOnboardingProgress } from '../../features/business-dna/api'
import { useAuth } from '../../hooks/useAuth'
import { AccountDropdown } from './AccountDropdown'

const STORAGE_KEY = 'baral-sidebar-collapsed'

export function Sidebar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const email = user?.email ?? 'Sin sesión'
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = email.split('@')[0] || 'Usuario'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    let active = true
    const refresh = () => { void getOnboardingProgress()
      .then((status) => { if (active) setProgress(Math.min(100, Math.max(0, status.completionPercentage))) })
      .catch(() => { if (active) setProgress(null) }) }
    refresh()
    window.addEventListener('baral:dna-updated', refresh)
    return () => { active = false; window.removeEventListener('baral:dna-updated', refresh) }
  }, [pathname])

  const toggleCollapse = useCallback(() => {
    setCollapsed((current) => !current)
    setDropdownOpen(false)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey) }
  }, [mobileOpen])

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

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigationGroups.map((group) => (
            <div className="sidebar-section" key={group.label}>
              <span className="sidebar-section-title">
                <span>{group.label}</span>
                {group.label === 'ADN del negocio' && <span className="sidebar-dna-percentage" title={progress === null ? 'Porcentaje no disponible' : 'ADN completado'} aria-label={progress === null ? 'Porcentaje no disponible' : `ADN completado al ${progress}%`}>{progress === null ? '—' : `${progress}%`}</span>}
              </span>
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
                  <span className="sidebar-tooltip" aria-hidden="true">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-profile-container" ref={profileRef}>
          <button
            type="button"
            className="sidebar-profile"
            onClick={() => setDropdownOpen((current) => !current)}
            aria-expanded={dropdownOpen}
            aria-label="Abrir menú de cuenta"
          >
            <span className="sidebar-avatar">{initials}</span>
            <span className="sidebar-profile-copy"><strong>{displayName}</strong><small>Mi cuenta</small></span>
            <ChevronUp className="account-chevron" size={16} />
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
