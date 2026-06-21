import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import './App.css'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'
import { hasBrandBrain } from './hooks/useBrandBrain'
import { Analytics } from './pages/Analytics'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Preview } from './pages/Preview'
import { Recipe } from './pages/Recipe'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)
  const [nextPath, setNextPath] = useState('/onboarding')

  useEffect(() => {
    if (loading || !user) {
      return
    }

    hasBrandBrain()
      .then((exists) => setNextPath(exists ? '/dashboard' : '/onboarding'))
      .catch(() => setNextPath('/onboarding'))
      .finally(() => setReady(true))
  }, [loading, user])

  if (!loading && !user) {
    return <Navigate to="/login" replace />
  }

  if (!ready) {
    return <Spinner />
  }

  return <Navigate to={nextPath} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recipe/:type" element={<Recipe />} />
          <Route path="/preview/:taskId" element={<Preview />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
