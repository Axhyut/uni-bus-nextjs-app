const { Driver, Passenger, Admin } = require('../models'); // Import models
const { client, verifySid } = require('../config/twilio'); // Import Twilio config

// Function to handle user signup
const signup = async (req, res) => {
  const { email, firstName, lastName, phoneNumber, userType, gender, licenseNumber, vehicleNumber, vehicleType, isAvailable, licenseValidity } = req.body;

  try {
    // Check user type and create accordingly
    if (userType === 'driver') {
      const newDriver = await Driver.create({
        email,
        firstName,
        lastName,
        phoneNumber,
        licenseNumber,
        vehicleNumber,
        vehicleType,
        gender,
        isAvailable,
        status: 'inactive',
        licenseValidity,
        rating: 5.0
      });
      return res.status(201).json({ message: 'Driver registered successfully', driver: newDriver });
    } else if (userType === 'passenger') {
      const newPassenger = await Passenger.create({
        email,
        firstName,
        lastName,
        phoneNumber,
        gender,
        status: 'active'
      });
      return res.status(201).json({ message: 'Passenger registered successfully', passenger: newPassenger });
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
};

// Function to check if user already exists
const checkUserExistence = async (req, res) => {
  const { email } = req.params;
  console.log('Checking existence for email:', email);

  try {
    // Check in Driver collection
    const driver = await Driver.findOne({ where: { email } });
    if (driver) {
      return res.json({ exists: true, userType: 'driver', userName: driver.firstName, driverId: driver.id, status: driver.status });
    }

    // Check in Passenger collection
    const passenger = await Passenger.findOne({ where: { email } });
    if (passenger) {
      return res.json({ exists: true, userType: 'passenger', userName: passenger.firstName, passengerId: passenger.id });
    }

    // If user not found in either collection
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error checking user existence:', error);
    return res.status(500).json({ error: 'An error occurred while checking user existence' });
  }
};

// Function to handle admin login
const login = async (req, res) => {
  const { admin_name, password } = req.body;

  try {
    // Find admin by admin_name
    const admin = await Admin.findOne({
      where: { admin_name }
    });

    if (!admin || password !== admin.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      success: true,
      admin: {
        admin_id: admin.admin_id,
        admin_name: admin.admin_name
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
};

// ✅ **NEW FUNCTION TO SEND OTP**
const sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: phone, channel: 'sms' });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ **NEW FUNCTION TO VERIFY OTP**
const verifyOTP = async (req, res) => {
  const { phone, verificationCode } = req.body;

  if (!phone || !verificationCode) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
  }

  try {
    const result = await client.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: phone, code: verificationCode });

    if (result.status === 'approved') {
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  signup,
  checkUserExistence,
  login,
  sendOTP,
  verifyOTP
};