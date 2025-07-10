const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Twilio client setup (Corrected)
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Nodemailer transporter setup
const emailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    
    pass: process.env.EMAIL_PASS      
  }
});


// exports.sendEmergencyAlert = async ({ contact, location }) => {
//   try {
//     const googleMapsLink = location
//       ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
//       : 'Location unavailable';

//     const message = `EMERGENCY ALERT! A user triggered an SOS.\nLocation: ${googleMapsLink}`;
//     // Send SMS alert
//     if (contact.contactMethod === 'phone') {
//       await twilioClient.messages.create({
//         body: message,
//         from: process.env.TWILIO_PHONE,
//         to: contact.contactInfo
//       });
//       console.log(`SMS alert sent to ${contact.contactInfo}`);
//       return true;

//     // Send Email alert
//     } else if (contact.contactMethod === 'email') {
//       console.log('Preparing to send email...');
// console.log('From:', process.env.EMAIL_USER);
// console.log('To:', contact.contactInfo);
// console.log('Auth password exists:', !!process.env.EMAIL_PASS);

//       const result = await emailTransport.sendMail({
//     from: `"Safety App" <${process.env.EMAIL_USER}>`,
//     to: contact.contactInfo,
//     subject: '🚨 EMERGENCY ALERT: User Needs Help',
//     text: message,
//     html: `
//       <h1>🚨 Emergency Alert</h1>
//       <p>A user has triggered an SOS alert.</p>
//       <p><strong>Location:</strong> <a href="${googleMapsLink}">${googleMapsLink}</a></p>
//       <p>Please check on them immediately.</p>
//     `
//   });

//   console.log('Email sent:', result);
//       console.log(`Email alert sent to ${contact.contactInfo}`);
//       console.log("done")
//       return true;
//     }


//     throw new Error('Unsupported contact method');

//   } catch (error) {
//     console.error(`❌ Failed to send alert to ${contact.contactInfo}: ${error.message}`);
//     return false;
//   }
// };
exports.sendEmergencyAlert = async ({ contact, location }) => {
  console.log('🟠 [ALERT] Sending alert to contact:', contact.contactInfo);
  console.log('🟠 [ALERT] Contact method:', contact.contactMethod);

  try {
    const googleMapsLink = location
      ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
      : 'Location unavailable';

    const message = `🚨 EMERGENCY ALERT! A user triggered an SOS.\nLocation: ${googleMapsLink}`;

    if (contact.contactMethod === 'phone') {
      console.log('📲 [ALERT] Sending SMS via Twilio...');
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: contact.contactInfo
      });
      console.log('✅ [ALERT] SMS sent to:', contact.contactInfo);
      return true;

    } else if (contact.contactMethod === 'email') {
      console.log('📧 [ALERT] Sending email...');
      const result = await emailTransport.sendMail({
        from: `"Safety App" <${process.env.EMAIL_USER}>`,
        to: contact.contactInfo,
        subject: '🚨 EMERGENCY ALERT: User Needs Help',
        text: message,
        html: `
          <h1>🚨 Emergency Alert</h1>
          <p>A user has triggered an SOS alert.</p>
          <p><strong>Location:</strong> <a href="${googleMapsLink}">${googleMapsLink}</a></p>
          <p>Please check on them immediately.</p>
        `
      });
      console.log('✅ [ALERT] Email sent to:', contact.contactInfo);
      return true;
    }

    console.warn('⚠️ [ALERT] Unsupported contact method:', contact.contactMethod);
    return false;

  } catch (error) {
    console.error(`❌ [ALERT] Failed to notify ${contact.contactInfo}:`, error.message);
    return false;
  }
};
