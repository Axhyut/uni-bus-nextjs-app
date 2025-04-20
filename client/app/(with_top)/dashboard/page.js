"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/components/firebase/firebaseconfig";
import Navbar from "@/components/Navbar";
import DriverScheduleApp from "@/components/driver/DriverScheduleApp";
import PendingVerification from "@/components/driver/PendingVerification";
import LicenseExpired from "@/components/driver/LicenseExpired";

const Dashboard = () => {
  const [isDriverAccount, setIsDriverAccount] = useState(false);
  const [driverStatus, setDriverStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Function to fetch user data
  const fetchUserData = async (email) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/user/${email}`);
      const userData = response.data;

      setIsDriverAccount(userData.userType === "driver");
      setIsLoggedIn(userData.userType === "driver");
      setDriverStatus(userData.status);

      if (userData.userType === "driver") {
        setDriverId(userData.driverId);
      }
    } catch (error) {
      console.error("1Error checking user registration:", error);
      setIsLoggedIn(false);
      setIsDriverAccount(false);
      setDriverId(null);
      setDriverStatus(null);
    }
  };

  useEffect(() => {
    let interval;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        fetchUserData(user.email);

        // Polling every 5 seconds to check for updates
        interval = setInterval(() => fetchUserData(user.email), 5000);
      } else {
        setIsLoggedIn(false);
        setIsDriverAccount(false);
        setDriverId(null);
        setDriverStatus(null);
      }
    });

    return () => {
      unsubscribe();
      clearInterval(interval); // Clean up interval when component unmounts
    };
  }, []);

  return (
    <>
      <Navbar />
      {isDriverAccount && driverStatus === "inactive" ? (
        <PendingVerification />
      ) : isDriverAccount && driverStatus === "expired" ? (
        <LicenseExpired />
      ) : (
        <DriverScheduleApp />
      )}
    </>
  );
};

export default Dashboard;
