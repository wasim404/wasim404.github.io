import assert from 'node:assert/strict'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const testDirectory = join(tmpdir(), `manoong-avatar-tests-${process.pid}`)
process.env.AVATAR_UPLOAD_DIR = testDirectory
process.env.AVATAR_PUBLIC_BASE_URL = '/test-avatars'

const {
  deleteManagedAvatar,
  storeAvatar,
} = await import('./avatar-storage.service.js')

const userId = '1665f34f-bf7c-47f1-a726-f35f79180fb1'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test.after(async () => {
  await rm(testDirectory, { recursive: true, force: true })
})

test('avatar storage validates, stores and deletes an owned image', async () => {
  const stored = await storeAvatar(userId, {
    buffer: png,
    size: png.length,
    mimetype: 'image/png',
  })
  assert.match(stored.avatarUrl, /^\/test-avatars\/1665f34f-/)
  await access(stored.filePath)
  assert.equal(await deleteManagedAvatar(stored.avatarUrl, userId), true)
  await assert.rejects(access(stored.filePath))
})

test('avatar storage rejects MIME spoofing and ignores unowned files', async () => {
  await assert.rejects(
    storeAvatar(userId, {
      buffer: Buffer.from('not an image'),
      size: 12,
      mimetype: 'image/png',
    }),
    /图片内容与文件格式不符/,
  )

  await mkdir(testDirectory, { recursive: true })
  const unrelatedPath = join(testDirectory, 'unrelated.png')
  await writeFile(unrelatedPath, png)
  assert.equal(await deleteManagedAvatar('/test-avatars/unrelated.png', userId), false)
  await access(unrelatedPath)
})
