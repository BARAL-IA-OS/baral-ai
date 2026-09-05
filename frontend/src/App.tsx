import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import './styles/baral-eclipse.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/utilities.css'
import './styles/components/button.css'
import './styles/components/card.css'
import './styles/components/form.css'
import './styles/components/modal.css'
import './styles/components/table.css'
import './styles/components/primitives.css'
import './styles/features/business-dna.css'
import './styles/features/onboarding.css'
import './styles/features/clients.css'
import './styles/features/dashboard.css'
import './styles/omar-suite.css'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/Spinner'
import { getOnboardingProgress } from './features/business-dna/api'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'

const Analytics = lazy(() => import('./pages/Analytics').then((module) => ({ default: module.Analytics })))
const BrandBook = lazy(() => import('./pages/BrandBook').then((module) => ({ default: module.BrandBook })))
const BusinessAssets = lazy(() => import('./pages/BusinessAssets').then((module) => ({ default: module.BusinessAssets })))
const BusinessCatalog = lazy(() => import('./pages/BusinessCatalog').then((module) => ({ default: module.BusinessCatalog })))
const BusinessDNA = lazy(() => import('./pages/BusinessDNA').then((module) => ({ default: module.BusinessDNA })))
const Campaigns = lazy(() => import('./pages/Campaigns').then((module) => ({ default: module.Campaigns })))
const Clients = lazy(() => import('./pages/Clients').then((module) => ({ default: module.Clients })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const History = lazy(() => import('./pages/History').then((module) => ({ default: module.History })))
const Onboarding = lazy(() => import('./pages/Onboarding').then((module) => ({ default: module.Onboarding })))
const Photoshoot = lazy(() => import('./pages/Photoshoot').then((module) => ({ default: module.Photoshoot })))
const Preview = lazy(() => import('./pages/Preview').then((module) => ({ default: module.Preview })))
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })))
const QuickStudio = lazy(() => import('./pages/QuickStudio').then((module) => ({ default: module.QuickStudio })))
const Recipe = lazy(() => import('./pages/Recipe').then((module) => ({ default: module.Recipe })))
const Studio = lazy(() => import('./pages/Studio').then((module) => ({ default: module.Studio })))
const WebsiteAudit = lazy(() => import('./pages/WebsiteAudit').then((module) => ({ default: module.WebsiteAudit })))
const Welcome = lazy(() => import('./pages/Welcome').then((module) => ({ default: module.Welcome })))

function AuthenticatedRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function OnboardingRequired() {
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    getOnboardingProgress()
      .then((progress) => setCompleted(progress.completed))
      .catch(() => setCompleted(false))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!completed) return <Navigate to="/primeros-pasos" replace />
  return <Outlet />
}

function AppLayout() {
  return <Layout><Outlet /></Layout>
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  const [nextPath, setNextPath] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !user) return
    getOnboardingProgress()
      .then((progress) => setNextPath(progress.completed ? '/dashboard' : '/primeros-pasos'))
      .catch(() => setNextPath('/primeros-pasos'))
  }, [loading, user])

  if (!loading && !user) return <Navigate to="/login" replace />
  if (!nextPath) return <Spinner />
  return <Navigate to={nextPath} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/primeros-pasos" element={<Onboarding />} />
          <Route path="/onboarding" element={<Navigate to="/primeros-pasos" replace />} />
          <Route element={<OnboardingRequired />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/adn" element={<BusinessDNA />} />
              <Route path="/adn/catalogo" element={<BusinessCatalog />} />
              <Route path="/adn/recursos" element={<BusinessAssets />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/studio" element={<QuickStudio />} />
              <Route path="/studio/:campaignId" element={<Studio />} />
              <Route path="/photoshoot" element={<Photoshoot />} />
              <Route path="/brand-book" element={<BrandBook />} />
              <Route path="/audit" element={<WebsiteAudit />} />
              <Route path="/website-audit" element={<Navigate to="/audit" replace />} />
              <Route path="/recipe/:type" element={<Recipe />} />
              <Route path="/preview/:taskId" element={<Preview />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
