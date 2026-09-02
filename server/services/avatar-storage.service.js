import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { basename, dirname, join, resolve } from 'node:path'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const uploadDirectory = resolve(env.AVATAR_UPLOAD_DIR)
const publicBaseUrl = env.AVATAR_PUBLIC_BASE_URL.replace(/\/+$/, '')
const allowedDeclaredTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function detectImageType(buffer) {
  if (
    buffer.length >= 33 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
    buffer.toString('ascii', 12, 16) === 'IHDR' &&
    buffer.readUInt32BE(buffer.length - 12) === 0 &&
    buffer.toString('ascii', buffer.length - 8, buffer.length - 4) === 'IEND'
  ) return { extension: 'png', mimeType: 'image/png' }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff &&
    buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
  ) return { extension: 'jpg', mimeType: 'image/jpeg' }

  if (
    buffer.length >= 20 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP' &&
    buffer.readUInt32LE(4) + 8 === buffer.length &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(buffer.toString('ascii', 12, 16))
  ) return { extension: 'webp', mimeType: 'image/webp' }

  return null
}

export function getAvatarPublicPath() {
  if (!publicBaseUrl.startsWith('/')) return null
  return publicBaseUrl
}

export function getAvatarUploadDirectory() {
  return uploadDirectory
}

export async function storeAvatar(userId, file) {
  if (!file?.buffer?.length) throw new HttpError(400, '请选择头像图片')
  if (file.size > MAX_AVATAR_BYTES) throw new HttpError(413, '头像不能超过 5MB')
  if (!allowedDeclaredTypes.has(file.mimetype)) {
    throw new HttpError(400, '头像仅支持 JPEG、PNG 或 WebP 格式')
  }

  const detected = detectImageType(file.buffer)
  if (!detected || detected.mimeType !== file.mimetype) {
    throw new HttpError(400, '图片内容与文件格式不符')
  }

  await mkdir(uploadDirectory, { recursive: true, mode: 0o750 })
  const fileName = `${userId}-${randomUUID()}.${detected.extension}`
  const filePath = join(uploadDirectory, fileName)
  await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o640 })

  return { avatarUrl: `${publicBaseUrl}/${fileName}`, filePath }
}

function managedAvatarPath(avatarUrl, userId) {
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith(`${publicBaseUrl}/`)) return null
  const fileName = avatarUrl.slice(publicBaseUrl.length + 1)
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ownedName = new RegExp(
    `^${escapedUserId}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(?:jpg|png|webp)$`,
    'i',
  )
  if (basename(fileName) !== fileName || !ownedName.test(fileName)) return null

  const filePath = resolve(uploadDirectory, fileName)
  return dirname(filePath) === uploadDirectory ? filePath : null
}

export async function deleteManagedAvatar(avatarUrl, userId) {
  const filePath = managedAvatarPath(avatarUrl, userId)
  if (!filePath) return false
  try {
    await unlink(filePath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}
