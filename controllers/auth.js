const asyncMiddleware = require("../midlleware/async");
const User = require("../models/User");
const ErrorResponse = require("../util/errorResponse.js");
const sendEmail = require("../util/sendEmail");
const crypto = require("crypto");

// @desc     Register User
// @route    POST /api/v1/auth/register
// @access   Public
exports.register = asyncMiddleware(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create User
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

// @desc     Login User
// @route    POST /api/v1/auth/login
// @access   Public
exports.login = asyncMiddleware(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse(`Please Provide an email and password`, 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse(`Invalid Credentials`, 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse(`Invalid Credentials`, 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc     Log User Out / clear Cookie
// @route    GET /api/v1/auth/logout
// @access   Private
exports.logout = asyncMiddleware(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc     Get Current logged in User
// @route    POST /api/v1/auth/me
// @access   Private
exports.getMe = asyncMiddleware(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc     Forgot Password
// @route    POST /api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncMiddleware(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`There is no user with email ${req.body.email}`, 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  console.log("🚀 ~ file: auth.js:76 ~ exports.forgotPassword=asyncMiddleware ~ resetToken", resetToken);

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      message,
    });
    res.status(200).json({
      success: true,
      data: "Email sent",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    next(new ErrorResponse("Email Could not be sent", 500));
  }
});

// @desc     Reset Password
// @route    PUT /api/v1/auth/resetpassword/:resettoken
// @access   Public
exports.resetPassword = asyncMiddleware(async (req, res, next) => {
  // Get Hashed Token
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

  const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

  if (!user) {
    return next(new ErrorResponse(`Invalid Token`, 400));
  }

  // Set the new Password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc     Update User Details
// @route    POST /api/v1/auth/updateddetails
// @access   Private
exports.updatedDetails = asyncMiddleware(async (req, res, next) => {
  const fieldToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc     Update Password
// @route    PUT /api/v1/auth/updatepassword
// @access   Private
exports.updatedPassword = asyncMiddleware(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id }).select("+password");

  // Check current Password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get Token From Model, Create Cookie and Send Response
const sendTokenResponse = (user, statusCode, res) => {
  // Create Token
  const token = user.getSignedJwtToken();

  const option = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV == "production") {
    option.secure = true;
  }

  res.status(statusCode).cookie("token", token, option).json({
    success: true,
    token,
  });
};
