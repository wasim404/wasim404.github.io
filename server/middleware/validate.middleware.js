export function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      const issue = result.error.issues[0]
      return response.status(400).json({
        error: issue?.code === 'unrecognized_keys'
          ? '请求包含不允许的字段'
          : issue?.message || '请求参数不正确',
      })
    }
    request.validatedBody = result.data
    next()
  }
}
