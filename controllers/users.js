const asyncMiddleware = require("../midlleware/async");
const User = require("../models/User");
const ErrorResponse = require("../util/errorResponse.js");
const crypto = require("crypto");

// @desc     Get All User
// @route    GET /api/v1/auth/users
// @access   Private
exports.getUsers = asyncMiddleware(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc     Get Single User
// @route    GET /api/v1/auth/users/:id
// @access   Private
exports.getUser = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(`User not Found with id ${req.params.id}`, 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc     Create Single User
// @route    POST /api/v1/auth/users
// @access   Private
exports.createUser = asyncMiddleware(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc     Update User
// @route    PUT /api/v1/auth/users/:id
// @access   Private
exports.updateUser = asyncMiddleware(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc     Delete User
// @route    DELETE /api/v1/auth/users/:id
// @access   Private
exports.deleteUser = asyncMiddleware(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
