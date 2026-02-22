import nodemailer from 'nodemailer';

// Create transporter for sending emails
// To use Gmail:
// 1. Enable 2-factor authentication on your Google account
// 2. Generate an App Password: https://support.google.com/accounts/answer/185833
// 3. Use your Gmail address as EMAIL_USER and the App Password as EMAIL_PASS
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Function to send temporary password email
export const sendTemporaryPasswordEmail = async (email, name, temporaryPassword) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Welcome to MediSchedule - Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Welcome to MediSchedule!</h2>

          <p>Dear ${name},</p>

          <p>Your account has been created successfully. Here are your login credentials:</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</span></p>
          </div>

          <p><strong>Important:</strong> Please change your password after your first login for security reasons.</p>

          <p>You can log in at: <a href="http://localhost:5175" style="color: #2563eb;">MediSchedule Login</a></p>

          <p>If you have any questions, please contact your administrator.</p>

          <p>Best regards,<br>The MediSchedule Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};