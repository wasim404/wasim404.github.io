import assert from 'node:assert/strict'
import test from 'node:test'
import {
  claimUsernameChange,
  findProfileByUserId,
  setGenderOnce,
  updateCanonicalUsername,
} from './profile.repository.js'

test('profile reads are always scoped by authenticated user id', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rows: [] }
    },
  }

  await findProfileByUserId('user-a', client)
  assert.match(calls[0].text, /ON CONFLICT \(user_id\) DO NOTHING/)
  assert.match(calls[1].text, /WHERE p\.user_id = \$1/)
  assert.deepEqual(calls[1].params, ['user-a'])
})

test('username cooldown is claimed atomically using database time', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rows: [{ username_updated_at: new Date() }] }
    },
  }

  await claimUsernameChange('user-a', client)
  assert.match(calls[0].text, /username_updated_at <= NOW\(\) - INTERVAL '24 hours'/)
  assert.match(calls[0].text, /WHERE user_id = \$1/)
  assert.deepEqual(calls[0].params, ['user-a'])
})

test('canonical username update only targets the authenticated user', async () => {
  const calls = []
  const client = { async query(text, params) { calls.push({ text, params }); return { rows: [] } } }
  await updateCanonicalUsername('user-a', 'new-name', client)
  assert.match(calls[0].text, /UPDATE users/)
  assert.match(calls[0].text, /WHERE id = \$1/)
  assert.deepEqual(calls[0].params, ['user-a', 'new-name'])
})

test('gender uses a conditional update so it can only be set once', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      if (/UPDATE user_profiles/.test(text)) return { rowCount: 1, rows: [{ gender: params[1] }] }
      return { rows: [] }
    },
  }

  const updated = await setGenderOnce('user-a', 'male', client)
  assert.equal(updated, true)
  assert.match(calls[1].text, /gender IS NULL AND gender_locked_at IS NULL/)
  assert.deepEqual(calls[1].params, ['user-a', 'male'])
})
