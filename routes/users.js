const express = require("express");
const { createUser, deleteUser, getUser, getUsers, updateUser } = require("../controllers/users");

const User = require("../models/User");

const router = express.Router();

const { protect, authorize } = require("../midlleware/auth");
const advancedResults = require("../midlleware/advancedResult");

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
