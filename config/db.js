const mongoose = require("mongoose")
mongoose.set("strictQuery", false)

const connectDB = async function () {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
    dbName: process.env.MONGO_DB_NAME,
  })
  console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)
}

module.exports = connectDB
