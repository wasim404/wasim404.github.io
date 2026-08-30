import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from './app.js'

test('GET /api/health returns an ok response', async () => {
  const response = await request(createApp()).get('/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok' })
})

test('register rejects malformed input before database access', async () => {
  const response = await request(createApp())
    .post('/api/auth/register')
    .set('Origin', 'http://localhost:5173')
    .send({ username: 'test', email: 'not-an-email', password: 'short' })

  assert.equal(response.status, 400)
  assert.equal(typeof response.body.error, 'string')
})

test('state-changing API requests reject an untrusted origin', async () => {
  const response = await request(createApp())
    .post('/api/auth/login')
    .set('Origin', 'https://attacker.example')
    .send({ login: 'person@example.com', password: 'password' })

  assert.equal(response.status, 403)
})

test('notes API requires an authenticated session', async () => {
  const app = createApp()
  const listResponse = await request(app).get('/api/notes')
  const createResponse = await request(app)
    .post('/api/notes')
    .set('Origin', 'http://localhost:5173')
    .send({ content: '测试记录' })
  const deleteResponse = await request(app)
    .delete('/api/notes/1665f34f-bf7c-47f1-a726-f35f79180fb1')
    .set('Origin', 'http://localhost:5173')

  assert.equal(listResponse.status, 401)
  assert.equal(createResponse.status, 401)
  assert.equal(deleteResponse.status, 401)
})
