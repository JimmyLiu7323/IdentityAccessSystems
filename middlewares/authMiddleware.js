

function ensureAuthenticated(req, res, next) {
    console.log("ensureAuthenticated: Checking authentication status");
  
    // Log the session ID
    console.log(" ensureAuthenticated Session ID:", req.sessionID);

    if (req.isAuthenticated()) {
        console.log("ensureAuthenticated: User is authenticated");
        return next();
    } else {
        console.log("ensureAuthenticated: User is not authenticated. Redirecting to /login");
        res.redirect('/login');
    }
  }


  module.exports = { ensureAuthenticated };