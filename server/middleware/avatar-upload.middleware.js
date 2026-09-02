import multer from 'multer'
import { MAX_AVATAR_BYTES } from '../services/avatar-storage.service.js'
import { HttpError } from '../utils/http-error.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_BYTES,
    files: 1,
    fields: 4,
  },
})

export function receiveAvatar(request, response, next) {
  upload.single('avatar')(request, response, (error) => {
    if (!error) return next()
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(413, '头像不能超过 5MB'))
      }
      return next(new HttpError(400, '头像上传请求不正确'))
    }
    return next(new HttpError(400, '无法读取头像文件'))
  })
}
