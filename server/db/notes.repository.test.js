import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deleteNoteByUser,
  findNotesByUserId,
  insertNote,
  updateNoteByUser,
} from './notes.repository.js'

test('note list is always filtered by the authenticated user id', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rows: [] }
    },
  }

  await findNotesByUserId('user-a', client)

  assert.match(calls[0].text, /WHERE user_id = \$1/)
  assert.deepEqual(calls[0].params, ['user-a'])
})

test('note creation gets its owner id from the server call', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rows: [{ id: 'note-a', content: params[1] }] }
    },
  }

  const note = await insertNote('user-a', '记录内容', client)

  assert.match(calls[0].text, /INSERT INTO notes \(user_id, content\)/)
  assert.deepEqual(calls[0].params, ['user-a', '记录内容'])
  assert.equal(note.id, 'note-a')
})

test('note editing matches both user id and note id', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rows: [{ id: params[1], content: params[2] }] }
    },
  }

  const note = await updateNoteByUser('user-a', 'note-a', '更新后的内容', client)

  assert.match(calls[0].text, /UPDATE notes/)
  assert.match(calls[0].text, /WHERE user_id = \$1 AND id = \$2/)
  assert.deepEqual(calls[0].params, ['user-a', 'note-a', '更新后的内容'])
  assert.equal(note.content, '更新后的内容')
})

test('note deletion matches both user id and note id', async () => {
  const calls = []
  const client = {
    async query(text, params) {
      calls.push({ text, params })
      return { rowCount: 1, rows: [{ id: params[1] }] }
    },
  }

  const deleted = await deleteNoteByUser('user-a', 'note-a', client)

  assert.match(calls[0].text, /WHERE user_id = \$1 AND id = \$2/)
  assert.deepEqual(calls[0].params, ['user-a', 'note-a'])
  assert.equal(deleted, true)
})
