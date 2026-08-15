import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const migrationDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    const files = (await readdir(migrationDirectory))
      .filter((name) => name.endsWith('.sql'))
      .sort()

    for (const name of files) {
      const exists = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [name],
      )
      if (exists.rowCount) continue

      const sql = await readFile(join(migrationDirectory, name), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
        await client.query('COMMIT')
        console.log(`Applied migration ${name}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message)
  process.exit(1)
})
