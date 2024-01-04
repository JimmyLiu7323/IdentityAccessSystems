const redisClient = require('../config/redisConfig').redisClient; 
const { logger, createAndThrowError } = require('../utilities/logger'); 

/**
 * @swagger
 * /logout:
 *   get:
 *     tags: [Logout]
 *     summary: Log out the current user
 *     description: Logs out the current user by deleting the user token from Redis, clearing the session cookie, and destroying the session.
 *     responses:
 *       302:
 *         description: Redirect to the login page.
 *       500:
 *         description: Internal Server Error - Error during the logout process.
 */
const logoutUser = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    logger.warn("User is not authenticated - redirecting to login");  
    return res.redirect('/login'); // Redirect to login page immediately
  }

  try {
    const userId = req.user.id;
    logger.info(`Logging out user ID: ${userId}`);
    const redisKey = `user_token:${userId}`; // Key to delete JWT from Redis
    
    logger.info("Attempting to delete user token from Redis...");   
    const response = await redisClient.del(redisKey);
    logger.info(`User token deleted from Redis for user ID: ${userId}, response: ${response}`);

    // Log the session ID that is being destroyed
    logger.info(`Destroying session ID: ${req.sessionID}`);

    req.logout(err => {
      if (err) {
        logger.error("Logout error:", err);
        return next(createAndThrowError('Logout error', 500));     
      }

        // Clear the session cookie from the client's browser
       res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        });

      logger.info("User logged out, destroying session...");    
      req.session.destroy(err => {
        if (err) {
          logger.error("Error destroying session:", err);
          return next(createAndThrowError('Error destroying session', 500));        
        }
        logger.info(`Session destroyed successfully for user ID: ${userId}`);
        res.redirect('/login'); // Redirect to login page after logout   
      });
    });
  } catch (err) {
    logger.error("Error during logout process:", err);
    next(createAndThrowError('Error during logout process', 500));  
  }
};

module.exports = {
  logoutUser
};
