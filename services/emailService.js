require('dotenv').config();
const nodemailer = require('nodemailer');
const { logger, createAndThrowError } = require('../utilities/logger'); 
const User = require('../model/user');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = (options) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (error, info) => {
      if (error) {
        logger.error('Error sending email:', error);
        reject(error);
      } else {
        logger.info('Email sent successfully:', info.response);
        resolve(info);
      }
    });
  });
};

// Append the sendVerificationEmail function here
async function sendVerificationEmail(userId) {
  try {
    // Retrieve userEmail and verificationToken based on userId from your database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const userEmail = user.username; // Adjust this to the actual field that stores the email
    const verificationToken = user.verificationToken; // Adjust this to the actual field that stores the verification token

    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    const subject = 'Please Verify Your Email Address';

    const htmlContent = `
        <div style="font-family: 'Arial', sans-serif; color: #333; padding: 20px; text-align: center;">
            <h1 style="color: #444;">Verify Your Email Address</h1>
            <p>Hello,</p>
            <p>Thank you for signing up. Please click the button below to verify your email address and complete the registration process.</p>
            <a href="${verificationUrl}" style="background-color: #3498db; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px;">Verify Email</a>
            <p>If you did not create an account, no further action is required.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777;">If you’re having trouble clicking the "Verify Email" button, copy and paste the URL below into your web browser:</p>
            <p><a href="${verificationUrl}" style="color: #3498db;">${verificationUrl}</a></p>
        </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });

    return 'Verification email sent successfully.';
  } catch (error) {
    logger.error('Error sending verification email:', error);
    createAndThrowError('Error resending verification email.', 500);
  }
}

module.exports = { sendEmail, sendVerificationEmail };
