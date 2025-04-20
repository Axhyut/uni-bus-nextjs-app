"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserCircle, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

// Drivers Table Component
const DriversTable = ({ drivers, handleVerifyDriver, isLoading }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date Of Birth
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phone
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Vehicle Info
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            License Number
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {drivers.map((driver) => (
          <tr key={driver.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {driver.firstName} {driver.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{driver.gender}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(driver.dateOfBirth)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .replace(/\//g, "-")}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {driver.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {driver.phoneNumber}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {driver.vehicleNumber}
              </div>
              <div className="text-sm text-gray-500">{driver.vehicleType}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {driver.licenseNumber}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  driver.status === "active"
                    ? "bg-green-100 text-green-800"
                    : driver.status === "expired"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {driver.status === "active"
                  ? "Verified"
                  : driver.status === "expired"
                  ? "Expired"
                  : "Pending"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              {driver.status === "active" ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <button
                  onClick={() => handleVerifyDriver(driver.id)}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Passengers Table Component
const PassengersTable = ({ passengers }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phone
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Gender
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {passengers.map((passenger) => (
          <tr key={passenger.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {passenger.firstName} {passenger.lastName}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {passenger.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {passenger.phoneNumber}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {passenger.gender}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                {passenger.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Dashboard Component
const Admindashboard = ({ adminName, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [drivers, setDrivers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userTab, setUserTab] = useState("drivers"); // Default table view

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch drivers and passengers data
  const [refresh, setRefresh] = useState(false); // State to trigger data refresh

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, passengersRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/drivers`),
          axios.get(`${BASE_URL}/api/passengers`),
        ]);
        setDrivers(driversRes.data);
        setPassengers(passengersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [refresh]); // Depend on refresh state to re-fetch automatically

  const handleVerifyDriver = async (driverId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to verify this driver!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          await axios.patch(`${BASE_URL}/api/drivers/${driverId}/verify`, {
            status: "active",
          });

          // Instead of manually updating the driver, trigger a refresh
          setRefresh((prev) => !prev);

          Swal.fire({
            title: "Verified",
            text: "Your driver is active now!",
            icon: "success",
          });
        } catch (error) {
          console.error("Error verifying driver:", error);
          Swal.fire({
            title: "Failed",
            text: "Failed to verify driver. Please try again.",
            icon: "error",
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome
                <br />
                {adminName}
              </span>
              <div
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <UserCircle className="h-8 w-8" />{" "}
                {showDropdown && (
                  <div className="absolute right-[-25px] mt-0 w-24 rounded-md shadow-lg bg-white text-black border-gray-700 border-[2px]">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="block w-full text-center px-4 py-2 text-sm font-extrabold text-black"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Main Navigation Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("utilities")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "utilities"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Utilities
            </button>
          </div>

          {/* Render content based on activeTab */}
          <div className="bg-white shadow rounded-lg p-6">
            {activeTab === "users" ? (
              <>
                {/* Sub-tabs for Drivers & Passengers */}
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setUserTab("drivers")}
                    className={`px-4 py-2 rounded-lg ${
                      userTab === "drivers"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Drivers
                  </button>
                  <button
                    onClick={() => setUserTab("passengers")}
                    className={`px-4 py-2 rounded-lg ${
                      userTab === "passengers"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Passengers
                  </button>
                </div>

                {/* Displaying Tables */}
                {userTab === "drivers" ? (
                  <DriversTable
                    drivers={drivers}
                    handleVerifyDriver={handleVerifyDriver}
                    isLoading={isLoading}
                  />
                ) : (
                  <PassengersTable passengers={passengers} />
                )}
              </>
            ) : (
              <div className="text-center text-gray-600">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() =>
                      window.open(
                        "https://parivahan.gov.in/rcdlstatus/?pur_cd=101",
                        "_blank"
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Check DL Status
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml",
                        "_blank"
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Check RC Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admindashboard;
