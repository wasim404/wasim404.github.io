import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { profileService } from '../../services/profileService'
import AvatarUploader from './AvatarUploader'
import BioEditor from './BioEditor'
import BirthdayPicker from './BirthdayPicker'
import GenderSelector from './GenderSelector'
import { genderLabel } from './profileConstants'
import UsernameEditor from './UsernameEditor'
import './ProfileModal.css'

export default function ProfileModal({ onClose }) {
  const { refreshUser } = useAuth()
  const closeButtonRef = useRef(null)
  const genderBackButtonRef = useRef(null)
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState(null)
  const [birthday, setBirthday] = useState('')
  const [bio, setBio] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsMessage, setDetailsMessage] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [confirmGender, setConfirmGender] = useState('')
  const [isSavingGender, setIsSavingGender] = useState(false)
  const [genderError, setGenderError] = useState('')

  async function loadProfile() {
    setLoadState('loading')
    setLoadError('')
    try {
      const result = await profileService.get()
      setProfile(result.profile)
      setBirthday(result.profile.birthday || '')
      setBio(result.profile.bio || '')
      setLoadState('loaded')
    } catch (error) {
      setLoadError(error.message)
      setLoadState('error')
    }
  }

  useEffect(() => {
    let isActive = true
    profileService.get()
      .then((result) => {
        if (!isActive) return
        setProfile(result.profile)
        setBirthday(result.profile.birthday || '')
        setBio(result.profile.bio || '')
        setLoadState('loaded')
      })
      .catch((error) => {
        if (!isActive) return
        setLoadError(error.message)
        setLoadState('error')
      })
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      if (confirmGender) setConfirmGender('')
      else onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [confirmGender, onClose])

  useEffect(() => {
    if (confirmGender) genderBackButtonRef.current?.focus()
  }, [confirmGender])

  function updateLoadedProfile(nextProfile) {
    setProfile(nextProfile)
  }

  async function updateUsername(nextProfile) {
    updateLoadedProfile(nextProfile)
    await refreshUser()
  }

  async function saveDetails(event) {
    event.preventDefault()
    if (!profile || isSavingDetails || [...bio].length > 30) return
    setIsSavingDetails(true)
    setDetailsError('')
    setDetailsMessage('')
    try {
      const result = await profileService.update({
        birthday: birthday || null,
        bio,
      })
      updateLoadedProfile(result.profile)
      setBirthday(result.profile.birthday || '')
      setBio(result.profile.bio || '')
      setDetailsMessage('个人信息已保存。')
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function saveGender() {
    if (!confirmGender || isSavingGender) return
    setIsSavingGender(true)
    setGenderError('')
    try {
      const result = await profileService.setGender(confirmGender)
      updateLoadedProfile(result.profile)
      setSelectedGender('')
      setConfirmGender('')
    } catch (error) {
      setGenderError(error.message)
      setConfirmGender('')
    } finally {
      setIsSavingGender(false)
    }
  }

  return createPortal(
    <div
      className="profile-modal-backdrop fixed inset-0 z-[1400] grid place-items-center overflow-y-auto bg-[#1f283e]/45 p-4 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !confirmGender) onClose()
      }}
    >
      <section
        className="profile-modal relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[820px] overflow-y-auto rounded-[28px] border border-[#485e91]/15 bg-[#fbfaf6] text-[#27334e] shadow-[0_35px_100px_rgba(30,39,62,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-description"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-[#384c7d]/10 bg-[#fbfaf6]/95 px-5 py-5 backdrop-blur-xl sm:px-8 sm:py-6">
          <div>
            <h2 className="m-0 text-2xl font-bold tracking-[-0.035em]" id="profile-modal-title">个人资料</h2>
            <p className="profile-muted mt-2 text-xs text-[#7a849d]" id="profile-modal-description">管理你的头像、用户名和个人信息</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf1f8] text-xl text-[#74809a] transition hover:bg-[#e1e7f2] hover:text-[#3f4e6d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7]"
            onClick={onClose}
            aria-label="关闭个人资料"
          >
            ×
          </button>
        </header>

        {loadState === 'loading' && (
          <div className="grid min-h-[430px] place-items-center px-6 py-16" aria-live="polite">
            <div className="text-center">
              <span className="profile-loading mx-auto block size-9 rounded-full border-2 border-[#5878c7]/20 border-t-[#5878c7]" aria-hidden="true" />
              <p className="profile-muted mt-4 text-sm text-[#7a849d]">正在读取个人资料…</p>
            </div>
          </div>
        )}

        {loadState === 'error' && (
          <div className="grid min-h-[360px] place-items-center px-6 py-16 text-center">
            <div>
              <p className="text-sm font-bold text-[#a44f48]" role="alert">{loadError}</p>
              <button type="button" className="mt-5 rounded-xl bg-[#5878c7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4968b6]" onClick={loadProfile}>重新加载</button>
            </div>
          </div>
        )}

        {loadState === 'loaded' && profile && (
          <div className="grid gap-4 p-4 sm:p-7">
            <AvatarUploader profile={profile} onUpdated={updateLoadedProfile} />
            <div className="grid gap-4 md:grid-cols-2">
              <UsernameEditor
                key={`${profile.username}-${profile.usernameUpdatedAt || 'new'}`}
                profile={profile}
                onUpdated={updateUsername}
              />
              <GenderSelector
                gender={profile.gender}
                selectedGender={selectedGender}
                onSelect={(value) => { setSelectedGender(value); setGenderError('') }}
                onRequestConfirm={() => setConfirmGender(selectedGender)}
                error={genderError}
              />
            </div>

            <form className="profile-section rounded-[22px] border border-[#384c7d]/10 bg-white/65 p-5 sm:p-6" onSubmit={saveDetails}>
              <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                <BirthdayPicker value={birthday} onChange={setBirthday} disabled={isSavingDetails} />
                <BioEditor value={bio} onChange={setBio} disabled={isSavingDetails} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#384c7d]/10 pt-5">
                <div className="mr-auto min-h-5">
                  {detailsError && <p className="text-xs text-[#a44f48]" role="alert">{detailsError}</p>}
                  {detailsMessage && <p className="text-xs font-semibold text-[#517665]" role="status">{detailsMessage}</p>}
                </div>
                <button type="button" className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#778297] hover:bg-[#edf0f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#778297]" onClick={onClose} disabled={isSavingDetails}>取消</button>
                <button type="submit" className="rounded-xl bg-[#5878c7] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(88,120,199,0.2)] transition hover:bg-[#4968b6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] disabled:cursor-wait disabled:opacity-50" disabled={isSavingDetails || [...bio].length > 30}>{isSavingDetails ? '保存中…' : '保存修改'}</button>
              </div>
            </form>
          </div>
        )}
      </section>

      {confirmGender && (
        <div className="fixed inset-0 z-[1410] grid place-items-center bg-[#1f283e]/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSavingGender) setConfirmGender('') }}>
          <section className="profile-confirm w-full max-w-[430px] rounded-[25px] border border-[#485e91]/15 bg-[#fbfaf6] p-6 text-[#27334e] shadow-[0_30px_90px_rgba(30,39,62,0.3)] sm:p-8" role="alertdialog" aria-modal="true" aria-labelledby="gender-confirm-title" aria-describedby="gender-confirm-description">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#edf1f8] text-xl text-[#5878c7]" aria-hidden="true">!</span>
            <h3 className="mb-0 mt-5 text-xl font-bold tracking-[-0.03em]" id="gender-confirm-title">确认设置为“{genderLabel(confirmGender)}”？</h3>
            <p className="profile-muted mt-3 text-sm leading-7 text-[#6f7b93]" id="gender-confirm-description">性别设置后将无法由你自行修改，请确认选择是否正确。</p>
            <div className="mt-7 flex justify-end gap-3">
              <button ref={genderBackButtonRef} type="button" className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#6f7b93] hover:bg-[#edf0f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#778297] disabled:opacity-50" onClick={() => setConfirmGender('')} disabled={isSavingGender}>返回修改</button>
              <button type="button" className="rounded-xl bg-[#5878c7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4968b6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] disabled:cursor-wait disabled:opacity-50" onClick={saveGender} disabled={isSavingGender}>{isSavingGender ? '设置中…' : '确认设置'}</button>
            </div>
          </section>
        </div>
      )}
    </div>,
    document.body,
  )
}
