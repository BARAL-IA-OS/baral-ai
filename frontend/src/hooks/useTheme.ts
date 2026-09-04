import { useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

// Versioned key makes Baral Eclipse the first-run theme even for users whose
// browser persisted the former light default under `baral-theme`.
const STORAGE_KEY = 'baral-theme-eclipse'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' }
}

/** Initialize theme on app load (call once in main.tsx) */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const theme: Theme = saved === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
}
