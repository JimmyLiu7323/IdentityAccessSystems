require('dotenv').config();
const bcrypt = require('bcrypt');
const { auth } = require('../config/firebaseConfig'); 
const { validatePassword, generateVerificationToken } = require('../utilities/authUtils');
const { sendVerificationEmail } = require('../services/emailService');
const User = require('../model/user');
const UserActivityLog = require('../model/userActivityLog');
const path = require('path');
const sequelize = require('../utilities/sequelize');
const { logger, createAndThrowError } = require('../utilities/logger');


/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management and profile operations
 */


const userController = {
  /**
   * @swagger
   * /signup:
   *   get:
   *     tags: [User]
   *     summary: Show signup page
   *     description: Serve the HTML file for the user signup.
   *     responses:
   *       200:
   *         description: HTML for the signup page.
   */
  showSignupPage: (req, res) => {
    try {
      logger.info('Serving Signup Page');
      const filePath = path.join(__dirname, '..', 'views', 'signup.html');
      res.sendFile(filePath);
    } catch (error) {
      logger.error('Error serving the signup page:', error);
      createAndThrowError('Error serving the signup page', 500);
    }
  },
  
   /**
   * @swagger
   * /signup:
   *   post:
   *     tags: [User]
   *     summary: Register a new user
   *     description: Create a new user with the provided name, email, and password.
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *               name:
   *                 type: string
   *             required:
   *               - email
   *               - password
   *               - name
   *     responses:
   *       201:
   *         description: User successfully created.
   *       400:
   *         description: Invalid input data.
   *       409:
   *         description: Email already in use.
   *       500:
   *         description: Internal server error.
   */
async signup(req, res) {
  try {
    const { email, password, name, role  } = req.body;
    logger.info(`Signup attempt for email: ${email}`);
    logger.info(`Signup attempt for role: ${role}`);

    if (!validatePassword(password)) {
      logger.warn(`Password validation failed for email: ${email}`);
      return res.status(400).send({ message: 'Password does not meet the required criteria.' });
    }

    // Create local database user with rollback on failure
    try {
      const newUser = await userController.createUser({
        username: email,
        password: password,
        name: name,
        isGoogleOAuth: false,
        role: role, 
        signUpTimestamp: new Date(),
      });
      logger.info(`Local user created with ID: ${newUser.id}`);

      await UserActivityLog.create({
        userId: newUser.id,
        activityTimestamp: new Date()
      });
      logger.info(`Activity log created for user ID: ${newUser.id}`);

      const { token, expires } = generateVerificationToken();
      await newUser.update({
        verificationToken: token,
        tokenExpiry: expires
      });
      logger.info(`Verification token stored for user ID: ${newUser.id}`);

      // Send verification email
      await sendVerificationEmail(newUser.id);
      logger.info(`Verification email sent to: ${email}`);

      req.login(newUser, (loginErr) => {
        if (loginErr) {
          logger.error(`Login error after signup for user ID: ${newUser.id}`, loginErr);
          return res.status(500).send({ message: 'Error logging in after signup' });
        }
        logger.info(`User logged in successfully, user ID: ${newUser.id}`);
        res.status(201).send({ userId: newUser.id, username: newUser.username });
      });
    } catch (localDbError) {
      logger.error(`Error creating local user: ${localDbError}`);
      return res.status(500).send({ message: 'Error creating local user.' });
    }
  } catch (error) {
    logger.error(`Signup error for email: ${email}`, error);
    if (error.name === 'SequelizeUniqueConstraintError' || 
        (error.code && error.code.includes('auth/email-already-exists'))) {
      return res.status(409).send({ message: 'The email address is already in use by another account.' });
    }
    res.status(500).send({ message: 'An error occurred during the signup process.' });
  }
},

   

  createUser: async ({ username, password, name, isGoogleOAuth, role, signUpTimestamp }) => {
    try {
      let user = await User.findOne({ where: { username } });
      if (!user) {
        const hashedPassword = isGoogleOAuth ? null : await bcrypt.hash(password, 10);
        user = await User.create({
          username,
          password: hashedPassword,
          name,
          isGoogleOAuth: isGoogleOAuth ? 1 : 0,
          role,
          signUpTimestamp
        });
        logger.info(`New user created: ${username}`);
      } else {
        logger.warn(`Attempt to create a duplicate user: ${username}`);
        createAndThrowError('User already exists', 409); // Handle duplicate user creation
      }
      return user;
    } catch (error) {
      logger.error(`Error in createUser for ${username}:`, error);
      createAndThrowError('Error creating user', 500); // General server error
    }
  },
  

  updateUserName: async (userId, newName) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn(`User not found for ID: ${userId}`);
        createAndThrowError('User not found', 404); // User not found error
      }
      user.name = newName;
      await user.save();
      logger.info(`User name updated for ID: ${userId}`);
    } catch (error) {
      logger.error(`Error updating user name for ID: ${userId}:`, error);
      createAndThrowError('Error updating user name', 500); // General server error
    }
  },
  

  getUserById: async (id) => {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        logger.warn(`User not found for ID: ${id}`);
        return null;
      }
      logger.info(`User fetched for ID: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Error fetching user by ID: ${id}:`, error);
      createAndThrowError('Error fetching user', 500);
    }
  },
  

  async findUserByEmail(email) {
    if (!email) {
      logger.warn("Email parameter is undefined or null.");
      return null; // Returning null to indicate no email provided
    }
  
    try {
      const user = await User.findOne({ where: { username: email } });
      if (!user) {
        logger.warn(`User not found for email: ${email}`);
        return null; // Returning null to indicate user not found
      }
      logger.info(`User found for email: ${email}`);
      return user;
    } catch (error) {
      logger.error(`Error finding user by email: ${email}:`, error);
      createAndThrowError('Error finding user by email', 500); // General server error
    }
  },
  
  
  
    
  
  

     /**
   * @swagger
   * /user/reset-password:
   *   post:
   *     tags: [User]
   *     summary: Reset user password
   *     description: Allows authenticated users to change their password.
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *               confirmNewPassword:
   *                 type: string
   *                 format: password
   *             required:
   *               - oldPassword
   *               - newPassword
   *               - confirmNewPassword
   *     responses:
   *       200:
   *         description: Password successfully updated.
   *       400:
   *         description: New passwords do not match or do not meet criteria.
   *       401:
   *         description: User not authenticated.
   *       500:
   *         description: Internal server error.
   */

     resetPassword: async (userId, oldPassword, newPassword) => {
      try {
        const user = await userController.getUserById(userId);
        if (!user) {
          logger.warn(`User not found for ID: ${userId}`);
          createAndThrowError('User not found', 404);
        }
    
        if (user.password === null && !user.isGoogleOAuth) {
          logger.warn(`Password not set for user ID: ${userId}`);
          createAndThrowError('No password set for this account. Please set up a password first.', 400);
        }
    
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          logger.warn(`Incorrect old password for user ID: ${userId}`);
          createAndThrowError('Old password is incorrect.', 401);
        }
    
        if (!validatePassword(newPassword)) {
          logger.warn(`New password does not meet criteria for user ID: ${userId}`);
          createAndThrowError('New password does not meet criteria.', 400);
        }
    
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();
    
        logger.info(`Password reset successfully for user ID: ${userId}`);
        return { success: true, message: 'Password reset successfully.' }; // Return an object with the result
      } catch (error) {
        logger.error(`Error resetting password for user ID: ${userId}:`, error);
        createAndThrowError('Error resetting password', 500); // General server error
      }
    },
    
    handleResetPassword: async (req, res) => {
      try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        
        if (newPassword !== confirmNewPassword) {
          return res.status(400).json({ success: false, message: 'New passwords do not match.' });
        }
        
        const resetResult = await userController.resetPassword(req.user.id, oldPassword, newPassword);
        
        // Ensure that resetResult.success is set to true by the resetPassword function
        if (resetResult.success) {
          res.json({ success: true, message: 'Password successfully updated.' });
        } else {
          // If success is not true, handle accordingly (this case should be defined in your resetPassword function)
        }
      } catch (error) {
        logger.error('Error in handleResetPassword:', error);
        res.status(500).json({ success: false, message: 'Error handling password reset.' });
      }
    },
    
    

    
  /**
   * @swagger
   * /userinfo:
   *   get:
   *     tags: [User]
   *     summary: Get user information
   *     description: Retrieve information of the authenticated user.
   *     responses:
   *       200:
   *         description: Information about the user.
   *       401:
   *         description: User is not authenticated.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal server error.
   */

  getUserInfo: async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        res.status(401).json({ message: 'User is not authenticated' });
        return;
      }
  
      const fullUserData = await User.findByPk(req.user.id, {
        attributes: ['name', 'username', 'isGoogleOAuth', 'signUpTimestamp', 'loginCount', 'lastSessionTimestamp']
      });
  
      if (!fullUserData) {
        logger.warn(`User not found for ID: ${req.user.id}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      res.json({
        name: fullUserData.name,
        email: fullUserData.username,
        isGoogleOAuth: fullUserData.isGoogleOAuth,
        signUpTimestamp: fullUserData.signUpTimestamp,
        loginCount: fullUserData.loginCount,
        lastSessionTimestamp: fullUserData.lastSessionTimestamp
      });
    } catch (error) {
      logger.error('Error fetching user info:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },  
};

function bindMethods(obj) {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'function') {
      obj[key] = obj[key].bind(obj);
    }
  });
}

bindMethods(userController);
module.exports = userController;
