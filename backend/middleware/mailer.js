const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service is not fully configured. Email sending will be mocked.');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log('Mock send email to:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };