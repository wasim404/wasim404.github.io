import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env, isProduction } from '../config/env.js'

let transporter
let resend

function getTransporter() {
  if (transporter) return transporter
  if (!env.SMTP_HOST) return null

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  })
  return transporter
}

export async function sendVerificationEmail(email, code) {
  const subject = 'MANOONG 邮箱验证码'
  const text = `你的 MANOONG 验证码是 ${code}，${env.VERIFICATION_CODE_TTL_MINUTES} 分钟内有效。请勿向他人透露。`
  const html = `
    <div style="margin:0;padding:32px;background:#f7f4ed;font-family:Arial,'PingFang SC',sans-serif;color:#18392f">
      <div style="max-width:480px;margin:auto;padding:32px;border-radius:24px;background:#fff;box-shadow:0 18px 55px rgba(24,57,47,.1)">
        <p style="margin:0;color:#51917a;font-size:11px;font-weight:700;letter-spacing:.18em">MANOONG ACCOUNT</p>
        <h1 style="margin:12px 0 8px;font-size:25px">验证你的邮箱</h1>
        <p style="margin:0;color:#6b8078;font-size:14px;line-height:1.7">输入下面的验证码，完成账户邮箱验证。</p>
        <p style="margin:28px 0;padding:18px;border-radius:16px;background:#edf5f0;color:#21624d;font-size:30px;font-weight:800;letter-spacing:8px;text-align:center">${code}</p>
        <p style="margin:0;color:#83938d;font-size:12px;line-height:1.7">验证码将在 ${env.VERIFICATION_CODE_TTL_MINUTES} 分钟后失效。如果这不是你的操作，可以忽略此邮件。</p>
      </div>
    </div>`

  if (env.RESEND_API_KEY) {
    resend ||= new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM || env.SMTP_FROM,
      to: email,
      subject,
      text,
      html,
    })
    if (error) throw new Error(`Resend delivery failed: ${error.message}`)
    return { mocked: false, provider: 'resend' }
  }

  const smtp = getTransporter()
  if (!smtp) {
    if (isProduction) throw new Error('SMTP is not configured')
    console.info(`[development email] verification code for ${email}: ${code}`)
    return { mocked: true }
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject,
    text,
    html,
  })
  return { mocked: false }
}
