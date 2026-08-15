import * as users from '../db/user.repository.js'
import { withTransaction } from '../db/pool.js'
import { getUserByEmail } from '../services/auth.service.js'
import { sendVerificationEmail } from '../services/email.service.js'
import { sendVerificationSms } from '../services/sms.service.js'
import { consumeVerificationCode, issueVerificationCode } from '../services/verification.service.js'
import { HttpError } from '../utils/http-error.js'

const genericEmailMessage = '如果该邮箱可以验证，验证码将很快发送'

export async function sendEmailCode(request, response, next) {
  try {
    const { email } = request.validatedBody
    const account = await getUserByEmail(email)
    const isBinding = Boolean(request.user && request.user.email?.toLowerCase() !== email)

    if (isBinding && account && account.id !== request.user.id) {
      return response.json({ message: genericEmailMessage })
    }
    if (!isBinding && (!account || account.email_verified)) {
      return response.json({ message: genericEmailMessage })
    }

    await issueVerificationCode({
      userId: isBinding ? request.user.id : account.id,
      type: isBinding ? 'email_bind' : 'email_verify',
      target: email,
      send: sendVerificationEmail,
    })
    response.json({ message: genericEmailMessage })
  } catch (error) {
    next(error)
  }
}

export async function verifyEmail(request, response, next) {
  try {
    const { email, code } = request.validatedBody
    const account = await getUserByEmail(email)
    const isBinding = Boolean(request.user && request.user.email?.toLowerCase() !== email)
    const userId = isBinding ? request.user.id : account?.id
    if (!userId) throw new HttpError(400, '验证码无效或已过期')

    const verified = await withTransaction(async (client) => {
      const isValid = await consumeVerificationCode({
        type: isBinding ? 'email_bind' : 'email_verify',
        target: email,
        code,
        userId,
      }, client)
      if (!isValid) return false
      await users.markEmailVerified(userId, email, client)
      return true
    })
    if (!verified) throw new HttpError(400, '验证码无效或已过期')
    response.json({ message: '邮箱验证成功' })
  } catch (error) {
    if (error.code === '23505') next(new HttpError(409, '该邮箱已被使用'))
    else next(error)
  }
}

export async function sendPhoneCode(request, response, next) {
  try {
    const { phone } = request.validatedBody
    await issueVerificationCode({
      userId: request.user.id,
      type: 'phone_verify',
      target: phone,
      send: sendVerificationSms,
    })
    response.json({ message: '验证码已发送' })
  } catch (error) {
    next(error)
  }
}

export async function verifyPhone(request, response, next) {
  try {
    const { phone, code } = request.validatedBody
    const verified = await withTransaction(async (client) => {
      const isValid = await consumeVerificationCode({
        type: 'phone_verify', target: phone, code, userId: request.user.id,
      }, client)
      if (!isValid) return false
      await users.markPhoneVerified(request.user.id, phone, client)
      return true
    })
    if (!verified) throw new HttpError(400, '验证码无效或已过期')
    response.json({ message: '手机号验证成功' })
  } catch (error) {
    if (error.code === '23505') next(new HttpError(409, '该手机号已被使用'))
    else next(error)
  }
}
