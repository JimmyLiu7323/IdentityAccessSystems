const winston = require('winston'); // Using Winston for logging
const path = require('path');

// Define the log file path
const logFilePath = path.join(__dirname, '..', 'combined.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFilePath }) // This line adds the file transport
  ],
});

// Error utility function
function createAndThrowError(message, status) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

// Export both logger and createAndThrowError
module.exports = { logger, createAndThrowError };
