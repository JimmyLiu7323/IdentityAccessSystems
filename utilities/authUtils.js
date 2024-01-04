const bcrypt = require('bcrypt');
const crypto = require('crypto');

function validatePassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(inputPassword, hashedPassword) {
  return bcrypt.compare(inputPassword, hashedPassword);
}


function generateVerificationToken() {
  const token = crypto.randomBytes(20).toString('hex'); // Generates a random string
  const expires = new Date(); // Current time
  expires.setHours(expires.getHours() + 24); // Set token to expire in 24 hours

  return { token, expires };
}

module.exports = {
  validatePassword,
  hashPassword,
  comparePassword,
  generateVerificationToken, // Exporting the new function
};
