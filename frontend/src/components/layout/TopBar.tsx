import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div>
        <span>Prototipo local</span>
        <strong>{user?.email ?? 'Sin sesion'}</strong>
      </div>
      {user ? (
        <Button type="button" variant="secondary" onClick={() => void logout()}>
          Salir
        </Button>
      ) : null}
    </header>
  )
}
