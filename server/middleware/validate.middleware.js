export function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      return response.status(400).json({
        error: result.error.issues[0]?.message || '请求参数不正确',
      })
    }
    request.validatedBody = result.data
    next()
  }
}
