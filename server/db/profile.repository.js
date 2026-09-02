import { query } from './pool.js'

const profileFields = `
  p.avatar_url AS "avatarUrl",
  u.username,
  p.username_updated_at AS "usernameUpdatedAt",
  TO_CHAR(p.birthday, 'YYYY-MM-DD') AS birthday,
  p.gender,
  p.gender_locked_at AS "genderLockedAt",
  p.bio
`

export async function ensureProfile(userId, client = { query }) {
  await client.query(
    `INSERT INTO user_profiles (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  )
}

export async function findProfileByUserId(userId, client = { query }) {
  await ensureProfile(userId, client)
  const result = await client.query(
    `SELECT ${profileFields}
     FROM user_profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1
     LIMIT 1`,
    [userId],
  )
  return result.rows[0] || null
}

export async function findProfileForUpdate(userId, client) {
  await ensureProfile(userId, client)
  const result = await client.query(
    `SELECT ${profileFields}
     FROM user_profiles p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1
     FOR UPDATE OF p, u`,
    [userId],
  )
  return result.rows[0] || null
}

export async function updateProfileDetails(userId, details, client = { query }) {
  await ensureProfile(userId, client)
  const values = [userId]
  const assignments = []

  if (Object.hasOwn(details, 'birthday')) {
    values.push(details.birthday)
    assignments.push(`birthday = $${values.length}`)
  }
  if (Object.hasOwn(details, 'bio')) {
    values.push(details.bio)
    assignments.push(`bio = $${values.length}`)
  }

  await client.query(
    `UPDATE user_profiles
     SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE user_id = $1`,
    values,
  )
  return findProfileByUserId(userId, client)
}

export async function claimUsernameChange(userId, client) {
  const result = await client.query(
    `UPDATE user_profiles
     SET username_updated_at = NOW(), updated_at = NOW()
     WHERE user_id = $1
       AND (
         username_updated_at IS NULL
         OR username_updated_at <= NOW() - INTERVAL '24 hours'
       )
     RETURNING username_updated_at`,
    [userId],
  )
  return result.rows[0] || null
}

export async function findNextUsernameChangeAt(userId, client) {
  const result = await client.query(
    `SELECT username_updated_at + INTERVAL '24 hours' AS "nextAvailableAt"
     FROM user_profiles
     WHERE user_id = $1`,
    [userId],
  )
  return result.rows[0]?.nextAvailableAt || null
}

export async function updateCanonicalUsername(userId, username, client) {
  await client.query(
    `UPDATE users
     SET username = $2, updated_at = NOW()
     WHERE id = $1`,
    [userId, username],
  )
}

export async function setGenderOnce(userId, gender, client) {
  await ensureProfile(userId, client)
  const result = await client.query(
    `UPDATE user_profiles
     SET gender = $2, gender_locked_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND gender IS NULL AND gender_locked_at IS NULL
     RETURNING gender`,
    [userId, gender],
  )
  return result.rowCount > 0
}

export async function replaceAvatarUrl(userId, avatarUrl, client) {
  await ensureProfile(userId, client)
  const current = await client.query(
    `SELECT avatar_url AS "avatarUrl"
     FROM user_profiles
     WHERE user_id = $1
     FOR UPDATE`,
    [userId],
  )
  await client.query(
    `UPDATE user_profiles
     SET avatar_url = $2, updated_at = NOW()
     WHERE user_id = $1`,
    [userId, avatarUrl],
  )
  return current.rows[0]?.avatarUrl || null
}
