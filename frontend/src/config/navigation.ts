import {
  BookOpen,
  Boxes,
  Camera,
  FolderOpen,
  Globe2,
  History,
  Megaphone,
  PackageSearch,
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
    label: 'Tu espacio creativo',
    items: [
      { to: '/campaigns', label: 'Campañas', Icon: Megaphone },
      { to: '/history', label: 'Historial', Icon: History },
    ],
  },
  {
    label: 'Creación',
    items: [
      { to: '/photoshoot', label: 'Photoshoot', Icon: Camera },
      { to: '/brand-book', label: 'Brand Book', Icon: BookOpen },
      { to: '/audit', label: 'Auditoría web', Icon: Globe2 },
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
    ],
  },
]
