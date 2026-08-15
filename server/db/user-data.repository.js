import { query } from './pool.js'

export async function getAllUserData(userId, client = { query }) {
  const result = await client.query(
    `SELECT data_key, data, version, updated_at
     FROM user_data
     WHERE user_id = $1`,
    [userId],
  )
  return result.rows
}

export async function upsertUserData(userId, dataKey, data, client = { query }) {
  const result = await client.query(
    `INSERT INTO user_data (user_id, data_key, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (user_id, data_key) DO UPDATE
       SET data = EXCLUDED.data,
           version = user_data.version + 1,
           updated_at = NOW()
     RETURNING data_key, data, version, updated_at`,
    [userId, dataKey, JSON.stringify(data)],
  )
  return result.rows[0]
}
