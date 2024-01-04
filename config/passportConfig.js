const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const userController = require('../controller/userController'); // Adjust the path as necessary
const authUtils = require('../utilities/authUtils'); // Import authUtils
const { compareSync } = require('bcrypt');
const UserActivityLog = require('../model/userActivityLog'); // Adjust the path as necessary
const { logger, createAndThrowError } = require('../utilities/logger');

passport.use(new LocalStrategy(
  {
    usernameField: 'email', // Assuming the login form uses 'email' as the field name
    passwordField: 'password' // Assuming the login form uses 'password' as the field name
  },
  async (email, password, done) => {
    logger.info(`LocalStrategy login attempt for email: ${email}`);  
    try {      
      const user = await userController.findUserByEmail(email);
      if (!user) {
        logger.warn(`LocalStrategy: User not found for email: ${email}`);       
        return done(null, false, { message: 'Incorrect email.' });
      }
      const isValid = await authUtils.comparePassword(password, user.password);
      if (!isValid) {
        logger.warn(`LocalStrategy: Invalid password for email: ${email}`);      
        return done(null, false, { message: 'Incorrect password.' });
      }

        // Update last session timestamp
        user.lastSessionTimestamp = new Date();
        await user.save();
        logger.info(`LocalStrategy: Last session timestamp updated for user ID: ${user.id}`);

        // Log the activity
      await logUserActivity(user.id);

      logger.info(`LocalStrategy: User authenticated successfully for email: ${email}`);     
      return done(null, user);
    } catch (error) {
      logger.error("LocalStrategy Error: ", error);
      return done(createAndThrowError('An error occurred during local authentication', error));  
    }
  }
));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  state: true // Ensure state parameter is used to protect against CSRF
},
async function(accessToken, refreshToken, profile, cb) {
  logger.info(`GoogleStrategy login attempt for Google ID: ${profile.id}`);   
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    
    logger.info(`GoogleStrategy: Finding or creating user for email: ${email}`);     
    let user = await userController.findUserByEmail(email);
    if (!user) {
      logger.info(`GoogleStrategy: No user found, creating new user for email: ${email}`);       
      user = await userController.createUser({
        username: email,
        name: name, // Save the name from Google OAuth
        isGoogleOAuth: true
      });
      logger.info(`GoogleStrategy: New user created with ID: ${user.id} for email: ${email}`);    
    } else if (user.isGoogleOAuth) {
      logger.info(`GoogleStrategy: Existing Google OAuth user found for email: ${email}`);    
      // Update the name if it's a Google OAuth user
      user.name = name;
      user.loginCount += 1; // Increment login count
      user.lastSessionTimestamp = new Date();
      await user.save();
      logger.info(`GoogleStrategy: User data updated for user ID: ${user.id}`);   
    }

     // Log the activity
     await logUserActivity(user.id);
     logger.info(`GoogleStrategy: Successful authentication for user ID: ${user.id}`);    
    cb(null, user); 
  } catch (error) {
    logger.error("GoogleStrategy Error: ", error);
    cb(createAndThrowError('An error occurred during Google authentication', error)); 
  }
}
));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userController.getUserById(id);
    if (!user) {
      // If no user is found with the ID, we call done with 'false' to indicate an unsuccessful retrieval.
      return done(null, false);
    }
    // If a user is found, we proceed normally.
    done(null, user);
  } catch (error) {
    logger.error("deserializeUser Error: ", error);
    done(error, null);
  }
});



async function logUserActivity(userId) {
  try {
    await UserActivityLog.create({
      userId: userId,
      activityTimestamp: new Date()
    });
    logger.info("User activity logged for user ID: " + userId);
  } catch (error) {
    logger.error("Error creating UserActivityLog entry:", error);
  }
}

module.exports = passport;
