"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  CheckCircle,
  Car,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { auth } from "@/components/firebase/firebaseconfig";

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiryDate, setExpiryDate] = useState("12/25");
  const [cvv, setCvv] = useState("123");
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const bookingDetails = {
    scheduleId: searchParams.get("scheduleId"),
    passengerId: searchParams.get("passengerId"),
    driverId: searchParams.get("driverId"),
    locationFrom: decodeURIComponent(searchParams.get("pickupLocation")),
    locationTo: decodeURIComponent(searchParams.get("dropoffLocation")),
    date: searchParams.get("date"),
    time: searchParams.get("time"),
    distance: searchParams.get("distance"),
    price: parseFloat(searchParams.get("price")),
    vehicleNumber: searchParams.get("vehicleNumber"),
    driverName: searchParams.get("driverName"),
  };

  const BASE_URL = "https://ridewise-server.vercel.app";

  useEffect(() => {
    const fetchWalletBalance = async (email) => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/auth/profile/${email}`
        );
        setWalletBalance(response.data.wallet);
      } catch (error) {
        setError("Failed to load wallet data");
      }
    };

    const validateBookingDetails = async () => {
      const requiredFields = [
        "scheduleId",
        "passengerId", // This should contain the email
        "driverId",
        "locationFrom",
        "locationTo",
        "date",
        "time",
        "distance",
        "price",
      ];

      if (requiredFields.some((field) => !bookingDetails[field])) {
        setError("Missing required booking details");
        router.push("/");
        return;
      }

      setIsLoading(false);
    };

    let intervalId;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        fetchWalletBalance(user.email);
        // Set up refresh interval
        intervalId = setInterval(() => {
          fetchWalletBalance(user.email);
        }, 5000);
      } else {
        setLoading(false);
        setError("User not authenticated");
        if (intervalId) clearInterval(intervalId);
      }
    });

    validateBookingDetails();
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // const handlePayment = async (e) => {
  //   e.preventDefault();
  //   setIsProcessing(true);
  //   setError("");

  //   try {
  //     // Check wallet balance
  //     if (walletBalance < bookingDetails.price) {
  //       throw new Error("Insufficient funds in wallet");
  //     }

  //     // Deduct amount from wallet first
  //     const deductionResponse = await axios.patch(
  //       `${BASE_URL}/api/auth/profile/${bookingDetails.passengerId}`,
  //       { wallet: walletBalance - bookingDetails.price }
  //     );

  //     if (!deductionResponse.data) {
  //       throw new Error("Wallet deduction failed");
  //     }

  //     // Create booking
  //     const bookingResponse = await axios.post(
  //       `${BASE_URL}/api/booking/create`,
  //       {
  //         scheduleId: bookingDetails.scheduleId,
  //         passengerId: bookingDetails.passengerId,
  //         driverId: bookingDetails.driverId,
  //         locationFrom: bookingDetails.locationFrom,
  //         locationTo: bookingDetails.locationTo,
  //         date: bookingDetails.date,
  //         time: bookingDetails.time,
  //         distance: bookingDetails.distance,
  //         price: bookingDetails.price,
  //       }
  //     );

  //     if (bookingResponse.data.success) {
  //       router.push(`/booking/success?pnr=${bookingResponse.data.pnr}`);
  //     } else {
  //       // Refund wallet if booking fails
  //       await axios.patch(
  //         `${BASE_URL}/api/auth/profile/${bookingDetails.passengerId}`,
  //         { wallet: walletBalance }
  //       );
  //       throw new Error("Booking creation failed");
  //     }
  //   } catch (error) {
  //     console.error("Payment error:", error);
  //     setError(error.response?.data?.message || error.message);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };
  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create booking with PNR
      const response = await axios.post(
        "https://ridewise-server.vercel.app/api/booking/create",
        {
          scheduleId: bookingDetails.scheduleId,
          passengerId: bookingDetails.passengerId,
          driverId: bookingDetails.driverId,
          locationFrom: bookingDetails.locationFrom,
          locationTo: bookingDetails.locationTo,
          date: bookingDetails.date,
          time: bookingDetails.time,
          distance: parseFloat(bookingDetails.distance),
          price: parseFloat(bookingDetails.price),
        }
      );

      if (response.data.success) {
          router.push(`/booking/success?pnr=${response.data.pnr}`);
      } else {
        setError("2Booking failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error.response?.data?.message || "Payment failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Payment Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-orange-500" />
                  Payment Details
                </CardTitle>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mt-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    Current Wallet Balance: ₹{walletBalance.toFixed(2)}
                  </div>
                  {walletBalance < bookingDetails.price && (
                    <div className="text-red-600 mt-2">
                      Insufficient balance. Please add funds to your wallet.
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Payment Error
                          </h3>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isProcessing || walletBalance < bookingDetails.price
                    }
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      `Pay ₹${bookingDetails.price.toFixed(2)}`
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Details */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                    <Car className="h-5 w-5" />
                    Vehicle Details
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Vehicle Number:{" "}
                      <span className="font-medium text-gray-900">
                        {bookingDetails.vehicleNumber}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Driver:{" "}
                      <span className="font-medium text-gray-900">
                        {bookingDetails.driverName}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pickup Location</p>
                      <p className="font-medium">
                        {bookingDetails.locationFrom}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <MapPin className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Drop-off Location</p>
                      <p className="font-medium">{bookingDetails.locationTo}</p>
                    </div>
                  </div>
                </div>

                {/* Time and Date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <p>{formatDate(bookingDetails.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <p>{formatTime(bookingDetails.time)}</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>₹{bookingDetails.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total distance: {bookingDetails.distance} km
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
