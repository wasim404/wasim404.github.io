const STORAGE_MAP = {
  'manoong-schedule-tasks': 'tasks',
  'manoong-daily-stats': 'daily_stats',
  'manoong-daily-reflections': 'reflections',
}

export const ACCOUNT_DATA_CHANGED_EVENT = 'manoong-account-data-changed'
export const ACCOUNT_DATA_APPLIED_EVENT = 'manoong-account-data-applied'
export const ACCOUNT_CACHE_OWNER_KEY = 'manoong-account-cache-owner'

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || '') ?? fallback
  } catch {
    return fallback
  }
}

export function collectLocalAccountData() {
  const checkins = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('manoong-daily-checkin-')) {
      const storedValue = localStorage.getItem(key)
      checkins[key.slice('manoong-daily-checkin-'.length)] =
        storedValue === 'true' ? true : storedValue
    }
  }

  return {
    tasks: readJson('manoong-schedule-tasks', []),
    daily_stats: readJson('manoong-daily-stats', {}),
    reflections: readJson('manoong-daily-reflections', {}),
    preferences: {
      focus: readJson('manoong-focus-preferences', {}),
      focusGoalMinutes: Number(localStorage.getItem('manoong-focus-goal-minutes')) || undefined,
    },
    checkins,
  }
}

export function hasMeaningfulLocalData(data) {
  return (
    data.tasks.length > 0 ||
    Object.keys(data.daily_stats).length > 0 ||
    Object.keys(data.reflections).length > 0 ||
    Object.keys(data.checkins).length > 0 ||
    Object.keys(data.preferences.focus || {}).length > 0 ||
    Boolean(data.preferences.focusGoalMinutes)
  )
}

export function clearAccountDataCache() {
  localStorage.removeItem('manoong-schedule-tasks')
  localStorage.removeItem('manoong-daily-stats')
  localStorage.removeItem('manoong-daily-reflections')
  localStorage.removeItem('manoong-focus-preferences')
  localStorage.removeItem('manoong-focus-goal-minutes')
  localStorage.removeItem('manoong-energy')
  const checkinKeys = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('manoong-daily-checkin-')) checkinKeys.push(key)
  }
  checkinKeys.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem(ACCOUNT_CACHE_OWNER_KEY)
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_APPLIED_EVENT))
}

export function applyAccountData(data, userId) {
  localStorage.setItem('manoong-schedule-tasks', JSON.stringify(data.tasks || []))
  localStorage.setItem('manoong-daily-stats', JSON.stringify(data.daily_stats || {}))
  localStorage.setItem('manoong-daily-reflections', JSON.stringify(data.reflections || {}))
  localStorage.setItem('manoong-focus-preferences', JSON.stringify(data.preferences?.focus || {}))

  localStorage.removeItem('manoong-focus-goal-minutes')
  localStorage.removeItem('manoong-energy')
  if (data.preferences?.focusGoalMinutes) {
    localStorage.setItem('manoong-focus-goal-minutes', String(data.preferences.focusGoalMinutes))
  }
  const oldCheckinKeys = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('manoong-daily-checkin-')) oldCheckinKeys.push(key)
  }
  oldCheckinKeys.forEach((key) => localStorage.removeItem(key))
  for (const [date, checked] of Object.entries(data.checkins || {})) {
    if (checked) {
      localStorage.setItem(
        `manoong-daily-checkin-${date}`,
        typeof checked === 'string' ? checked : 'true',
      )
    }
  }
  if (userId) localStorage.setItem(ACCOUNT_CACHE_OWNER_KEY, userId)
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_APPLIED_EVENT))
}

function accountValueForStorageKey(storageKey, value) {
  const dataKey = STORAGE_MAP[storageKey]
  if (dataKey) {
    try {
      return { dataKey, value: JSON.parse(value) }
    } catch {
      return null
    }
  }
  if (storageKey === 'manoong-focus-preferences') {
    try {
      return {
        dataKey: 'preferences',
        value: { ...collectLocalAccountData().preferences, focus: JSON.parse(value) },
      }
    } catch {
      return null
    }
  }
  if (storageKey === 'manoong-focus-goal-minutes') {
    return {
      dataKey: 'preferences',
      value: { ...collectLocalAccountData().preferences, focusGoalMinutes: Number(value) },
    }
  }
  if (storageKey.startsWith('manoong-daily-checkin-')) {
    return { dataKey: 'checkins', value: collectLocalAccountData().checkins }
  }
  return null
}

export function setAccountStorageItem(storageKey, value) {
  localStorage.setItem(storageKey, value)
  const detail = accountValueForStorageKey(storageKey, value)
  if (detail) window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT, { detail }))
}

export function migrationMarker(userId) {
  return `manoong-local-data-migrated-${userId}`
}

export function pendingMigrationKey(userId) {
  return `manoong-pending-local-data-${userId}`
}

export function readPendingMigration(userId) {
  return readJson(pendingMigrationKey(userId), null)
}
