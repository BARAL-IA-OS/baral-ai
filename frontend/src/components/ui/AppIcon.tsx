interface AppIconProps {
  name:
    | 'activity'
    | 'analytics'
    | 'arrow'
    | 'bag'
    | 'bell'
    | 'brain'
    | 'calendar'
    | 'campaign'
    | 'check'
    | 'dashboard'
    | 'email'
    | 'file'
    | 'hand'
    | 'logout'
    | 'rocket'
    | 'spark'
    | 'star'
    | 'upload'
    | 'users'
  size?: number
}

export function AppIcon({ name, size = 22 }: AppIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const paths = {
    activity: <path d="M3 12h4l2.3-7 4.2 14 2.3-7H21" />,
    analytics: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
        <path d="M2 20h22" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l1 12H4L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    brain: (
      <>
        <path d="M9.5 4.5A3 3 0 0 0 4 6a3.5 3.5 0 0 0 .7 6.8A4 4 0 0 0 9 19.5" />
        <path d="M14.5 4.5A3 3 0 0 1 20 6a3.5 3.5 0 0 1-.7 6.8 4 4 0 0 1-4.3 6.7" />
        <path d="M9 4v16M15 4v16M9 9H6.5M15 8h2.5M9 15H6M15 14h3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    campaign: (
      <>
        <path d="m4 13 13-6v10L4 13Z" />
        <path d="M17 10a4 4 0 0 0 0 4M6 14l1 6h4l-2-7" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    dashboard: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6" />
      </>
    ),
    hand: (
      <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4-6a1.5 1.5 0 0 1 3 0v6-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v5c0 5-3 8-8 8h-1c-3 0-5-2-7-5l-1-2a1.7 1.7 0 0 1 3-1l2 2" />
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
      </>
    ),
    rocket: (
      <>
        <path d="M14 5c3-3 6-2 6-2s1 3-2 6l-6 6-4-4 6-6Z" />
        <path d="m9 8-4 1-2 3 5 1M15 14l-1 5-3 2-1-5M6 18l-3 3" />
      </>
    ),
    spark: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 15v5h16v-5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}
