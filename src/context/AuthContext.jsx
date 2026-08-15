import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { dataService } from '../services/dataService'
import {
  ACCOUNT_DATA_CHANGED_EVENT,
  ACCOUNT_CACHE_OWNER_KEY,
  applyAccountData,
  clearAccountDataCache,
  collectLocalAccountData,
  hasMeaningfulLocalData,
  migrationMarker,
  pendingMigrationKey,
  readPendingMigration,
} from '../services/accountData'
import DataMigrationPrompt from '../components/auth/DataMigrationPrompt'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataRevision, setDataRevision] = useState(0)
  const [migration, setMigration] = useState({ show: false, working: false, error: '' })

  const initializeAccountData = useCallback(async (account) => {
    const cacheOwner = localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY)
    if (cacheOwner && cacheOwner !== account.id) clearAccountDataCache()
    const localData = collectLocalAccountData()
    const pendingData = readPendingMigration(account.id)
    const alreadyHandled = localStorage.getItem(migrationMarker(account.id)) === 'true'

    if (
      pendingData ||
      (!alreadyHandled && !cacheOwner && hasMeaningfulLocalData(localData))
    ) {
      setMigration({ show: true, working: false, error: '' })
      return
    }

    const result = await dataService.getAll()
    applyAccountData(result.data, account.id)
    setDataRevision((current) => current + 1)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const result = await authService.getMe()
      setUser(result.user)
      await initializeAccountData(result.user)
      return result.user
    } catch (error) {
      if (error.status !== 401) console.error(error)
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [initializeAccountData])

  useEffect(() => {
    let isActive = true
    authService.getMe()
      .then(async (result) => {
        if (isActive) {
          setUser(result.user)
          await initializeAccountData(result.user)
        }
      })
      .catch((error) => {
        if (error.status !== 401) console.error(error)
        if (isActive) {
          if (error.status === 401 && localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY)) {
            clearAccountDataCache()
          }
          setUser(null)
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [initializeAccountData])

  const login = useCallback(async (identifier, password) => {
    const result = await authService.login(identifier, password)
    setUser(result.user)
    await initializeAccountData(result.user)
    return result.user
  }, [initializeAccountData])

  const logout = useCallback(async () => {
    await authService.logout()
    clearAccountDataCache()
    setUser(null)
    setMigration({ show: false, working: false, error: '' })
  }, [])

  useEffect(() => {
    if (!user || migration.show) return undefined
    const timers = new Map()

    function handleAccountDataChange(event) {
      const { dataKey } = event.detail
      window.clearTimeout(timers.get(dataKey))
      timers.set(dataKey, window.setTimeout(() => {
        dataService.save(event.detail.dataKey, event.detail.value).catch((error) => {
          console.error('Account data sync failed', error)
        })
        timers.delete(dataKey)
      }, 350))
    }

    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, handleAccountDataChange)
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, handleAccountDataChange)
    }
  }, [migration.show, user])

  const mergeLocalData = useCallback(async () => {
    if (!user) return
    setMigration({ show: true, working: true, error: '' })
    try {
      const pendingData = readPendingMigration(user.id)
      const result = await dataService.migrate(pendingData || collectLocalAccountData())
      applyAccountData(result.data, user.id)
      setDataRevision((current) => current + 1)
      localStorage.setItem(migrationMarker(user.id), 'true')
      localStorage.removeItem(pendingMigrationKey(user.id))
      setMigration({ show: false, working: false, error: '' })
    } catch (error) {
      setMigration({ show: true, working: false, error: error.message })
    }
  }, [user])

  const postponeMigration = useCallback(async () => {
    if (!user) return
    try {
      if (!readPendingMigration(user.id)) {
        localStorage.setItem(
          pendingMigrationKey(user.id),
          JSON.stringify(collectLocalAccountData()),
        )
      }
      const result = await dataService.getAll()
      applyAccountData(result.data, user.id)
      setDataRevision((current) => current + 1)
    } catch (error) {
      console.error(error)
    }
    setMigration({ show: false, working: false, error: '' })
  }, [user])

  const value = useMemo(
    () => ({ user, isLoading, dataRevision, login, logout, refreshUser }),
    [dataRevision, isLoading, login, logout, refreshUser, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {migration.show && (
        <DataMigrationPrompt
          isWorking={migration.working}
          error={migration.error}
          onMerge={mergeLocalData}
          onLater={postponeMigration}
        />
      )}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
