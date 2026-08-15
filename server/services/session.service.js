import * as sessions from '../db/session.repository.js'
import { env, isProduction } from '../config/env.js'
import { createSessionToken, hashSessionToken } from '../utils/crypto.js'

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
}

export async function issueSession(userId) {
  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + sessionCookieOptions.maxAge)
  await sessions.createSession({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  })
  return token
}

export async function revokeSession(token) {
  if (token) await sessions.deleteSession(hashSessionToken(token))
}
