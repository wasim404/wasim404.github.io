import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import './AuthPages.css'

function RegisterPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/profile" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await authService.register(form.username, form.email, form.password)
      setSuccess(
        result.emailSent
          ? '账户已创建，验证码已经发送，请查收邮箱。'
          : '账户已创建，但邮件暂未送达，请点击重新发送。',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setIsSubmitting(true)
    try {
      await authService.sendEmailCode(form.email)
      setSuccess('验证码已经重新发送，请查收邮箱。')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await authService.verifyEmail(form.email, code)
      setSuccess('邮箱验证完成，现在可以登录。')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">CREATE ACCOUNT</p>
        <h1>建立你的账户</h1>
        <p className="auth-card__lead">使用邮箱注册。密码至少 10 位，并同时包含字母和数字。</p>
        {!success && <form className="auth-form" onSubmit={handleSubmit}>
          <label>用户名<input type="text" autoComplete="username" minLength="2" maxLength="30" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>绑定邮箱<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>密码<input type="password" autoComplete="new-password" minLength="10" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>确认密码<input type="password" autoComplete="new-password" minLength="10" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? '正在创建…' : '注册'}</button>
        </form>}
        {success && !success.includes('完成') && (
          <form className="auth-form" onSubmit={handleVerify}>
            <p className="auth-form__success" role="status">{success}</p>
            <label>邮箱验证码<input inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></label>
            {error && <p className="auth-form__error" role="alert">{error}</p>}
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? '正在验证…' : '验证邮箱'}</button>
            <button className="auth-form__secondary" type="button" onClick={handleResend} disabled={isSubmitting}>重新发送验证码</button>
          </form>
        )}
        {success.includes('完成') && <p className="auth-form__success" role="status">{success}</p>}
        <p className="auth-card__switch">已有账户？ <Link to="/login">返回登录</Link></p>
      </section>
    </main>
  )
}

export default RegisterPage
