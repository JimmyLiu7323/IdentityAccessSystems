const userController = require('../controller/userController'); 
const path = require('path');
const { logger, createAndThrowError } = require('../utilities/logger'); 

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile operations
 */

const profileController = {
      /**
   * @swagger
   * /profile:
   *   get:
   *     tags: [Profile]
   *     summary: View user profile
   *     description: Serve the static HTML file for the user profile.
   *     responses:
   *       200:
   *         description: HTML for the user profile page.
   */
    viewProfile: async (req, res) => {
        try {
            logger.info('Serving profile page for user ID:', req.session?.passport?.user);
            res.sendFile(path.resolve(__dirname, '..', 'views', 'profile.html'));
        } catch (error) {
            logger.error('Error serving profile page:', error);
            createAndThrowError('Error serving profile page', 500, res);
        }
    },

     /**
   * @swagger
   * /profile/updateName:
   *   post:
   *     tags: [Profile]
   *     summary: Update user's name
   *     description: Update the name of the authenticated user.
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: The new name of the user.
   *             required:
   *               - name
   *     responses:
   *       302:
   *         description: Redirect back to the profile page.
   *       500:
   *         description: Server error if the update fails.
   */

     updateName: async (req, res) => {
        try {
            logger.info('Attempting to update name for user ID:', req.session?.passport?.user);
            await userController.updateUserName(req.session.passport.user, req.body.name);
            logger.info('Name updated successfully, redirecting to profile page');
            res.redirect('/profile'); // Redirect back to the profile page
        } catch (error) {
            logger.error('Error updating user name:', error);
            createAndThrowError('Error updating user name', 500, res);
        }
    }
};

module.exports = profileController;
