import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import request from 'supertest'
import { hashPassword, verifyPassword } from './services/password.service.js'
import { hashVerificationCode } from './utils/crypto.js'

const origin = 'http://localhost:5173'
const registeredEmail = 'registered@example.com'
const oldPassword = 'Old-password-2026'
const newPassword = 'New-password-2027'
const users = new Map()
const verificationCodes = []
const sessions = new Map()
const sentResetEmails = []
let nextCodeId = 1
let failNextPasswordUpdate = false
let failNextVerificationCreate = false

function publicUser(user) {
  const { password_hash: _passwordHash, ...safeUser } = user
  void _passwordHash
  return safeUser
}

async function resetState() {
  users.clear()
  verificationCodes.length = 0
  sessions.clear()
  sentResetEmails.length = 0
  nextCodeId = 1
  failNextPasswordUpdate = false
  failNextVerificationCreate = false
  users.set(registeredEmail, {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'registered-user',
    email: registeredEmail,
    email_verified: true,
    phone: null,
    phone_verified: false,
    password_hash: await hashPassword(oldPassword),
    created_at: new Date(),
    updated_at: new Date(),
  })
}

const transactionClient = { query: async () => ({ rows: [] }) }

mock.module('./db/pool.js', {
  exports: {
    pool: {},
    query: async () => ({ rows: [] }),
    withTransaction: async (callback) => {
      const usersSnapshot = structuredClone([...users])
      const codesSnapshot = structuredClone(verificationCodes)
      const sessionsSnapshot = structuredClone([...sessions])
      try {
        return await callback(transactionClient)
      } catch (error) {
        users.clear()
        usersSnapshot.forEach(([key, value]) => users.set(key, value))
        verificationCodes.splice(0, verificationCodes.length, ...codesSnapshot)
        sessions.clear()
        sessionsSnapshot.forEach(([key, value]) => sessions.set(key, value))
        throw error
      }
    },
  },
})

mock.module('./db/user.repository.js', {
  exports: {
    findUserByEmail: async (email) => users.get(email.toLowerCase()) || null,
    findUserByUsername: async (username) => (
      [...users.values()].find((user) => user.username.toLowerCase() === username.toLowerCase()) || null
    ),
    findUserByLogin: async (login) => (
      [...users.values()].find((user) => (
        user.email.toLowerCase() === login.toLowerCase()
        || user.username.toLowerCase() === login.toLowerCase()
      )) || null
    ),
    findUserById: async (id) => {
      const user = [...users.values()].find((candidate) => candidate.id === id)
      return user ? publicUser(user) : null
    },
    createUser: async () => null,
    markEmailVerified: async () => null,
    markPhoneVerified: async () => null,
    updatePassword: async (userId, passwordHash) => {
      const user = [...users.values()].find((candidate) => candidate.id === userId)
      if (user) {
        user.password_hash = passwordHash
        user.updated_at = new Date()
      }
      if (failNextPasswordUpdate) {
        failNextPasswordUpdate = false
        throw new Error('simulated password update failure')
      }
    },
  },
})

mock.module('./db/verification.repository.js', {
  exports: {
    findLatestCode: async (type, target) => (
      verificationCodes.findLast((record) => (
        record.type === type && record.target === target && !record.used_at
      )) || null
    ),
    createCode: async ({ userId, type, target, codeHash, expiresAt }) => {
      if (failNextVerificationCreate) {
        failNextVerificationCreate = false
        throw new Error('simulated verification code persistence failure')
      }
      verificationCodes.forEach((record) => {
        if (record.type === type && record.target === target && !record.used_at) {
          record.used_at = new Date()
        }
      })
      const record = {
        id: String(nextCodeId++),
        user_id: userId,
        type,
        target,
        code_hash: codeHash,
        attempts: 0,
        expires_at: expiresAt,
        used_at: null,
        created_at: new Date(),
      }
      verificationCodes.push(record)
      return record
    },
    findCodeForUpdate: async (type, target) => (
      verificationCodes.findLast((record) => (
        record.type === type && record.target === target && !record.used_at
      )) || null
    ),
    incrementAttempts: async (id) => {
      const record = verificationCodes.find((candidate) => candidate.id === id)
      if (record) record.attempts += 1
    },
    markCodeUsed: async (id) => {
      const record = verificationCodes.find((candidate) => candidate.id === id)
      if (record) record.used_at = new Date()
    },
  },
})

mock.module('./db/session.repository.js', {
  exports: {
    createSession: async ({ userId, tokenHash, expiresAt }) => {
      sessions.set(tokenHash, { userId, expiresAt })
    },
    findSessionUser: async (tokenHash) => {
      const session = sessions.get(tokenHash)
      const user = session && session.expiresAt > new Date()
        ? [...users.values()].find((candidate) => candidate.id === session.userId)
        : null
      return user ? publicUser(user) : null
    },
    deleteSession: async (tokenHash) => sessions.delete(tokenHash),
    deleteUserSessions: async (userId) => {
      sessions.forEach((session, tokenHash) => {
        if (session.userId === userId) sessions.delete(tokenHash)
      })
    },
    deleteExpiredSessions: async () => {},
  },
})

mock.module('./services/email.service.js', {
  exports: {
    sendVerificationEmail: async () => ({ mocked: true }),
    sendPasswordResetEmail: async (email, code) => {
      const persisted = verificationCodes.some((record) => (
        record.type === 'password_reset_email'
        && record.target === email
        && !record.used_at
      ))
      sentResetEmails.push({ email, code, persisted })
      return { mocked: true }
    },
  },
})

const { createApp } = await import('./app.js')

function post(app, path, body) {
  return request(app).post(path).set('Origin', origin).send(body)
}

test('registered and unknown emails receive the same password-reset response', async () => {
  await resetState()
  const app = createApp()

  const registered = await post(app, '/api/auth/password/forgot', { email: registeredEmail })
  const unknown = await post(app, '/api/auth/password/forgot', { email: 'unknown@example.com' })

  assert.equal(registered.status, 200)
  assert.equal(unknown.status, 200)
  assert.deepEqual(registered.body, unknown.body)
  assert.equal(sentResetEmails.length, 1)
  assert.equal(sentResetEmails[0].email, registeredEmail)
  assert.match(sentResetEmails[0].code, /^\d{6}$/)
  assert.equal(sentResetEmails[0].persisted, true)
  assert.equal(verificationCodes[0].type, 'password_reset_email')
  assert.notEqual(verificationCodes[0].code_hash, sentResetEmails[0].code)
})

test('wrong and email-verification codes cannot reset a password', async () => {
  await resetState()
  const app = createApp()
  const user = users.get(registeredEmail)
  const emailCode = '123456'
  verificationCodes.push({
    id: String(nextCodeId++),
    user_id: user.id,
    type: 'email_verify',
    target: registeredEmail,
    code_hash: hashVerificationCode('email_verify', registeredEmail, emailCode),
    attempts: 0,
    expires_at: new Date(Date.now() + 60_000),
    used_at: null,
    created_at: new Date(),
  })

  const mixedType = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code: emailCode,
    password: newPassword,
  })
  assert.equal(mixedType.status, 400)

  await post(app, '/api/auth/password/forgot', { email: registeredEmail })
  const wrongCode = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code: '999999',
    password: newPassword,
  })
  assert.equal(wrongCode.status, 400)
  assert.equal(verificationCodes.findLast((record) => record.type === 'password_reset_email').attempts, 1)
  assert.equal(await verifyPassword(user.password_hash, oldPassword), true)
})

test('expired password-reset codes cannot change the password', async () => {
  await resetState()
  const app = createApp()
  await post(app, '/api/auth/password/forgot', { email: registeredEmail })
  const codeRecord = verificationCodes.findLast((record) => record.type === 'password_reset_email')
  codeRecord.expires_at = new Date(Date.now() - 1)

  const response = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code: sentResetEmails[0].code,
    password: newPassword,
  })

  assert.equal(response.status, 400)
  assert.equal(await verifyPassword(users.get(registeredEmail).password_hash, oldPassword), true)
})

test('a valid code changes the password once and invalidates existing sessions', async () => {
  await resetState()
  const app = createApp()
  const oldLogin = await post(app, '/api/auth/login', {
    login: registeredEmail,
    password: oldPassword,
  })
  const oldCookie = oldLogin.headers['set-cookie'][0].split(';')[0]

  await post(app, '/api/auth/password/forgot', { email: registeredEmail })
  const code = sentResetEmails[0].code
  const changed = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code,
    password: newPassword,
  })

  assert.equal(changed.status, 200)
  assert.deepEqual(changed.body, { message: '密码重置成功，请使用新密码登录' })
  const user = users.get(registeredEmail)
  assert.notEqual(user.password_hash, newPassword)
  assert.equal(await verifyPassword(user.password_hash, newPassword), true)
  assert.equal(await verifyPassword(user.password_hash, oldPassword), false)

  const reused = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code,
    password: 'Another-password-2028',
  })
  assert.equal(reused.status, 400)

  const oldPasswordLogin = await post(app, '/api/auth/login', {
    login: registeredEmail,
    password: oldPassword,
  })
  const newPasswordLogin = await post(app, '/api/auth/login', {
    login: registeredEmail,
    password: newPassword,
  })
  const oldSession = await request(app).get('/api/auth/me').set('Cookie', oldCookie)

  assert.equal(oldPasswordLogin.status, 401)
  assert.equal(newPasswordLogin.status, 200)
  assert.equal(oldSession.status, 401)
})

test('a password update failure rolls back and leaves the valid code reusable', async () => {
  await resetState()
  const app = createApp()
  await post(app, '/api/auth/password/forgot', { email: registeredEmail })
  const code = sentResetEmails[0].code
  failNextPasswordUpdate = true

  const failed = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code,
    password: newPassword,
  })

  assert.equal(failed.status, 500)
  assert.equal(await verifyPassword(users.get(registeredEmail).password_hash, oldPassword), true)
  const rolledBackCode = verificationCodes.findLast(
    (record) => record.type === 'password_reset_email',
  )
  assert.equal(rolledBackCode.used_at, null)

  const retried = await post(app, '/api/auth/password/reset', {
    email: registeredEmail,
    code,
    password: newPassword,
  })

  assert.equal(retried.status, 200)
  assert.equal(await verifyPassword(users.get(registeredEmail).password_hash, newPassword), true)
  assert.ok(verificationCodes.findLast(
    (record) => record.type === 'password_reset_email',
  ).used_at)
})

test('a reset code is not emailed when database persistence fails', async () => {
  await resetState()
  const app = createApp()
  failNextVerificationCreate = true

  const response = await post(app, '/api/auth/password/forgot', {
    email: registeredEmail,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, {
    message: '如果该邮箱已注册，验证码将很快发送。',
  })
  assert.equal(verificationCodes.length, 0)
  assert.equal(sentResetEmails.length, 0)
})
