import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import './AuthPages.css'

const emptyResetPassword = {
  open: false,
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
  sent: false,
}

function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetPassword, setResetPassword] = useState(emptyResetPassword)
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

  async function handlePasswordReset(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (resetPassword.sent && resetPassword.password !== resetPassword.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)
    try {
      if (!resetPassword.sent) {
        const result = await authService.requestPasswordReset(resetPassword.email)
        setResetPassword((current) => ({ ...current, sent: true }))
        setNotice(result.message)
      } else {
        const result = await authService.resetPassword(
          resetPassword.email,
          resetPassword.code,
          resetPassword.password,
        )
        setResetPassword(emptyResetPassword)
        setNotice(result.message)
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
        <h1 className="auth-card__login-title">登录</h1>
        {!resetPassword.open ? (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>用户名或邮箱<input type="text" autoComplete="username" required value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} /></label>
              <label>密码<input type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
              {error && <p className="auth-form__error" role="alert">{error}</p>}
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? '正在登录…' : '登录'}</button>
            </form>
            {notice && <p className="auth-form__success auth-page-notice" role="status">{notice}</p>}
            <button
              className="auth-card__helper-link"
              type="button"
              onClick={() => {
                setError('')
                setNotice('')
                setResetPassword({ ...emptyResetPassword, open: true })
              }}
            >
              忘记密码？
            </button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handlePasswordReset}>
            <label>注册邮箱<input type="email" autoComplete="email" required value={resetPassword.email} disabled={resetPassword.sent || isSubmitting} onChange={(event) => setResetPassword({ ...resetPassword, email: event.target.value })} /></label>
            {resetPassword.sent && (
              <>
                <label>邮箱验证码<input inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" required value={resetPassword.code} onChange={(event) => setResetPassword({ ...resetPassword, code: event.target.value.replace(/\D/g, '').slice(0, 6) })} /></label>
                <label>新密码<input type="password" autoComplete="new-password" minLength="10" maxLength="128" required value={resetPassword.password} onChange={(event) => setResetPassword({ ...resetPassword, password: event.target.value })} /></label>
                <label>确认新密码<input type="password" autoComplete="new-password" minLength="10" maxLength="128" required value={resetPassword.confirmPassword} onChange={(event) => setResetPassword({ ...resetPassword, confirmPassword: event.target.value })} /></label>
              </>
            )}
            {error && <p className="auth-form__error" role="alert">{error}</p>}
            {notice && <p className="auth-form__success" role="status">{notice}</p>}
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? '正在处理…' : resetPassword.sent ? '重置密码' : '发送验证码'}</button>
            <button
              className="auth-form__secondary"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setError('')
                setNotice('')
                setResetPassword(emptyResetPassword)
              }}
            >取消</button>
          </form>
        )}
        <p className="auth-card__switch">还没有账户？ <Link to="/register">创建账户</Link></p>
      </section>
    </main>
  )
}

export default LoginPage
