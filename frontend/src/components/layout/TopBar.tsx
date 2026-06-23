import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { AppIcon } from '../ui/AppIcon'

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div>
        <span>Prototipo local</span>
        <strong>{user?.email ?? 'Sin sesión'}</strong>
      </div>
      <div className="topbar-actions">
        <button className="notification-button" type="button" aria-label="Notificaciones">
          <AppIcon name="bell" size={21} />
          <span />
        </button>
        {user ? (
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Salir
            <AppIcon name="logout" size={18} />
          </Button>
        ) : null}
      </div>
    </header>
  )
}
