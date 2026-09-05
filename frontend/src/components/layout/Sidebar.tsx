import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Camera,
  Dna,
  FolderOpen,
  Globe2,
  History,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react'
import baralLogoDark from '../../assets/login/logo baral dark.png'
import { useAuth } from '../../hooks/useAuth'
import { getOnboardingStatus } from '../../hooks/useBrandBrain'
import { AccountDropdown } from './AccountDropdown'

const STORAGE_KEY = 'baral-sidebar-collapsed'

const strategyItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campañas', Icon: Megaphone },
  { to: '/history', label: 'Historial', Icon: History },
] as const

const dnaItems = [
  { to: '/onboarding?force=true', label: 'Resumen', Icon: Dna },
  { to: '', label: 'Catálogo', Icon: Boxes, disabled: true },
  { to: '', label: 'Recursos', Icon: FolderOpen, disabled: true },
] as const

const creationItems = [
  { to: '/photoshoot', label: 'Photoshoot', Icon: Camera },
  { to: '/brand-book', label: 'Brand Book', Icon: BookOpen },
  { to: '/audit', label: 'Auditoría web', Icon: Globe2 },
] as const

const insightItems = [
  { to: '/clients', label: 'Clientes', Icon: Users },
  { to: '/analytics', label: 'Analítica', Icon: BarChart3 },
] as const

export function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const email = user?.email ?? 'Sin sesión'
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = email.split('@')[0] || 'Usuario'

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [brandBrainComplete, setBrandBrainComplete] = useState(false)
  const [clientsComplete, setClientsComplete] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    getOnboardingStatus()
      .then((status) => {
        setBrandBrainComplete(status.brandBrainComplete)
        setClientsComplete(status.clientsComplete)
      })
      .catch(() => {
        setBrandBrainComplete(false)
        setClientsComplete(false)
      })
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev)
    setDropdownOpen(false)
  }, [])

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev)
  }, [])

  const completedSteps = 1 + (brandBrainComplete ? 1 : 0) + (clientsComplete ? 1 : 0)

  function renderItem(
    item: {
      to: string
      label: string
      Icon: React.ElementType
      meta?: string
      disabled?: boolean
    },
  ) {
    if (item.disabled) {
      return <button key={item.label} type="button" className="sidebar-disabled-item" title="Se habilitará con el módulo ADN de Jhamil" disabled><item.Icon size={16} /><span className="sidebar-label">{item.label}</span><small>Próx.</small></button>
    }
    return (
      <NavLink key={`${item.to}-${item.label}`} to={item.to} title={collapsed ? item.label : undefined}>
        <item.Icon size={16} strokeWidth={1.85} />
        <span className="sidebar-label">{item.label}</span>
        {item.meta && <small className="sidebar-item-meta">{item.meta}</small>}
        <span className="sidebar-tooltip">{item.label}</span>
      </NavLink>
    )
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-logo-mark">
            <img src={baralLogoDark} alt="Baral AI" />
          </span>
          <strong>Baral AI</strong>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <div className="sidebar-progress-card">
        <span className={`sidebar-progress-ring ${brandBrainComplete ? 'is-complete' : ''}`} />
        <span>Configuración</span>
        <strong>{completedSteps}/3</strong>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-head">
            <span>Trabajo</span>
            <button type="button" aria-label="Nueva estrategia">
              <Sparkles size={14} strokeWidth={1.7} />
            </button>
          </div>
          {strategyItems.map(renderItem)}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">ADN del negocio</span>
          {dnaItems.map(renderItem)}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">Creación</span>
          {creationItems.map(renderItem)}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">Gestión</span>
          {insightItems.map(renderItem)}
        </div>
      </nav>

      <div className="sidebar-footer-actions">
        <button type="button" aria-label="Configuración" onClick={() => navigate('/profile')}>
          <Settings size={16} strokeWidth={1.75} />
        </button>
        <button type="button" aria-label="Notificaciones" className="sidebar-bell">
          <Bell size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="sidebar-profile-container" ref={profileRef}>
        <button
          type="button"
          className="sidebar-profile"
          onClick={toggleDropdown}
          aria-expanded={dropdownOpen}
        >
          <span className="sidebar-avatar">{initials}</span>
          <span className="sidebar-profile-copy">
            <strong>{displayName}</strong>
            <small>Administrador</small>
          </span>
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
  )
}
