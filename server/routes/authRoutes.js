const express = require('express');
const { 
  signup,  
  checkUserExistence, 
  login, 
  sendOTP, 
  verifyOTP 
} = require('../controllers/authController'); // Import all functions

const router = express.Router();

// ✅ Existing Routes
router.post('/signup', signup);
router.get('/user/:email', checkUserExistence);
router.post('/admin/login', login);

// ✅ New OTP Routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;