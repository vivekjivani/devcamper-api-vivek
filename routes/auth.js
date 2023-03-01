const express = require("express");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatedDetails,
  updatedPassword,
  logout,
} = require("../controllers/auth");

const { protect } = require("../midlleware/auth");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updatedDetails);
router.put("/updatedpassword", protect, updatedPassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;
