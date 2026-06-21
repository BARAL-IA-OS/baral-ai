import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <TopBar />
        {children}
      </main>
    </div>
  )
}
