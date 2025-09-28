console.log('Testing nodemailer import...');
try {
  const nodemailer = require('nodemailer');
  console.log('Nodemailer imported successfully');
  console.log('createTransporter is a:', typeof nodemailer.createTransporter);
} catch (err) {
  console.error('Error importing nodemailer:', err.message);
}