const Sequelize = require('sequelize');
const sequelize = require('../utilities/sequelize'); 
const User = require('../model/user'); 

const userActivityLog = sequelize.define('userActivityLog', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'id'
    }
  },
  activityTimestamp: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
});

userActivityLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(userActivityLog, { foreignKey: 'userId' });

module.exports = userActivityLog;
