import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeDailyStats, mergeDatedObjects, mergeTasks } from './user-data.service.js'

test('task migration deduplicates ids and keeps the most recently updated copy', () => {
  const merged = mergeTasks(
    [{ id: 'a', title: 'server', updatedAt: '2026-01-01T00:00:00Z' }],
    [
      { id: 'a', title: 'local', updatedAt: '2026-01-02T00:00:00Z' },
      { id: 'b', title: 'new task', createdAt: '2026-01-01T00:00:00Z' },
    ],
  )

  assert.equal(merged.length, 2)
  assert.equal(merged.find((task) => task.id === 'a').title, 'local')
})

test('daily statistics merge without double-counting the same device snapshot', () => {
  const merged = mergeDailyStats(
    { '2026-08-13': { focusSeconds: 1200, completedTaskIds: ['a'] } },
    { '2026-08-13': { focusSeconds: 900, completedTaskIds: ['a', 'b'] } },
  )

  assert.equal(merged['2026-08-13'].focusSeconds, 1200)
  assert.deepEqual(merged['2026-08-13'].completedTaskIds, ['a', 'b'])
  assert.equal(merged['2026-08-13'].completedCount, 2)
})

test('dated records keep the newest update', () => {
  const merged = mergeDatedObjects(
    { day: { note: 'server', updatedAt: '2026-08-13T12:00:00Z' } },
    { day: { note: 'local', updatedAt: '2026-08-13T10:00:00Z' } },
  )
  assert.equal(merged.day.note, 'server')
})
