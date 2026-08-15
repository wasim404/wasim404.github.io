import { withTransaction } from '../db/pool.js'
import * as sessions from '../db/session.repository.js'
import * as users from '../db/user.repository.js'
import { HttpError } from '../utils/http-error.js'
import { hashPassword, verifyPassword } from './password.service.js'

export async function registerWithEmail({ username, email, password }) {
  const [existing, existingUsername] = await Promise.all([
    users.findUserByEmail(email),
    users.findUserByUsername(username),
  ])
  if (existing) throw new HttpError(409, '该邮箱无法用于注册')
  if (existingUsername) throw new HttpError(409, '该用户名已被使用')

  const passwordHash = await hashPassword(password)
  try {
    return await users.createUser({ username, email, passwordHash })
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, '该邮箱无法用于注册')
    throw error
  }
}

export function getUserByEmail(email) {
  return users.findUserByEmail(email)
}

export async function authenticateWithEmail({ login, password }) {
  const user = await users.findUserByLogin(login)
  if (!user || !(await verifyPassword(user.password_hash, password))) {
    throw new HttpError(401, '用户名、邮箱或密码错误')
  }
  if (!user.email_verified) {
    throw new HttpError(401, '登录信息无效或账户尚未完成验证')
  }
  const { password_hash: _passwordHash, ...safeUser } = user
  void _passwordHash
  return safeUser
}

export async function changePassword(userId, currentPassword, nextPassword) {
  await withTransaction(async (client) => {
    const result = await client.query(
      'SELECT password_hash FROM users WHERE id = $1 FOR UPDATE',
      [userId],
    )
    const user = result.rows[0]
    if (!user || !(await verifyPassword(user.password_hash, currentPassword))) {
      throw new HttpError(400, '当前密码不正确')
    }
    const nextHash = await hashPassword(nextPassword)
    await users.updatePassword(userId, nextHash, client)
    await sessions.deleteUserSessions(userId, client)
  })
}
