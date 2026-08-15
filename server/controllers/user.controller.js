import { env } from '../config/env.js'
import { changePassword as changeUserPassword } from '../services/auth.service.js'
import { sessionCookieOptions } from '../services/session.service.js'

export async function changePassword(request, response, next) {
  try {
    const { currentPassword, newPassword } = request.validatedBody
    await changeUserPassword(request.user.id, currentPassword, newPassword)
    response.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: sessionCookieOptions.secure,
      sameSite: sessionCookieOptions.sameSite,
      path: '/',
    })
    response.json({ message: '密码已更新，请重新登录' })
  } catch (error) {
    next(error)
  }
}
