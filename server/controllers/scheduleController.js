//scheduleController.js
const { PNR, Schedule, Driver, Passenger, sequelize } = require("../models");
const {
  sendEmail,
  generatePassengerEmail,
  generateDriverEmail,
  generateRideCompletionPassengerEmail,
  generateRideCompletionDriverEmail,
} = require("../utils/emailService");
const { Op, where } = require("sequelize");

// Generate OTP email content
const generateOtpEmail = (otp, driverName) => {
  const subject = "Ride Completion OTP";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Ride Completion Verification</h2>
      <p>Dear Passenger,</p>
      <p>Your driver ${driverName} has initiated the ride completion process.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0; color: #333; text-align: center;">Your OTP</h3>
        <p style="font-size: 32px; font-weight: bold; text-align: center; margin: 10px 0; letter-spacing: 5px;">
          ${otp}
        </p>
        <p style="color: #666; text-align: center; margin: 0;">
          This OTP will expire in 5 minutes
        </p>
      </div>

      <p>Please share this OTP with your driver to complete the ride.</p>
      <p>If you didn't request this OTP, please contact our support team immediately.</p>
    </div>
  `;

  return { subject, html };
};

const sendOtp = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { scheduleId } = req.params;

    // Find the schedule with driver details
    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        status: "busy", // Only allow OTP generation for ongoing rides
      },
      include: [
        {
          model: Driver,
          as: "driver",
          attributes: ["firstName", "lastName"],
        },
      ],
      transaction,
    });

    if (!schedule) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "No active ride found for this schedule",
      });
    }

    // Find the PNR record with passenger details
    const pnr = await PNR.findOne({
      where: {
        scheduleId,
        status: "active",
      },
      include: [
        {
          model: Passenger,
          as: "passenger",
          attributes: ["email", "firstName", "lastName"],
        },
      ],
      transaction,
    });

    if (!pnr) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "No active booking found for this schedule",
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes from now

    // Update PNR with OTP details
    await pnr.update(
      {
        otp,
        otpExpiresAt,
        otpAttempts: 0, // Reset attempts when generating new OTP
      },
      { transaction }
    );

    // Send OTP email
    const driverName = `${schedule.driver.firstName} ${schedule.driver.lastName}`;
    const emailContent = generateOtpEmail(otp, driverName);

    await sendEmail(pnr.passenger.email, emailContent);

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to passenger email",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in sendOtp:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const verifyOtp = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { scheduleId } = req.params;
    const { otp, pnrId } = req.body;

    // Validate input
    if (!otp || !pnrId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "OTP and PNR ID are required",
      });
    }

    // Find PNR record
    const pnr = await PNR.findOne({
      where: {
        PNRid: pnrId,
        scheduleId,
        status: "active",
      },
      include: [
        { model: Passenger, as: "passenger" },
        { model: Driver, as: "driver" },
      ],
      transaction,
    });

    if (!pnr) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if OTP is expired
    if (new Date() > pnr.otpExpiresAt) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Check OTP attempts
    if (pnr.otpAttempts >= 3) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (pnr.otp !== otp) {
      await pnr.increment("otpAttempts", { transaction });
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update PNR and Schedule status
    await Promise.all([
      pnr.update(
        {
          status: "completed",
          otp: null,
          otpExpiresAt: null,
          completedAt: new Date(),
        },
        { transaction }
      ),

      Schedule.update(
        {
          status: "completed",
          completedAt: new Date(),
        },
        {
          where: { id: scheduleId },
          transaction,
        }
      ),

      Driver.update(
        {
          wallet: sequelize.literal(`wallet + ${pnr.fare}`),
          where: { id: pnr.driverId },
          transaction,
        }
      )
    ]);

    // Commit transaction
    await transaction.commit();

    // Send ride completion emails to passenger and driver
    const passengerCompletionEmailContent =
      generateRideCompletionPassengerEmail(pnr, pnr.driver);
    const driverCompletionEmailContent = generateRideCompletionDriverEmail(
      pnr,
      pnr.passenger
    );

    const passengerCompletionEmailSent = await sendEmail(
      pnr.passenger.email,
      passengerCompletionEmailContent
    );
    const driverCompletionEmailSent = await sendEmail(
      pnr.driver.email,
      driverCompletionEmailContent
    );

    // Log email status
    console.log(
      "Passenger completion email sent:",
      passengerCompletionEmailSent
    );
    console.log("Driver completion email sent:", driverCompletionEmailSent);

    res.status(200).json({
      success: true,
      message:
        "Ride completed successfully, and emails sent to both passenger and driver",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in verifyOtp:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addSchedule = async (req, res) => {
  try {
    const {
      driverId,
      pickupLocation,
      dropoffLocation,
      date,
      timeFrom,
      timeTo,
      status,
    } = req.body;

    console.log("Adding schedule:", req.body);

    // Validate required fields
    if (
      !driverId ||
      !pickupLocation ||
      !dropoffLocation ||
      !date ||
      !timeFrom ||
      !timeTo
    ) {
      return res.status(400).json({
        error:
          "All fields are required: driverId, pickupLocation, dropoffLocation, date, timeFrom, timeTo",
      });
    }

    // Check driver status and availability
    const driver = await Driver.findOne({
      where: {
        id: driverId,
        status: "active",
        isAvailable: true,
      },
    });

    if (!driver) {
      return res.status(400).json({
        error: "Driver must be active and available to create schedules",
      });
    }

    // Validate date is not in the past
    const scheduleDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      return res.status(400).json({
        error: "Schedule date cannot be in the past",
      });
    }

    // Check for overlapping schedules for the same driver
    const overlappingSchedule = await Schedule.findOne({
      where: {
        driverId,
        date,
        status: "active",
        [Op.or]: [
          {
            timeFrom: {
              [Op.between]: [timeFrom, timeTo],
            },
          },
          {
            timeTo: {
              [Op.between]: [timeFrom, timeTo],
            },
          },
          {
            [Op.and]: [
              {
                timeFrom: {
                  [Op.lte]: timeFrom,
                },
              },
              {
                timeTo: {
                  [Op.gte]: timeTo,
                },
              },
            ],
          },
        ],
      },
    });

    if (overlappingSchedule) {
      return res.status(409).json({
        error: "You already have a schedule during this time period",
      });
    }

    // Create new schedule
    const newSchedule = await Schedule.create({
      driverId,
      pickupLocation,
      dropoffLocation,
      date,
      timeFrom,
      timeTo,
      status: status || "active", // Default to active if not provided
    });

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error("Error adding schedule:", error);
    res.status(500).json({
      error: "Internal server error while creating schedule",
      details: error.message,
    });
  }
};

const getDriverSchedules = async (req, res) => {
  try {
    const { driverId } = req.params;

    const schedules = await Schedule.findAll({
      where: {
        driverId,
      },
      order: [
        ["status", "ASC"],
        ["date", "ASC"],
        ["timeFrom", "ASC"],
      ],
    });

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({
      error: "Internal server error while fetching schedules",
      details: error.message,
    });
  }
};

const cancelSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findByPk(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        error: "Schedule not found",
      });
    }

    if (schedule.status !== "active") {
      return res.status(400).json({
        error: "Only active schedules can be cancelled",
      });
    }

    await schedule.update({ status: "cancelled" });

    res.status(200).json({
      message: "Schedule cancelled successfully",
      schedule,
    });
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    res.status(500).json({
      error: "Internal server error while cancelling schedule",
      details: error.message,
    });
  }
};

const checkAvailableVehicles = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, date, time, distance } = req.body;
    const requestedTime = time;

    // Input validation
    if (!pickupLocation || !dropoffLocation || !date || !time || !distance) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    console.log("Checking available vehicles:", req.body);

    // Detect the user's device from the user-agent
    const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
    const isAndroid = userAgent.indexOf("android") > -1;
    const isIOS =
      userAgent.indexOf("iphone") > -1 ||
      userAgent.indexOf("ipad") > -1 ||
      userAgent.indexOf("ipod") > -1;

    // Determine platform category (mobile or desktop)
    let platformCategory = "desktop"; // Default to desktop for web users

    if (isAndroid || isIOS) {
      platformCategory = "mobile";
    } else if (userAgent.indexOf("mobile") > -1) {
      // Catch other mobile browsers that aren't specifically Android or iOS
      platformCategory = "mobile";
    }

    console.log(
      `User platform: ${platformCategory} (${
        isAndroid ? "Android" : isIOS ? "iOS" : "Web/Desktop"
      })`
    );

    // Extract city and state from locations
    const pickupCityState = extractCityState(pickupLocation);
    const dropoffCityState = extractCityState(dropoffLocation);

    console.log("Extracted pickup city/state:", pickupCityState);
    console.log("Extracted dropoff city/state:", dropoffCityState);

    // First get schedules for the requested date and time
    const schedules = await Schedule.findAll({
      where: {
        date: date,
        status: "active",
        timeFrom: {
          [Op.lte]: requestedTime,
        },
        timeTo: {
          [Op.gte]: requestedTime,
        },
      },
      include: [
        {
          model: Driver,
          as: "driver",
          where: {
            status: "active",
            isAvailable: true,
          },
          attributes: [
            "id",
            "firstName",
            "lastName",
            "vehicleType",
            "vehicleNumber",
            "rating",
          ],
        },
      ],
      order: [["driver", "rating", "DESC"]],
    });

    console.log(
      `Found ${schedules.length} schedules matching date/time criteria`
    );

    // Filter schedules by location matching using city and state
    const matchingSchedules = schedules.filter((schedule) => {
      const dbPickupCityState = extractCityState(schedule.pickupLocation);
      const dbDropoffCityState = extractCityState(schedule.dropoffLocation);

      const pickupMatches = cityStateMatch(dbPickupCityState, pickupCityState);
      const dropoffMatches = cityStateMatch(
        dbDropoffCityState,
        dropoffCityState
      );

      return pickupMatches && dropoffMatches;
    });

    console.log(
      `After location filtering: ${matchingSchedules.length} schedules match`
    );

    // If no matching schedules found, return a proper response
    if (!matchingSchedules || matchingSchedules.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No vehicles available for the selected route and time",
        vehicles: {},
      });
    }

    // Calculate prices based on platform category
    // Different base rates for mobile (with Android having lower rates) and desktop
    const baseRates = {
      mobile: {
        android: {
          hatchback: 8,
          sedan: 10,
          msuv: 12,
          convertible: 17,
          coupe: 15,
          wagon: 10,
          jeep: 15,
          van: 10,
        },
        ios: {
          hatchback: 12,
          sedan: 14,
          msuv: 18,
          convertible: 23,
          coupe: 21,
          wagon: 14,
          jeep: 21,
          van: 14,
        },
        default: {
          // For other mobile browsers
          hatchback: 11,
          sedan: 13,
          msuv: 16,
          convertible: 21,
          coupe: 19,
          wagon: 13,
          jeep: 19,
          van: 13,
        },
      },
      desktop: {
        // Desktop/web users
        hatchback: 10,
        sedan: 12,
        msuv: 15,
        convertible: 20,
        coupe: 18,
        wagon: 12,
        jeep: 18,
        van: 12,
      },
    };

    // Group vehicles by type and include driver info
    const groupedVehicles = matchingSchedules.reduce((acc, schedule) => {
      const driver = schedule.driver;
      const vehicleType = driver.vehicleType;

      // Determine which rate to use based on device type
      let rateCategory;
      if (platformCategory === "mobile") {
        if (isAndroid) {
          rateCategory = baseRates.mobile.android;
        } else if (isIOS) {
          rateCategory = baseRates.mobile.ios;
        } else {
          rateCategory = baseRates.mobile.default;
        }
      } else {
        rateCategory = baseRates.desktop;
      }

      // Pricing configuration
      const baseRate = rateCategory[vehicleType] || 15; // Default if vehicle type not found

      // Set fees based on platform
      let bookingFee, serviceFee, blackCarFund;

      if (platformCategory === "mobile") {
        if (isAndroid) {
          bookingFee = Math.floor(Math.random() * 5) + 1;
          serviceFee = 2.5;
          blackCarFund = 0.25;
        } else if (isIOS) {
          bookingFee = Math.floor(Math.random() * 10) + 3;
          serviceFee = 3.99;
          blackCarFund = 0.5;
        } else {
          // Other mobile browsers
          bookingFee = Math.floor(Math.random() * 7) + 2;
          serviceFee = 2.99;
          blackCarFund = 0.35;
        }
      } else {
        // Desktop/web users
        bookingFee = Math.floor(Math.random() * 6) + 2;
        serviceFee = 2.75;
        blackCarFund = 0.3;
      }

      const taxRate = 0.18; // Tax rate remains same as it's regulated

      // Price calculations
      const basePrice = distance * baseRate;
      const roundedBase = Math.round(basePrice);
      const serviceTax = roundedBase * taxRate;

      // Total price with proper rounding
      const totalPrice =
        roundedBase + bookingFee + serviceFee + blackCarFund + serviceTax;
      const formattedPrice = `₹${totalPrice.toFixed(2)}`;

      const deviceType = isAndroid
        ? "Android"
        : isIOS
        ? "iOS"
        : platformCategory === "mobile"
        ? "Other Mobile"
        : "Desktop/Web";

      const vehicleInfo = {
        scheduleId: schedule.id,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        rating: parseFloat(driver.rating),
        vehicleNumber: driver.vehicleNumber,
        price: formattedPrice,
        fareBreakdown: {
          base: roundedBase,
          bookingFee: bookingFee,
          serviceFee: serviceFee,
          blackCarFund: blackCarFund,
          serviceTax: serviceTax.toFixed(2),
          platformType: platformCategory,
          deviceType: deviceType, // For debugging
        },
        pickupTime: schedule.timeFrom,
        dropoffTime: schedule.timeTo,
      };

      // Grouping logic
      if (!acc[vehicleType]) acc[vehicleType] = [];
      acc[vehicleType].push(vehicleInfo);
      acc[vehicleType].sort((a, b) => b.rating - a.rating);

      return acc;
    }, {});

    res.status(200).json({
      success: true,
      vehicles: groupedVehicles,
    });
  } catch (error) {
    console.error("Error checking available vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while checking vehicle availability",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function to extract city and state from address string
function extractCityState(location) {
  if (!location) return { city: null, state: null };

  // Split by commas and clean each part
  const parts = location.split(",").map((part) => part.trim());

  // For Indian addresses, typically format is:
  // [Street/Area], [Landmark], [Village/Town], [City], [District], [State], [Country], [PIN]

  // Initialize result
  let result = { city: null, state: null };

  // Try to identify state (typically second-to-last before country or last if no country)
  const stateIndex = parts.length >= 2 ? parts.length - 2 : parts.length - 1;
  let potentialState = parts[stateIndex];

  // Common Indian states
  const indianStates = [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "tamil nadu",
    "telangana",
    "tripura",
    "uttar pradesh",
    "uttarakhand",
    "west bengal",
  ];

  // Find state in the address
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    if (indianStates.some((state) => part.includes(state))) {
      result.state = parts[i];
      break;
    }
  }

  // City is typically before the state
  // We'll look for the entry that's not a PIN code and not "India"
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Skip if it's a PIN code (6 digits) or "India" or the state
    if (
      /^\d{6}$/.test(part.replace(/\s/g, "")) ||
      part.toLowerCase() === "india" ||
      part === result.state
    ) {
      continue;
    }

    // Check if it's a likely city name
    if (part.length > 2 && !/^\d+$/.test(part)) {
      result.city = part;
      // Once we find a city, we don't need cities from earlier in the string
      // which are likely villages or neighborhoods
      break;
    }
  }

  return result;
}

// Helper function to check if city/state objects match
function cityStateMatch(location1, location2) {
  // If we have both city and state in both locations, compare both
  if (location1.city && location1.state && location2.city && location2.state) {
    return (
      compareLocationParts(location1.city, location2.city) &&
      compareLocationParts(location1.state, location2.state)
    );
  }

  // If we have at least one city and one state, check if they match
  if (location1.city && location2.city) {
    return compareLocationParts(location1.city, location2.city);
  }

  if (location1.state && location2.state) {
    return compareLocationParts(location1.state, location2.state);
  }

  // If we don't have enough information, fallback to exact match
  return false;
}

// Helper function to compare location parts
function compareLocationParts(part1, part2) {
  if (!part1 || !part2) return false;

  part1 = part1.toLowerCase();
  part2 = part2.toLowerCase();

  // Check for exact match
  if (part1 === part2) return true;

  // Check if one contains the other
  if (part1.includes(part2) || part2.includes(part1)) return true;

  // Check for significant part match (e.g., "Tezpur" matches "North Tezpur")
  const words1 = part1.split(/\s+/);
  const words2 = part2.split(/\s+/);

  for (const word1 of words1) {
    if (word1.length <= 2) continue; // Skip short words

    for (const word2 of words2) {
      if (word2.length <= 2) continue;

      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        return true;
      }
    }
  }

  return false;
}

// Add new endpoint to get PNR details by schedule ID
const getPnrBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const pnr = await PNR.findOne({
      where: {
        scheduleId,
        status: "active",
      },
      include: [
        {
          model: Passenger,
          as: "passenger",
          attributes: ["firstName", "lastName", "phoneNumber"],
        },
      ],
    });

    if (!pnr) {
      return res.status(404).json({
        success: false,
        message: "No active booking found for this schedule",
      });
    }

    res.status(200).json({
      success: true,
      booking: {
        pnr: pnr.PNRid,
        passenger: {
          name: `${pnr.passenger.firstName} ${pnr.passenger.lastName}`,
          phoneNumber: pnr.passenger.phoneNumber,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching PNR details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking details",
    });
  }
};

module.exports = {
  addSchedule,
  getDriverSchedules,
  cancelSchedule,
  checkAvailableVehicles,
  sendOtp,
  verifyOtp,
  getPnrBySchedule,
};
