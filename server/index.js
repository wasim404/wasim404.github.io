import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'

const server = createApp().listen(env.PORT, env.HOST, () => {
  console.log(`MANOONG API listening on http://${env.HOST}:${env.PORT}`)
})

function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
