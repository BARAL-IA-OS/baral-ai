const STORAGE_KEY = 'baral-welcome-seen'

export function hasSeenWelcome() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function markWelcomeSeen() {
  localStorage.setItem(STORAGE_KEY, 'true')
}
