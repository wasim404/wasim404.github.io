import { dataKeySchema } from '../validation/data.schemas.js'
import { mergeLocalData, readUserData, writeUserData } from '../services/user-data.service.js'

export async function getData(request, response, next) {
  try {
    response.json({ data: await readUserData(request.user.id) })
  } catch (error) {
    next(error)
  }
}

export async function putData(request, response, next) {
  try {
    const keyResult = dataKeySchema.safeParse(request.params.key)
    if (!keyResult.success) return response.status(404).json({ error: '数据类型不存在' })
    const result = await writeUserData(
      request.user.id,
      keyResult.data,
      request.validatedBody.data,
    )
    response.json({ data: result.data, version: Number(result.version) })
  } catch (error) {
    next(error)
  }
}

export async function migrateData(request, response, next) {
  try {
    response.json({
      message: '本机数据已合并到账户',
      data: await mergeLocalData(request.user.id, request.validatedBody.data),
    })
  } catch (error) {
    next(error)
  }
}
