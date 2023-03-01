const ErrorResponse = require("../util/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log Console for dev
  console.log(err);

  // Mongoose Bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not Found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose Duplicate key Error
  if (err.code === 11000) {
    const message = `Duplicate Fields Value Entered`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((v) => v.message);
    error = new ErrorResponse(message, 400);
  }
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
