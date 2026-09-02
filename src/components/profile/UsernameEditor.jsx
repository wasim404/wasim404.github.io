import { useEffect, useMemo, useState } from 'react'
import { profileService } from '../../services/profileService'

const USERNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u

function availabilityLabel(nextAvailableAt, now) {
  const remainingMinutes = Math.max(0, Math.ceil((nextAvailableAt - now) / 60000))
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  if (!hours) return `距离下次可修改还有 ${minutes} 分钟`
  return `距离下次可修改还有 ${hours} 小时 ${minutes} 分钟`
}

export default function UsernameEditor({ profile, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(profile.username)
  const [now, setNow] = useState(() => Date.now())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const nextAvailableAt = useMemo(() => {
    if (!profile.usernameUpdatedAt) return 0
    return new Date(profile.usernameUpdatedAt).getTime() + 24 * 60 * 60 * 1000
  }, [profile.usernameUpdatedAt])
  const isLocked = nextAvailableAt > now

  useEffect(() => {
    if (!isLocked) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [isLocked])

  async function saveUsername(event) {
    event.preventDefault()
    const cleanUsername = username.trim()
    setError('')
    if (cleanUsername.length < 2 || cleanUsername.length > 30 || !USERNAME_PATTERN.test(cleanUsername)) {
      setError('用户名需为 2–30 个文字、数字、下划线或短横线。')
      return
    }
    if (cleanUsername === profile.username) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const result = await profileService.updateUsername(cleanUsername)
      await onUpdated(result.profile)
      setIsEditing(false)
    } catch (requestError) {
      const retryAt = requestError.details?.nextAvailableAt
      setError(retryAt
        ? `${requestError.message}，${new Date(retryAt).toLocaleString('zh-CN')} 后可再次修改。`
        : requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="profile-section rounded-[22px] border border-[#384c7d]/10 bg-white/65 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-sm font-bold text-[#33415f]">用户名</h3>
          {!isEditing && <p className="mt-2 text-base font-bold text-[#27334e]">{profile.username}</p>}
        </div>
        {!isLocked && !isEditing && (
          <button
            type="button"
            className="shrink-0 rounded-xl border border-[#5878c7]/20 px-3 py-2 text-xs font-bold text-[#5878c7] hover:bg-[#eef3ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7]"
            onClick={() => setIsEditing(true)}
          >
            修改用户名
          </button>
        )}
      </div>

      {isEditing && (
        <form className="mt-4" onSubmit={saveUsername}>
          <label className="sr-only" htmlFor="profile-username">新用户名</label>
          <input
            id="profile-username"
            className="profile-input w-full rounded-xl border border-[#526991]/20 bg-[#f9fafc] px-3.5 py-3 text-sm text-[#27334e] outline-none transition focus:border-[#5878c7] focus:ring-4 focus:ring-[#5878c7]/10"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength="2"
            maxLength="30"
            autoComplete="username"
            disabled={isSaving}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="rounded-xl px-3 py-2 text-xs font-bold text-[#778297] hover:bg-[#edf0f5]" onClick={() => { setUsername(profile.username); setIsEditing(false); setError('') }} disabled={isSaving}>取消</button>
            <button type="submit" className="rounded-xl bg-[#5878c7] px-4 py-2 text-xs font-bold text-white hover:bg-[#4968b6] disabled:cursor-wait disabled:opacity-50" disabled={isSaving}>{isSaving ? '保存中…' : '保存用户名'}</button>
          </div>
        </form>
      )}

      {isLocked && (
        <p className="profile-muted mt-2 text-xs leading-5 text-[#7a849d]">
          {availabilityLabel(nextAvailableAt, now)}
        </p>
      )}
      {!isLocked && !isEditing && (
        <p className="profile-muted mt-2 text-xs text-[#7a849d]">每 24 小时可修改一次</p>
      )}
      {error && <p className="mt-3 text-xs text-[#a44f48]" role="alert">{error}</p>}
    </section>
  )
}
