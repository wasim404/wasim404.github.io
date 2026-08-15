import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/userService'
import { authService } from '../../services/authService'
import './AuthPages.css'

function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailBinding, setEmailBinding] = useState({ email: '', code: '', sent: false })
  const [phoneBinding, setPhoneBinding] = useState({ phone: '', code: '', sent: false })

  async function handleChangePassword(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const result = await userService.changePassword(form.currentPassword, form.newPassword)
      setMessage(result.message)
      window.setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  async function sendBindingCode(kind) {
    setError('')
    setMessage('')
    try {
      if (kind === 'email') {
        await authService.sendEmailCode(emailBinding.email)
        setEmailBinding({ ...emailBinding, sent: true })
      } else {
        await authService.sendPhoneCode(phoneBinding.phone)
        setPhoneBinding({ ...phoneBinding, sent: true })
      }
      setMessage('验证码已发送，请及时查收。')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function verifyBinding(kind) {
    setError('')
    setMessage('')
    try {
      if (kind === 'email') {
        await authService.verifyEmail(emailBinding.email, emailBinding.code)
        setEmailBinding({ email: '', code: '', sent: false })
      } else {
        await authService.verifyPhone(phoneBinding.phone, phoneBinding.code)
        setPhoneBinding({ phone: '', code: '', sent: false })
      }
      await refreshUser()
      setMessage(kind === 'email' ? '邮箱绑定成功。' : '手机号绑定成功。')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">YOUR ACCOUNT</p>
        <h1>账户资料</h1>
        <div className="profile-list">
          <div><span>用户名</span><strong>{user.username}</strong></div>
          <div><span>邮箱</span><strong>{user.email}</strong></div>
          <div><span>邮箱状态</span><strong>{user.email_verified ? '已验证' : '待验证'}</strong></div>
          <div><span>手机号</span><strong>{user.phone || '尚未绑定'}</strong></div>
        </div>
        <div className="auth-form auth-binding">
          <label>绑定新邮箱<input type="email" value={emailBinding.email} onChange={(event) => setEmailBinding({ email: event.target.value, code: '', sent: false })} /></label>
          {emailBinding.sent && <label>邮箱验证码<input inputMode="numeric" maxLength="6" value={emailBinding.code} onChange={(event) => setEmailBinding({ ...emailBinding, code: event.target.value.replace(/\D/g, '') })} /></label>}
          <button type="button" onClick={() => emailBinding.sent ? verifyBinding('email') : sendBindingCode('email')} disabled={!emailBinding.email || (emailBinding.sent && emailBinding.code.length !== 6)}>{emailBinding.sent ? '确认绑定邮箱' : '发送邮箱验证码'}</button>
        </div>
        <div className="auth-form auth-binding">
          <label>绑定手机号<input type="tel" placeholder="+8613800000000" value={phoneBinding.phone} onChange={(event) => setPhoneBinding({ phone: event.target.value, code: '', sent: false })} /></label>
          {phoneBinding.sent && <label>短信验证码<input inputMode="numeric" maxLength="6" value={phoneBinding.code} onChange={(event) => setPhoneBinding({ ...phoneBinding, code: event.target.value.replace(/\D/g, '') })} /></label>}
          <button type="button" onClick={() => phoneBinding.sent ? verifyBinding('phone') : sendBindingCode('phone')} disabled={!phoneBinding.phone || (phoneBinding.sent && phoneBinding.code.length !== 6)}>{phoneBinding.sent ? '确认绑定手机号' : '发送短信验证码'}</button>
        </div>
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        {message && <p className="auth-form__success" role="status">{message}</p>}
        <form className="auth-form" onSubmit={handleChangePassword}>
          <label>当前密码<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
          <label>新密码<input type="password" autoComplete="new-password" minLength="10" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
          <button type="submit">修改密码</button>
          <button type="button" onClick={handleLogout}>退出登录</button>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
