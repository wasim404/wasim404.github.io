export const FONT_SIZE_STORAGE_KEY = 'manoong-display-font-size'
export const DEFAULT_FONT_SIZE = 'standard'
export const THEME_STORAGE_KEY = 'manoong-display-theme'
export const DEFAULT_THEME = 'light'

export const FONT_SIZE_OPTIONS = [
  { id: 'smallest', label: '最小', scale: 0.92, previewSize: 13 },
  { id: 'small', label: '较小', scale: 0.96, previewSize: 14 },
  { id: 'standard', label: '标准', scale: 1, previewSize: 15 },
  { id: 'large', label: '较大', scale: 1.04, previewSize: 16 },
  { id: 'largest', label: '最大', scale: 1.08, previewSize: 17 },
]

export function getFontSizeOption(fontSizeId) {
  return (
    FONT_SIZE_OPTIONS.find((option) => option.id === fontSizeId) ||
    FONT_SIZE_OPTIONS.find((option) => option.id === DEFAULT_FONT_SIZE)
  )
}

export function readFontSizePreference() {
  if (typeof window === 'undefined') return DEFAULT_FONT_SIZE

  try {
    return getFontSizeOption(
      window.localStorage.getItem(FONT_SIZE_STORAGE_KEY),
    ).id
  } catch {
    return DEFAULT_FONT_SIZE
  }
}

export function readThemePreference() {
  if (typeof window === 'undefined') return DEFAULT_THEME

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function applyFontSizePreference(fontSizeId, { persist = true } = {}) {
  const option = getFontSizeOption(fontSizeId)

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.fontSize = option.id
    document.documentElement.style.setProperty(
      '--app-font-scale',
      String(option.scale),
    )
  }

  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, option.id)
    } catch {
      // The visual preference still applies for the current session.
    }
  }

  return option.id
}

export function applyThemePreference(theme, { persist = true } = {}) {
  const safeTheme = theme === 'dark' ? 'dark' : DEFAULT_THEME

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = safeTheme
  }

  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, safeTheme)
    } catch {
      // The visual preference still applies for the current session.
    }
  }

  return safeTheme
}

export function initializeDisplayPreferences() {
  applyFontSizePreference(readFontSizePreference(), { persist: false })
  applyThemePreference(readThemePreference(), { persist: false })
}
