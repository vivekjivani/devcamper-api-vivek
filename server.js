require("colors");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const connectDB = require("./config/db");
const errorHandler = require("./midlleware/error");
const path = require("path");

// Load env var
dotenv.config({ path: "./config/config.env" });

connectDB();

// Route Files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const user = require("./routes/users");
const reviews = require("./routes/reviews");

const app = express();

// Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// dev logging middleware
if (process.env.NODE_ENV == "development") {
  app.use(morgan("dev"));
}

// File Upload Middleware
app.use(fileUpload());

// Sanitize User inputs
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// prevent cross site scripting
app.use(xss());

// Rate Limit Middleware
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Static Folder
app.use(express.static(path.join(__dirname, "public")));

// Mount Routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", user);
app.use("/api/v1/reviews", reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async function () {
  console.log(`Server Running in ${process.env.NODE_ENV} on port ${PORT}`.yellow.bold);
});

// Handle unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Error: ${err.message}`.red);
  // close server and exit process
  server.close(() => process.exit(1));
});
