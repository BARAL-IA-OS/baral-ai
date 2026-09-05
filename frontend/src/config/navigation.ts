import {
  BarChart3,
  Boxes,
  FolderOpen,
  History,
  LayoutDashboard,
  PackageSearch,
  Sparkles,
  Users,
} from 'lucide-react'

export interface NavigationItem {
  to: string
  label: string
  Icon: React.ElementType
  end?: boolean
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Trabajo',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { to: '/studio', label: 'Estudio', Icon: Sparkles },
      { to: '/history', label: 'Historial', Icon: History },
    ],
  },
  {
    label: 'ADN del negocio',
    items: [
      { to: '/adn', label: 'Resumen', Icon: Boxes, end: true },
      { to: '/adn/catalogo', label: 'Catálogo', Icon: PackageSearch },
      { to: '/adn/recursos', label: 'Recursos', Icon: FolderOpen },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/clients', label: 'Clientes 360', Icon: Users },
      { to: '/analytics', label: 'Reportes y Analítica', Icon: BarChart3 },
    ],
  },
]
