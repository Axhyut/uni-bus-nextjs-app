"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/components/firebase/firebaseconfig";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";

const WalletPage = () => {
  const [profileData, setProfileData] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("");
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchProfile = async (email) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/profile/${email}`);
      setProfileData(response.data);
      setUserType(response.data.userType);
      setLoading(false);
    } catch (error) {
      setError("Failed to load wallet data");
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        fetchProfile(user.email);
        // Set up refresh interval
        // intervalId = setInterval(() => {
        //   fetchProfile(user.email);
        // }, 5000);
      } else {
        setLoading(false);
        setError("User not authenticated");
        // if (intervalId) clearInterval(intervalId);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      // if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const result = await Swal.fire({
      title: "Add Funds?",
      text: `Are you sure you want to add ₹${amount} to your wallet?`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add funds!",
    });

    if (result.isConfirmed) {
      try {
        const currentWallet = parseFloat(profileData.wallet) || 0;
        const updatedWallet = currentWallet + parseFloat(amount);

        const updatedProfile = {
          ...profileData,
          wallet: updatedWallet,
        };

        const response = await axios.patch(
          `${BASE_URL}/api/auth/profile/${auth.currentUser.email}`,
          updatedProfile
        );

        setProfileData(response.data);
        setAmount("");
        Swal.fire({
          title: "Success!",
          text: `₹${amount} added to your wallet`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Transaction Failed",
          text: error.response?.data?.message || "Could not add funds",
          icon: "error",
        });
      }
    }
  };

  const handleWithdrawFunds = async (e) => {
    e.preventDefault();
    setError("");

    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const result = await Swal.fire({
      title: "Withdraw Funds?",
      text: `Are you sure you want to withdraw ₹${amount} from your wallet?`,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, withdraw funds!",
    });

    if (result.isConfirmed) {
      try {
        const currentWallet = parseFloat(profileData.wallet) || 0;
        const withdrawalAmount = parseFloat(amount);

        // Check for sufficient funds
        if (withdrawalAmount > currentWallet) {
          await Swal.fire({
            title: "Insufficient Funds!",
            text: `You only have ₹${currentWallet.toFixed(
              2
            )} available for withdrawal`,
            icon: "error",
          });
          return;
        }

        // Proceed with withdrawal
        const updatedWallet = currentWallet - withdrawalAmount;

        const updatedProfile = {
          ...profileData,
          wallet: updatedWallet,
        };

        const response = await axios.patch(
          `${BASE_URL}/api/auth/profile/${auth.currentUser.email}`,
          updatedProfile
        );

        setProfileData(response.data);
        setAmount("");
        Swal.fire({
          title: "Success!",
          text: `₹${withdrawalAmount.toFixed(2)} withdrawn from your wallet`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Transaction Failed",
          text: error.response?.data?.message || "Could not withdraw funds",
          icon: "error",
        });
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">Current Balance</h2>
          <p className="text-3xl font-bold text-green-600">
            ₹{(parseFloat(profileData.wallet) || 0).toFixed(2)}
          </p>
        </div>

        <form
          onSubmit={
            userType == "passenger" ? handleAddFunds : handleWithdrawFunds
          }
          className="space-y-4"
        >
          <div>
            {userType == "passenger" ? (
              <label className="block mb-2">Add Funds</label>
            ) : (
              <label className="block mb-2">Withdraw Funds</label>
            )}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
            />
          </div>
          {userType == "passenger" ? (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Money
            </button>
          ) : (
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Withdraw Money
            </button>
          )}
        </form>
      </div>
    </>
  );
};

export default WalletPage;
