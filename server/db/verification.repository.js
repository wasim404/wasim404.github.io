import { query } from './pool.js'

export async function findLatestCode(type, target, client = { query }) {
  const result = await client.query(
    `SELECT * FROM verification_codes
     WHERE type = $1 AND target = $2 AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [type, target],
  )
  return result.rows[0] || null
}

export async function createCode(
  { userId = null, type, target, codeHash, expiresAt },
  client = { query },
) {
  await client.query(
    `UPDATE verification_codes
     SET used_at = NOW()
     WHERE type = $1 AND target = $2 AND used_at IS NULL`,
    [type, target],
  )
  const result = await client.query(
    `INSERT INTO verification_codes
       (user_id, type, target, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, target, codeHash, expiresAt],
  )
  return result.rows[0]
}

export async function findCodeForUpdate(type, target, client) {
  const result = await client.query(
    `SELECT * FROM verification_codes
     WHERE type = $1 AND target = $2 AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [type, target],
  )
  return result.rows[0] || null
}

export async function incrementAttempts(id, client = { query }) {
  await client.query(
    'UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1',
    [id],
  )
}

export async function markCodeUsed(id, client = { query }) {
  await client.query(
    'UPDATE verification_codes SET used_at = NOW() WHERE id = $1',
    [id],
  )
}
