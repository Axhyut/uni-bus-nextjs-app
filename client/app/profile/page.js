"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/components/firebase/firebaseconfig";
import Navbar from "@/components/Navbar";

const ProfileEdit = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const BASE_URL = "https://ridewise-server.vercel.app";

  const fetchProfile = async (email) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/profile/${email}`);
      setProfileData(response.data);
      setLoading(false);
    } catch (error) {
      setError("Failed to load profile data");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.put(
        `${BASE_URL}/api/auth/profile/${auth.currentUser.email}`,
        profileData
      );

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to update profile");
      console.error("Update error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        fetchProfile(user.email);
      } else {
        setLoading(false);
        setError("User not authenticated");
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {success && (
          <div className="bg-green-100 p-3 mb-4 rounded">{success}</div>
        )}
        {error && <div className="bg-red-100 p-3 mb-4 rounded">{error}</div>}

        {profileData && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profileData.firstName || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profileData.lastName || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={profileData.phoneNumber || ""}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {profileData.userType === "driver" && (
              <>
                <div>
                  <label className="block mb-2">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={profileData.licenseNumber || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={profileData.vehicleNumber || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={profileData.vehicleType || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update Profile
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ProfileEdit;
