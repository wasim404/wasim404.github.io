import { env } from '../config/env.js'
import { findSessionUser } from '../db/session.repository.js'
import { hashSessionToken } from '../utils/crypto.js'

export async function requireAuth(request, response, next) {
  try {
    const token = request.cookies[env.SESSION_COOKIE_NAME]
    if (!token) return response.status(401).json({ error: '请先登录' })

    const user = await findSessionUser(hashSessionToken(token))
    if (!user) {
      response.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' })
      return response.status(401).json({ error: '登录状态已失效，请重新登录' })
    }

    request.user = user
    request.sessionToken = token
    next()
  } catch (error) {
    next(error)
  }
}

export async function optionalAuth(request, _response, next) {
  try {
    const token = request.cookies[env.SESSION_COOKIE_NAME]
    if (token) request.user = await findSessionUser(hashSessionToken(token))
    next()
  } catch (error) {
    next(error)
  }
}
