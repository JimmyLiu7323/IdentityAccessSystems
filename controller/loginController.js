const passport = require('passport');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redisConfig').redisClient;
const path = require('path');
const { logger, createAndThrowError } = require('../utilities/logger');
const generateAndStoreToken = require('../utilities/tokenHelper'); 

/**
 * @swagger
 * tags:
 *   name: Login
 *   description: Login management
 */


/**
 * @swagger
 * /login:
 *   get:
 *     tags: [Login]
 *     summary: Show the login page
 *     description: Display the login page to the user.
 *     responses:
 *       200:
 *         description: HTML for the login page.
 *   post:
 *     tags: [Login]
 *     summary: Authenticate user
 *     description: Authenticate user and create a session.
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
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Authentication successful.
 *       401:
 *         description: Authentication failed.
 */

const showLoginPage = (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
  } catch (error) {
    logger.error('Error displaying login page:', error);
    createAndThrowError('Error in showing login page', 500);
  }
};


const loginUser = (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            logger.error("Authentication Error:", err);
            return res.status(500).json({ success: false, message: 'An error occurred during authentication.' });
        }
        if (!user) {
            logger.warn("Login failed, user not authenticated");
            return res.status(401).json({ success: false, message: info.message || 'Authentication failed.' });
        }
        req.login(user, async (loginErr) => {
            if (loginErr) {
                logger.error("Login Error:", loginErr);
                return res.status(500).json({ success: false, message: 'An error occurred during login.' });
            }

            // Call the token helper function to handle token creation and storage
            await generateAndStoreToken(user, res, true); // true to include URL with token
        });
    })(req, res, next);
};

module.exports = {
  loginUser,
  showLoginPage
};
