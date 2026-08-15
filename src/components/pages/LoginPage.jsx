import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import './AuthPages.css'

function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verification, setVerification] = useState({ open: false, email: '', code: '', sent: false })
  const [notice, setNotice] = useState('')

  if (user) return <Navigate to="/profile" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(form.login, form.password)
      navigate(location.state?.from || '/profile', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerification(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)
    try {
      if (!verification.sent) {
        await authService.sendEmailCode(verification.email)
        setVerification({ ...verification, sent: true })
        setNotice('如果该邮箱可以验证，验证码将很快发送。')
      } else {
        await authService.verifyEmail(verification.email, verification.code)
        setVerification({ open: false, email: '', code: '', sent: false })
        setNotice('邮箱验证完成，现在可以登录。')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">WELCOME BACK</p>
        <h1>继续你的节奏</h1>
        <p className="auth-card__lead">登录后，你的账户将成为未来跨设备同步的身份基础。</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>用户名或邮箱<input type="text" autoComplete="username" required value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} /></label>
          <label>密码<input type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? '正在登录…' : '登录'}</button>
        </form>
        {notice && <p className="auth-form__success auth-page-notice" role="status">{notice}</p>}
        {!verification.open ? (
          <button
            className="auth-card__verify-link"
            type="button"
            onClick={() => {
              setError('')
              setNotice('')
              setVerification({ ...verification, open: true })
            }}
          >
            注册过但还没验证邮箱？
          </button>
        ) : (
          <form className="auth-form auth-verification-panel" onSubmit={handleVerification}>
            <label>注册邮箱<input type="email" autoComplete="email" required value={verification.email} disabled={verification.sent} onChange={(event) => setVerification({ ...verification, email: event.target.value })} /></label>
            {verification.sent && <label>邮箱验证码<input inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" required value={verification.code} onChange={(event) => setVerification({ ...verification, code: event.target.value.replace(/\D/g, '') })} /></label>}
            <button type="submit" disabled={isSubmitting}>{verification.sent ? '完成邮箱验证' : '发送验证码'}</button>
            <button className="auth-form__secondary" type="button" onClick={() => setVerification({ open: false, email: '', code: '', sent: false })}>取消</button>
          </form>
        )}
        <p className="auth-card__switch">还没有账户？ <Link to="/register">创建账户</Link></p>
      </section>
    </main>
  )
}

export default LoginPage
