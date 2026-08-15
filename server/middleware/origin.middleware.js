import { env } from '../config/env.js'

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

export function verifyRequestOrigin(request, response, next) {
  if (safeMethods.has(request.method)) return next()

  const origin = request.get('origin')
  if (!origin || origin !== env.CLIENT_ORIGIN) {
    return response.status(403).json({ error: '请求来源无效' })
  }
  next()
}
