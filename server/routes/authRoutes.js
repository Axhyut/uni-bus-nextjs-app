const express = require("express");
const {
  signup,
  checkUserExistence,
  login,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.get("/user/:email", checkUserExistence);
router.post("/admin/login", login);
router.get("/profile/:email", getProfile); // Get profile data
router.patch("/profile/:email", updateProfile); // Update profile

module.exports = router;
