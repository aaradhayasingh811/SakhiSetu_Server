const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send partner message via email
exports.sendPartnerEmail = async ({ email, subject, message }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #6d6875;">Your Partner Shared an Update</h2>
        <div style="background-color: #f8edeb; padding: 20px; border-radius: 8px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top: 20px; color: #6d6875;">
          This message was sent via the Menstrual Health Companion app.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Partner email sent to ${email}`);
  } catch (err) {
    console.error('Error sending partner email:', err);
    throw err;
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Menstrual Health Companion',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #6d6875;">Welcome, ${name}!</h2>
        <p>Thank you for joining the Menstrual Health Companion app.</p>
        <p>We're here to help you track and understand your menstrual health better.</p>
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}" 
             style="background-color: #b5838d; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Get Started
          </a>
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (err) {
    console.error('Error sending welcome email:', err);
    throw err;
  }
};