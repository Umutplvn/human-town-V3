"use strict";

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.human.town", // kendi mail sunucun
  port: 587,
  secure: false, // TLS için true yapabilirsin
  auth: {
    user: "info@human.town", // mail adresin
    pass: "MAIL_PASSWORD",   // mail şifren veya uygulama şifresi
  },
});

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: '"Human Town" <info@human.town>',
      to,
      subject,
      text,
      html,
    });
    console.log("Mail sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Mail gönderilemedi:", err);
    throw err;
  }
};

module.exports = sendMail;
