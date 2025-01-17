const nodemailer = require('nodemailer');

// Create a transporter to send emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other email services like SendGrid or Mailgun
  auth: {
    user: 'ramshekade20@gmai.com', // Replace with your email address
    pass: 'qymu wwzw gubr hsvp',  // Replace with your email password or app-specific password
  },
});

// Send an email to the user when the target price is met
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'ramshekade20@gmai.com', // Replace with your email address
    to: to, // User's email address
    subject: subject,
    text: text, // Message body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendEmail };
