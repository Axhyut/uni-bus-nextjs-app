const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID; // Make sure this is correct

const client = twilio(accountSid, authToken);

if (!accountSid || !authToken || !verifySid) {
  console.error("Twilio credentials are missing! Please check your .env file.");
}

module.exports = { client, verifySid };