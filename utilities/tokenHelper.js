const jwt = require('jsonwebtoken');
const redisClient = require('../config/redisConfig').redisClient; // Import Redis client from redisConfig
const { logger, createAndThrowError } = require('../utilities/logger'); // Adjust the path as necessary

const generateAndStoreToken = async (user, res, includeUrlWithToken = false) => {
  try {
    // Increment the user's login count
    user.loginCount += 1;
    await user.save();

    // Generate a token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Store the token in Redis
    const redisKey = `user_token:${user.id}`;
    await redisClient.set(redisKey, token, 'EX', 3600);

    // Optionally create a URL with the token as a query parameter
    if (includeUrlWithToken) {
      const urlWithToken = `http://localhost:3000?token=${encodeURIComponent(token)}`;
      res.json({ success: true, urlWithToken });
    }

  } catch (updateError) {
    logger.error('Error updating login count or storing token:', updateError);
    res.status(500).send('An error occurred while updating login information or storing token.');
  }
};

module.exports = generateAndStoreToken;

