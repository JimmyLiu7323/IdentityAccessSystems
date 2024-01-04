const RedisStore = require('connect-redis').default; 
const redis = require('redis');
const session = require('express-session');
const User = require('../model/user'); // Make sure to import your User model
const { logger, createAndThrowError } = require('../utilities/logger');

const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379,
});

redisClient.connect()
  .then(() => logger.info('Connected to Redis successfully.'))
  .catch(error => {
    logger.error('Redis connection error:', error);
    createAndThrowError('Failed to connect to Redis.', error);
  });

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
});

const updateLastSessionTimestamp = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            await User.update(
                { lastSessionTimestamp: new Date() },
                { where: { id: req.session.userId } }
            );
            logger.info(`Session timestamp updated for user ${req.session.userId}`);
        } catch (error) {
            logger.error(`Error updating session timestamp for user ${req.session.userId}:`, error);
        }
    }
    next();
};

module.exports = { sessionMiddleware, redisClient, updateLastSessionTimestamp };
