const passport = require('passport');
const { logger, createAndThrowError } = require('../utilities/logger');


/**
 * @swagger
 * tags:
 *   name: OAuth
 *   description: OAuth authentication
 */

const oauthController = {
     /**
   * @swagger
   * /auth/google:
   *   get:
   *     tags: [OAuth]
   *     summary: Initiate Google OAuth flow
   *     description: Redirects to Google for OAuth authentication.
   *     responses:
   *       302:
   *         description: Redirects to Google OAuth page.
   */
    initiateGoogleAuth: (req, res, next) => {
        logger.info('Initiating Google OAuth flow');
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    },

    handleGoogleCallback: (req, res, next) => {
        logger.info('Received callback from Google, processing authentication');
        passport.authenticate('google', {
            successRedirect: '/dashboard',
            failureRedirect: '/login',
            failureFlash: true
        })(req, res, next);
    },

    authenticateGoogle: passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),

    postGoogleAuthentication: (req, res) => {
        logger.info('Google authentication was successful, redirecting to dashboard.');
        if (req.session && req.session.passport && req.session.passport.user) {
            logger.info('Authenticated User:', req.session.passport.user);
        }
        res.redirect('/dashboard');
    }
};

module.exports = oauthController;
