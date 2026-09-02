export function notFoundHandler(_request, response) {
  response.status(404).json({ error: '接口不存在' })
}

export function errorHandler(error, _request, response, next) {
  void next
  const status = Number.isInteger(error.status) ? error.status : 500

  if (status >= 500) console.error(error)

  response.status(status).json({
    error: status >= 500 ? '服务器暂时无法处理请求' : error.message,
    ...(status < 500 && error.details ? error.details : {}),
  })
}
