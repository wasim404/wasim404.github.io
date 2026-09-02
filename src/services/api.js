export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body && !isFormData
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      payload?.error || '请求失败，请稍后重试',
      response.status,
      payload || {},
    )
  }
  return payload
}
