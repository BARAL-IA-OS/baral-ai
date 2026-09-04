import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import './App.css'
import './styles/baral-eclipse.css'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'
import { hasBrandBrain } from './hooks/useBrandBrain'
import { hasSeenWelcome } from './hooks/useWelcomeSeen'
import { Analytics } from './pages/Analytics'
import { Clients } from './pages/Clients'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Preview } from './pages/Preview'
import { Profile } from './pages/Profile'
import { Recipe } from './pages/Recipe'
import { Studio } from './pages/Studio'
import { Welcome } from './pages/Welcome'

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

function ProtectedPlainRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function BrandBrainRequired() {
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    hasBrandBrain()
      .then(setExists)
      .catch(() => setExists(false))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Spinner />
  }

  if (!exists) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)
  const [nextPath, setNextPath] = useState('/onboarding')
  const welcomeSeen = hasSeenWelcome()

  useEffect(() => {
    if (loading || !user) {
      return
    }

    hasBrandBrain()
      .then((exists) => {
        if (exists) {
          setNextPath('/dashboard')
        } else if (!welcomeSeen) {
          setNextPath('/welcome')
        } else {
          setNextPath('/onboarding')
        }
      })
      .catch(() => setNextPath('/onboarding'))
      .finally(() => setReady(true))
  }, [loading, user, welcomeSeen])

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
        <Route element={<ProtectedPlainRoute />}>
          <Route path="/welcome" element={<Welcome />} />
        </Route>
        <Route element={<ProtectedRoutes />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<BrandBrainRequired />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/recipe/:type" element={<Recipe />} />
            <Route path="/preview/:taskId" element={<Preview />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
