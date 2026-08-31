import { query } from './pool.js'

const noteFields = `
  id,
  content,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export async function findNotesByUserId(userId, client = { query }) {
  const result = await client.query(
    `SELECT ${noteFields}
     FROM notes
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC`,
    [userId],
  )
  return result.rows
}

export async function insertNote(userId, content, client = { query }) {
  const result = await client.query(
    `INSERT INTO notes (user_id, content)
     VALUES ($1, $2)
     RETURNING ${noteFields}`,
    [userId, content],
  )
  return result.rows[0]
}

export async function updateNoteByUser(userId, noteId, content, client = { query }) {
  const result = await client.query(
    `UPDATE notes
     SET content = $3, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING ${noteFields}`,
    [userId, noteId, content],
  )
  return result.rows[0] ?? null
}

export async function deleteNoteByUser(userId, noteId, client = { query }) {
  const result = await client.query(
    `DELETE FROM notes
     WHERE user_id = $1 AND id = $2
     RETURNING id`,
    [userId, noteId],
  )
  return result.rowCount > 0
}
