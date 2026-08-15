import { query } from './pool.js'

export async function createSession(
  { userId, tokenHash, expiresAt },
  client = { query },
) {
  await client.query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  )
}

export async function findSessionUser(tokenHash, client = { query }) {
  const result = await client.query(
    `SELECT u.id, u.username, u.email, u.email_verified,
            u.phone, u.phone_verified, u.created_at, u.updated_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  )
  return result.rows[0] || null
}

export async function deleteSession(tokenHash, client = { query }) {
  await client.query('DELETE FROM sessions WHERE session_token_hash = $1', [tokenHash])
}

export async function deleteUserSessions(userId, client = { query }) {
  await client.query('DELETE FROM sessions WHERE user_id = $1', [userId])
}

export async function deleteExpiredSessions(client = { query }) {
  await client.query('DELETE FROM sessions WHERE expires_at <= NOW()')
}
