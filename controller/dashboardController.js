const User = require('../model/user'); 
const redisClient = require('../config/redisConfig').redisClient; 
const { validatePassword, generateVerificationToken } = require('../utilities/authUtils'); 
const { sendVerificationEmail } = require('../services/emailService'); 
const jwt = require('jsonwebtoken'); 
const secret = process.env.JWT_SECRET; 
const path = require('path');
const { logger, createAndThrowError } = require('../utilities/logger');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard operations
 */

const dashboardController = {
  /**
   * @swagger
   * /dashboard:
   *   get:
   *     tags: [Dashboard]
   *     summary: Access the dashboard
   *     description: Display the dashboard page to authenticated users.
   *     responses:
   *       200:
   *         description: HTML for the dashboard page.
   *       302:
   *         description: Redirect to the login page.
   *       403:
   *         description: Access Denied - User is not authorized to access this page.
   */
    accessDashboard: async (req, res, next) => {
        logger.info('Accessing dashboard...');
    
        // Check if the user is authenticated
        if (!req.isAuthenticated()) {
            logger.info('User is not authenticated. Redirecting to /login');
            return res.redirect('/login');
        }
    
        const userId = req.user.id;
        logger.info(`Authenticated user ID: ${userId}`);
    
        try {
            // Fetch the user details from the database
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                logger.error('User not found in database.'); 
                createAndThrowError('User not found.', 404);
              }
              logger.info(`User found: ${user.username}`);
    
            // Check if the user authenticated via Google OAuth or their email is verified
            if (user.isGoogleOAuth) {
                logger.info('User signed in via Google OAuth. Dashboard access granted.'); 
                return next();
            } else if (!user.emailVerified) {
                logger.info('User email not verified. Showing resend verification link.'); 
                return res.redirect('/email-verification'); // Redirect to a dedicated verification page
            }
    
            // Retrieve JWT from Redis
            const redisKey = `user_token:${userId}`;
            logger.info(`Retrieving token from Redis with key: ${redisKey}`); 
            const token = await redisClient.get(redisKey);
    
            if (!token) {
                logger.error('No token found in Redis for key:', redisKey);
                createAndThrowError('No token found.', 401);
            }
    
            logger.info('Token retrieved from Redis:', token);
    
            // Verify JWT
            const decoded = jwt.verify(token, secret);
            if (decoded.id !== userId) {
                logger.error('Token user ID does not match authenticated user ID.'); 
                createAndThrowError('Invalid token. Access denied.', 401);
             }
    
             logger.info('Token successfully verified. Dashboard access granted.');    
            next();
    
        } catch (error) {
            logger.error('Error in accessDashboard:', error);     
            if (error.name === 'JsonWebTokenError') {
                createAndThrowError('Invalid token. Access denied.', 401);
            }
            createAndThrowError('Internal Server Error', 500);
        }
    },
      /**
   * @swagger
   * /dashboard/send:
   *   get:
   *     tags: [Dashboard]
   *     summary: Send the dashboard
   *     description: Serve the HTML file for the dashboard.
   *     responses:
   *       200:
   *         description: HTML for the dashboard page.
   */
    sendDashboard: (req, res) => {
        try {
            // Send the dashboard.html file
            res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
        } catch (error) {
            logger.error('Error sending dashboard:', error);
            createAndThrowError('Internal server error', 500);
        }
    },    
      /**
   * @swagger
   * /dashboard/resend-verification:
   *   get:
   *     tags: [Dashboard]
   *     summary: Resend email verification
   *     description: Allows users to resend the email verification link if they haven't verified their email.
   *     responses:
   *       200:
   *         description: Success message indicating the verification email has been resent.
   *       302:
   *         description: Redirect to the dashboard.
   *       401:
   *         description: Unauthorized - User is not authenticated.
   *       500:
   *         description: Internal Server Error - Error resending verification email.
   */
      resendVerification: async (req, res) => {
        logger.info('isAuthenticated: ' + req.isAuthenticated());
        
        if (!req.isAuthenticated()) {
            logger.info('User is not authenticated. Redirecting to /login');    
            return res.redirect('/login');
        }
    
        const userId = req.user.id;
        logger.info("userId: " + userId);
    
        try {
            const user = await User.findOne({ where: { id: userId } });
            logger.info('user: ' + user);    
         
            if (!user) {
                logger.error('User not found in database.');
                throw new Error('User not found');
            }
            logger.info(`User found: ${user.username}`);
    
            if (user && !user.emailVerified) {
                await sendVerificationEmail(userId);
                logger.info('Verification email resent successfully.');
                res.send('Verification email resent successfully.');
            } else {
                logger.info('User email is already verified or not found.');
                res.redirect('/dashboard');
            }
        } catch (error) {
            logger.error('Error in resendVerification:', error);
            createAndThrowError('Error resending verification email.', 500);
        }
    },
};

  

module.exports = dashboardController;
