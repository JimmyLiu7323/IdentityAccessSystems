const User = require('../model/user'); // Adjust the path as necessary
const path = require('path');
const { logger, createAndThrowError } = require('../utilities/logger'); // Adjust the path as necessary
const generateAndStoreToken = require('../utilities/tokenHelper'); // Adjust the path as necessary

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: User email verification operations
 */

const verificationController = {
  /**
   * @swagger
   * /email-verification:
   *   get:
   *     tags: [Verification]
   *     summary: Show email verification page
   *     description: Serve the HTML file for the email verification page.
   *     responses:
   *       200:
   *         description: HTML for the email verification page.
   */
  sendVerificationPage: (req, res) => {
    try {
      logger.info('Serving email verification page');
      res.sendFile(path.join(__dirname, '..', 'views', 'email-verification.html'));
    } catch (error) {
      logger.error('Error serving email verification page:', error);
      createAndThrowError('Error serving email verification page', 500, res);
    }
  },

    /**
   * @swagger
   * /verify-email:
   *   get:
   *     tags: [Verification]
   *     summary: Verify user's email
   *     description: Verify the user's email using the token provided as a query parameter.
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         required: true
   *         description: Verification token to validate user's email address.
   *     responses:
   *       200:
   *         description: Email successfully verified.
   *       401:
   *         description: Verification token has expired.
   *       404:
   *         description: Verification token is invalid.
   *       500:
   *         description: Internal Server Error.
   */

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      logger.info('Attempting to verify email with token:', token);

      // Find the user by verification token
      const user = await User.findOne({ where: { verificationToken: token } });
      if (!user) {
        logger.warn('Invalid verification token:', token);
        return res.status(404).send('Verification token is invalid.');
      }

      // Check if the token has expired
      if (new Date() > user.tokenExpiry) {
        logger.warn('Expired verification token:', token);       
        return res.status(401).send('Verification token has expired.');
      }

      // Update user to set email as verified and clear the verification token and expiry
      await user.update({ emailVerified: true, verificationToken: null, tokenExpiry: null });
      logger.info('Email verified successfully for user:', user.id);

      // Generate and store the token in Redis, without including the token in the URL
      await generateAndStoreToken(user, res, false); 

      // Redirect to the dashboard
      //res.redirect('/dashboard');
      res.redirect('/verification-success');

    } catch (error) {
      logger.error('Verification error:', error);
      createAndThrowError('Internal Server Error during email verification', 500, res);  
    }
  }
};


module.exports = verificationController;
