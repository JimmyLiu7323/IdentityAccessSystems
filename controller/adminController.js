const path = require('path');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const User = require('../model/user'); 
const moment = require('moment'); 
const UserActivityLog = require('../model/userActivityLog'); 
const { logger, createAndThrowError } = require('../utilities/logger');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

const adminController = {
    /**
   * @swagger
   * /admin-dashboard:
   *   get:
   *     tags: [Admin]
   *     summary: Render the admin dashboard
   *     description: Display the admin dashboard page to the user if they are authenticated and have the 'admin' role.
   *     responses:
   *       200:
   *         description: Admin dashboard page.
   *       403:
   *         description: Access Denied - User is not authorized to access this page.
   */
  renderAdminDashboard: (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      // Use the error utility function to handle unauthorized access
      createAndThrowError('Access Denied', 403);
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'adminDashboard.html'));
  },

    /**
   * @swagger
   * /api/admin/users:
   *   get:
   *     tags: [Admin]
   *     summary: Get all users
   *     description: Retrieve a list of all users if the requester is authenticated and has the 'admin' role.
   *     responses:
   *       200:
   *         description: A JSON array of user objects.
   *       403:
   *         description: Unauthorized - Only accessible by users with the 'admin' role.
   */
  getAllUsers: (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      createAndThrowError('Unauthorized', 403);
    }

    User.findAll({
      attributes: ['signUpTimestamp', 'loginCount', 'lastSessionTimestamp', 'name', 'username'],
    })
    .then(users => res.json(users))
    .catch(err => {
      logger.error('Error fetching users:', err);
      createAndThrowError('Internal server error', 500); // Use the error utility function
    });
  },

    /**
   * @swagger
   * /api/admin/statistics/totalUsers:
   *   get:
   *     tags: [Admin]
   *     summary: Get total number of users
   *     description: Retrieve the total count of users if the requester is authenticated and has the 'admin' role.
   *     responses:
   *       200:
   *         description: Total count of registered users.
   *       403:
   *         description: Unauthorized - Only accessible by users with the 'admin' role.
   */
  getTotalUsers: async (req, res) => {
    try {
      const totalUsers = await User.count();
      res.json({ totalUsers });
    } catch (err) {
      logger.error('Error fetching total users:', err);     
      createAndThrowError('Internal server error', 500);
    }
  },

    /**
   * @swagger
   * /api/admin/statistics/activeToday:
   *   get:
   *     tags: [Admin]
   *     summary: Get number of active users today
   *     description: Retrieve the count of users who have been active today if the requester is authenticated and has the 'admin' role.
   *     responses:
   *       200:
   *         description: Count of active users today.
   *       403:
   *         description: Unauthorized - Only accessible by users with the 'admin' role.
   */
  getActiveUsersToday: async (req, res) => {
    try {
      const today = moment().startOf('day');
      logger.info('Today’s date for query:', today.toDate());

      const activeToday = await User.count({
        where: {
          lastSessionTimestamp: {
            [Op.gte]: today.toDate(), // Using Op from User model
          },
        },
      });
      logger.info('Total active users today:', activeToday);

      res.json({ activeToday });
    } catch (err) {
      logger.error('Error fetching active users today:', err);
      createAndThrowError('Internal server error', 500);
     }
  },

   /**
   * @swagger
   * /api/admin/statistics/averageActivePastWeek:
   *   get:
   *     tags: [Admin]
   *     summary: Get average number of active users in the past week
   *     description: Retrieve the average count of active users in the last 7 days if the requester is authenticated and has the 'admin' role.
   *     responses:
   *       200:
   *         description: Average count of active users in the last 7 days.
   *       403:
   *         description: Unauthorized - Only accessible by users with the 'admin' role.
   */
  getAverageActiveUsersPastWeek: async (req, res) => {
    try {
      const oneWeekAgo = moment().subtract(7, 'days').startOf('day');
      logger.info('Date one week ago for query:', oneWeekAgo.toDate());

      // Assuming that "UserActivityLog" is the model that logs each user activity
      const activitiesLastWeek = await UserActivityLog.findAll({
        where: {
          activityTimestamp: {
            [Op.gte]: oneWeekAgo.toDate(),
          },
        },
        attributes: [
          [Sequelize.fn('date', Sequelize.col('activityTimestamp')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('userId'))), 'userCount']
        ],
        group: [Sequelize.fn('date', Sequelize.col('activityTimestamp'))]
      });
  
      logger.info('Fetched activities for average calculation:', activitiesLastWeek);

      // Calculate average
      const sumOfCounts = activitiesLastWeek.reduce((sum, record) => sum + record.get('userCount'), 0);
      const averageActivePastWeek = sumOfCounts / 7;
      logger.info('Average active users in the last 7 days:', averageActivePastWeek);

      res.json({ averageActivePastWeek: Math.round(averageActivePastWeek) });
    } catch (err) {
      logger.error('Error fetching average active users:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = adminController;
