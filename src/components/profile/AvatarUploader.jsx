import { useEffect, useRef, useState } from 'react'
import { profileService } from '../../services/profileService'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function AvatarUploader({ profile, onUpdated }) {
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [failedImageUrl, setFailedImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function clearSelection() {
    setSelectedFile(null)
    setPreviewUrl('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function selectFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setError('仅支持 JPEG、PNG 或 WebP 图片。')
      event.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('头像不能超过 5MB。')
      event.target.value = ''
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function upload() {
    if (!selectedFile || isUploading) return
    setIsUploading(true)
    setError('')
    try {
      const result = await profileService.uploadAvatar(selectedFile)
      clearSelection()
      onUpdated(result.profile)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUploading(false)
    }
  }

  const displayedAvatar = previewUrl || profile.avatarUrl
  const imageFailed = displayedAvatar && failedImageUrl === displayedAvatar
  const initial = Array.from(profile.username || 'M')[0]?.toUpperCase()

  return (
    <section className="profile-section rounded-[22px] border border-[#384c7d]/10 bg-white/65 p-5 sm:p-6" aria-labelledby="avatar-title">
      <div className="flex flex-col items-center text-center">
        <h3 className="sr-only" id="avatar-title">头像</h3>
        <div className="grid size-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#e6ebf5] text-3xl font-bold text-[#667695] shadow-[0_10px_30px_rgba(52,66,102,0.13)] sm:size-28">
          {displayedAvatar && !imageFailed ? (
            <img
              className="size-full object-cover"
              src={displayedAvatar}
              alt="当前头像"
              onError={() => setFailedImageUrl(displayedAvatar)}
            />
          ) : (
            <span aria-label="默认头像">{initial}</span>
          )}
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectFile}
          disabled={isUploading}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-[#516995]/15 bg-[#edf1f8] px-4 py-2 text-xs font-bold text-[#425477] transition hover:bg-[#e3e9f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] disabled:cursor-wait disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {selectedFile ? '重新选择' : '更换头像'}
          </button>
          {selectedFile && (
            <>
              <button
                type="button"
                className="rounded-xl bg-[#5878c7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#4968b6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] disabled:cursor-wait disabled:opacity-50"
                onClick={upload}
                disabled={isUploading}
              >
                {isUploading ? '上传中…' : '确认上传'}
              </button>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-xs font-bold text-[#778297] hover:bg-[#edf0f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#778297] disabled:opacity-50"
                onClick={clearSelection}
                disabled={isUploading}
              >
                取消
              </button>
            </>
          )}
        </div>
        <p className="profile-muted mt-3 text-[11px] text-[#8992a7]">JPEG、PNG 或 WebP，最大 5MB</p>
        {error && <p className="mt-2 text-xs text-[#a44f48]" role="alert">{error}</p>}
      </div>
    </section>
  )
}
