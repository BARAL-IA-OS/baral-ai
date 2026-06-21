import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'Historial' },
  { to: '/analytics', label: 'Analiticas' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <strong>Baral AI</strong>
      <nav>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
