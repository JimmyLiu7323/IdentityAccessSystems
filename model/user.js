const Sequelize = require('sequelize');
const sequelize = require('../utilities/sequelize'); // Adjust the path as necessary

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true // Name can be null initially or if the user chooses not to set it
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true // Allow null for Google OAuth users
  },
  isGoogleOAuth: {
    type: Sequelize.BOOLEAN,
    allowNull: false, // Ensure this field is always set
    defaultValue: false // Default value is false for regular users
  },
  emailVerified: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false // Set default to false, as email verification is initially pending
  },
  verificationToken: {
    type: Sequelize.STRING,
    allowNull: true // Allow null as it will only be set when email verification is pending
  },
  tokenExpiry: {
    type: Sequelize.DATE,
    allowNull: true // Allow null, this field is relevant only when a verification token is generated
  },
  signUpTimestamp: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  loginCount: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastSessionTimestamp: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: true // This will allow the role field to be null
  }
});

sequelize.sync();

module.exports = User;
