// Brevo Email Service - Send emails via Brevo API
// API Key: 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
// Verified Sender: kbaltazar_230000000268@uic.edu.ph
const BREVO_API_KEY = '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';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'kbaltazar_230000000268@uic.edu.ph';
const SENDER_NAME = 'MediSchedule';

// Function to send temporary password email via Brevo
export const sendTemporaryPasswordEmail = async (email, name, temporaryPassword) => {
  try {
    const mailOptions = {
      sender: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      to: [
        {
          email: email,
          name: name
        }
      ],
      subject: 'Welcome to MediSchedule - Your Account Created',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-top: 0;">Welcome to MediSchedule!</h2>

            <p>Dear ${name},</p>

            <p>Your account has been created successfully. Here are your login credentials:</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 10px 0;"><strong>Email:</strong></p>
              <p style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 0;">${email}</p>
              
              <p style="margin: 15px 0 10px 0;"><strong>Temporary Password:</strong></p>
              <p style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 0; font-size: 16px; letter-spacing: 2px;">${temporaryPassword}</p>
            </div>

            <p><strong style="color: #dc2626;">Important:</strong> Please change your password immediately after your first login for security reasons.</p>

            <p>You can log in at: <a href="http://localhost:5173/" style="color: #2563eb; text-decoration: none;"><strong>MediSchedule Login</strong></a></p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

            <p style="color: #666; font-size: 12px;">If you have any questions or didn't request this account, please contact your administrator.</p>

            <p style="color: #666; font-size: 12px;">Best regards,<br><strong>The MediSchedule Team</strong></p>
          </div>
        </div>
      `
    };

    console.log('Sending email to:', email, 'via Brevo API from:', SENDER_EMAIL);
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(mailOptions)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo API error response:', responseData);
      return { 
        success: false, 
        error: responseData.message || responseData.detail || 'Failed to send email via Brevo' 
      };
    }

    console.log('Email sent successfully to:', email);
    console.log('Brevo Message ID:', responseData.messageId);
    return { success: true, messageId: responseData.messageId };
  } catch (error) {
    console.error('Error sending email to', email, ':', error.message);
    return { success: false, error: error.message };
  }
};