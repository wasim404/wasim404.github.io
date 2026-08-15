import { query } from './pool.js'

const publicFields = `
  id, username, email, email_verified, phone, phone_verified, created_at, updated_at
`

export async function findUserByEmail(email, client = { query }) {
  const result = await client.query(
    `SELECT *, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email],
  )
  return result.rows[0] || null
}

export async function findUserByUsername(username, client = { query }) {
  const result = await client.query(
    `SELECT *, password_hash FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  )
  return result.rows[0] || null
}

export async function findUserByLogin(login, client = { query }) {
  const result = await client.query(
    `SELECT *, password_hash FROM users
     WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)
     LIMIT 1`,
    [login],
  )
  return result.rows[0] || null
}

export async function findUserById(id, client = { query }) {
  const result = await client.query(
    `SELECT ${publicFields} FROM users WHERE id = $1 LIMIT 1`,
    [id],
  )
  return result.rows[0] || null
}

export async function createUser({ username, email, passwordHash }, client = { query }) {
  const result = await client.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, LOWER($2), $3)
     RETURNING ${publicFields}`,
    [username, email, passwordHash],
  )
  return result.rows[0]
}

export async function markEmailVerified(userId, email, client = { query }) {
  const result = await client.query(
    `UPDATE users
     SET email = LOWER($2), email_verified = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING ${publicFields}`,
    [userId, email],
  )
  return result.rows[0] || null
}

export async function markPhoneVerified(userId, phone, client = { query }) {
  const result = await client.query(
    `UPDATE users
     SET phone = $2, phone_verified = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING ${publicFields}`,
    [userId, phone],
  )
  return result.rows[0] || null
}

export async function updatePassword(userId, passwordHash, client = { query }) {
  await client.query(
    `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [userId, passwordHash],
  )
}
