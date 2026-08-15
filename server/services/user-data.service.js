import { withTransaction } from '../db/pool.js'
import { getAllUserData, upsertUserData } from '../db/user-data.repository.js'

const emptyData = {
  tasks: [],
  daily_stats: {},
  reflections: {},
  preferences: {},
  checkins: {},
}

export function mergeTasks(serverTasks, localTasks) {
  const byId = new Map()
  for (const task of [...serverTasks, ...localTasks]) {
    if (!task || typeof task !== 'object') continue
    const id = String(task.id || '')
    if (!id) continue
    const current = byId.get(id)
    const taskTime = new Date(task.updatedAt || task.createdAt || 0).getTime()
    const currentTime = new Date(current?.updatedAt || current?.createdAt || 0).getTime()
    if (!current || taskTime >= currentTime) byId.set(id, task)
  }
  return [...byId.values()]
}

export function mergeDailyStats(serverStats, localStats) {
  const merged = { ...serverStats }
  for (const [date, localDay] of Object.entries(localStats || {})) {
    const serverDay = merged[date] || {}
    const completedTaskIds = [
      ...new Set([
        ...(serverDay.completedTaskIds || []),
        ...(localDay?.completedTaskIds || []),
      ]),
    ]
    merged[date] = {
      ...serverDay,
      ...localDay,
      completedTaskIds,
      completedCount: Math.max(
        completedTaskIds.length,
        Number(serverDay.completedCount) || 0,
        Number(localDay?.completedCount) || 0,
      ),
      focusSeconds: Math.max(
        Number(serverDay.focusSeconds) || 0,
        Number(localDay?.focusSeconds) || 0,
      ),
      focusSessions: Math.max(
        Number(serverDay.focusSessions) || 0,
        Number(localDay?.focusSessions) || 0,
      ),
    }
  }
  return merged
}

export function mergeDatedObjects(serverValue, localValue) {
  const merged = { ...serverValue }
  for (const [key, localEntry] of Object.entries(localValue || {})) {
    const serverEntry = merged[key]
    const localTime = new Date(localEntry?.updatedAt || 0).getTime()
    const serverTime = new Date(serverEntry?.updatedAt || 0).getTime()
    if (!serverEntry || localTime >= serverTime) merged[key] = localEntry
  }
  return merged
}

export async function readUserData(userId) {
  const rows = await getAllUserData(userId)
  return rows.reduce(
    (data, row) => ({ ...data, [row.data_key]: row.data }),
    { ...emptyData },
  )
}

export function writeUserData(userId, dataKey, data) {
  return upsertUserData(userId, dataKey, data)
}

export async function mergeLocalData(userId, localData) {
  return withTransaction(async (client) => {
    const rows = await getAllUserData(userId, client)
    const server = rows.reduce(
      (data, row) => ({ ...data, [row.data_key]: row.data }),
      { ...emptyData },
    )
    const merged = {
      tasks: mergeTasks(server.tasks, localData.tasks || []),
      daily_stats: mergeDailyStats(server.daily_stats, localData.daily_stats || {}),
      reflections: mergeDatedObjects(server.reflections, localData.reflections || {}),
      preferences: { ...server.preferences, ...(localData.preferences || {}) },
      checkins: { ...server.checkins, ...(localData.checkins || {}) },
    }

    for (const [key, value] of Object.entries(merged)) {
      await upsertUserData(userId, key, value, client)
    }
    return merged
  })
}
