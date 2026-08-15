import { env } from '../config/env.js'
import * as authService from '../services/auth.service.js'
import { issueSession, revokeSession, sessionCookieOptions } from '../services/session.service.js'
import { issueVerificationCode } from '../services/verification.service.js'
import { sendVerificationEmail } from '../services/email.service.js'

export async function register(request, response, next) {
  try {
    const user = await authService.registerWithEmail(request.validatedBody)
    let emailSent = true
    try {
      await issueVerificationCode({
        userId: user.id,
        type: 'email_verify',
        target: user.email,
        send: sendVerificationEmail,
      })
    } catch (emailError) {
      emailSent = false
      console.error('Registration email delivery failed', emailError)
    }
    response.status(201).json({
      message: emailSent
        ? '注册成功，请完成邮箱验证'
        : '账户已创建，但邮件暂未送达，请重新发送验证码',
      emailSent,
      user,
    })
  } catch (error) {
    next(error)
  }
}

export async function login(request, response, next) {
  try {
    const user = await authService.authenticateWithEmail(request.validatedBody)
    await revokeSession(request.cookies[env.SESSION_COOKIE_NAME])
    const token = await issueSession(user.id)
    response.cookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions)
    response.json({ user })
  } catch (error) {
    next(error)
  }
}

export async function logout(request, response, next) {
  try {
    await revokeSession(request.sessionToken)
    response.clearCookie(env.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: sessionCookieOptions.secure,
      sameSite: sessionCookieOptions.sameSite,
      path: '/',
    })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
}

export function me(request, response) {
  response.json({ user: request.user })
}
