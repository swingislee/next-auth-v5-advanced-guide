import nodemailer from 'nodemailer'
import { verificationTemplate, passwordResetTemplate } from "./mailtemp"

interface IEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, //我的邮箱
    pass: process.env.EMAIL_PASS, //授权码
  },
})

export const sendEmail = async ({ to, subject, text, html }: IEmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    })
    return info
  } catch (error) {
    // 失败时候的处理
    throw new Error('BAD_REQUEST')
  }
}

export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const confirmLink = `http://localhost:3000/auth/new-verification?token=${token}`

  await sendEmail({
    to: email,
    subject: "confirm your email",
    text: "you found a fantasy place",
    html: verificationTemplate(confirmLink, email),
  })
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string
) => {
  const resetLink = `http://localhost:3000/auth/new-password?token=${token}`

  await sendEmail({
    to: email,
    subject: "Reset your password",
    text: "click the button to reset yourpassword",
    html: passwordResetTemplate(resetLink, email),
  })
}