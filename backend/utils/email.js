import dotenv from 'dotenv';

dotenv.config();

import nodemailer from 'nodemailer';

export const sendResetEmail = async (email, token, resetUrl) => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return await transport.sendMail({
    from: "hello@demomailtrap.co",
    to: email,
    subject: "Votre lien pour changer de mot de passe",
    html: resetUrl
  });
};