const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../util/errorResponse");
const asyncHandler = require("./async");

// Protect Routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // set Token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];

    // set Token From cookie
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make Sure Token Exists
  if (!token) {
    return next(new ErrorResponse("Not Authorized to access this route", 401));
  }

  try {
    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorResponse("Not Authorized to access this route", 401));
  }
});

// rant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 401));
    }
    next();
  };
};
