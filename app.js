require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger');
const passport = require('./config/passportConfig');
const auth = require('./config/firebaseConfig');
const sequelize = require('./utilities/sequelize');
const jwt = require('jsonwebtoken');
const multer = require('multer');

// Controllers
const userController = require('./controller/userController');
const verificationController = require('./controller/verificationController');
const dashboardController = require('./controller/dashboardController');
const loginController = require('./controller/loginController'); 
const logoutController = require('./controller/logoutController');
const oauthController = require('./controller/oauthController');
const profileController = require('./controller/profileController');
const adminController = require('./controller/adminController');

// Middlewares
const { sessionMiddleware, redisClient, updateLastSessionTimestamp } = require('./config/redisConfig');
const { ensureAuthenticated } = require('./middlewares/authMiddleware');
const flash = require('express-flash');

const app = express();
const upload = multer();
const port = process.env.PORT;

// Static file serving and view engine setup
app.use(express.static(path.join(__dirname, 'public')));
//app.set('view engine', 'ejs');

// Session management and authentication
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(updateLastSessionTimestamp);

// Middleware for logging session details (can be disabled for production)
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  next();
});

// Middleware for parsing request bodies
// const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Flash messages middleware
app.use(flash());

// Swagger documentation routes
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Authentication routes
app.get('/login', loginController.showLoginPage);
app.post('/login', loginController.loginUser);
app.get('/signup', userController.showSignupPage);
app.post('/signup', upload.none(), userController.signup);

// Google OAuth Routes
app.get('/auth/google', oauthController.initiateGoogleAuth);
app.get('/auth/google/callback', 
  oauthController.handleGoogleCallback,
  oauthController.authenticateGoogle,
  oauthController.postGoogleAuthentication
);

// Email verification route
app.get('/verify-email', verificationController.verifyEmail);
app.get('/email-verification', verificationController.sendVerificationPage);
app.get('/dashboard/resend-verification', dashboardController.resendVerification);

// Dashboard routes 
app.get('/dashboard', dashboardController.accessDashboard, dashboardController.sendDashboard);

// Profile management routes
app.get('/profile', ensureAuthenticated, profileController.viewProfile);
app.post('/profile/updateName', ensureAuthenticated, profileController.updateName);

// Password reset route
app.post('/api/user/reset-password', ensureAuthenticated, (req, res) => {
  userController.handleResetPassword(req, res);
});

// User info and admin dashboard routes
app.get('/api/userinfo', userController.getUserInfo);
app.get('/admin-dashboard', adminController.renderAdminDashboard);
app.get('/api/admin/users', adminController.getAllUsers);
app.get('/api/admin/statistics/totalUsers', ensureAuthenticated, adminController.getTotalUsers);
app.get('/api/admin/statistics/activeToday', ensureAuthenticated, adminController.getActiveUsersToday);
app.get('/api/admin/statistics/averageActivePastWeek', ensureAuthenticated, adminController.getAverageActiveUsersPastWeek);

app.get('/verification-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'verification-success.html'));
});


// Logout route
app.get('/logout', logoutController.logoutUser);

// Database connection and server initialization
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Unable to connect to the database:', err);
});


// Global error handler
app.use((err, req, res, next) => {

  if (err.status) {
    // If the error has a status property, use it
    res.status(err.status).send({ message: err.message });
  } else {
    // If the error doesn't have a status property, default to 500
    res.status(500).send({ message: 'Something broke!' });
  }
});
