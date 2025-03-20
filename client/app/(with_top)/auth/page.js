"use client";
import React, { useState, useEffect } from "react";
import { auth, provider } from "@/components/firebase/firebaseconfig";
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import axios from "axios";
import TopBar from "@/components/Topbar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

const AuthFlow = () => {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState("email"); // 'email', 'phone', 'google'
  const [step, setStep] = useState("initial"); // 'initial', 'verify', 'profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userType, setUserType] = useState("passenger");
  const [isLoginMode, setIsLoginMode] = useState(false); // Toggle between login and signup

  const [authData, setAuthData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    gender: "",
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "",
    isAvailable: false,
    licenseValidity: "",
  });

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authData.password !== authData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        authData.email,
        authData.password
      );
      setFormData({
        ...formData,
        email: userCredential.user.email,
      });
      setStep("profile");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const BASE_URL = "https://ridewise-server.vercel.app";

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        authData.email,
        authData.password
      );

      const response = await axios.get(
        `${BASE_URL}/api/auth/user/${authData.email}`
      );

      if (response.data.exists) {
        setRegistrationComplete(true);
        router.push(response.data.userType === "driver" ? "/dashboard" : "/");
      } else {
        setFormData({
          ...formData,
          email: userCredential.user.email,
        });
        setStep("profile");
      }
    } catch (error) {
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Initialize the RecaptchaVerifier just before calling signInWithPhoneNumber
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
        }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        authData.phone,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      setStep("verify");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await window.confirmationResult.confirm(
        authData.verificationCode
      );

      setFormData({
        ...formData,
        phoneNumber: authData.phone,
      });
      setStep("profile");
    } catch (error) {
      setError("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
  
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      try {
        const response = await axios.get(
          `${BASE_URL}/api/auth/user/${user.email}`
        );
  
        if (response.data.exists) {
          setRegistrationComplete(true);
          router.push(response.data.userType === "driver" ? "/dashboard" : "/");
        } else {
          setFormData({
            ...formData,
            email: user.email,
            firstName: user.displayName?.split(" ")[0] || "",
            lastName: user.displayName?.split(" ")[1] || "",
          });
          setStep("profile");
        }
      } catch (err) {
        console.error("Backend check error:", err);
        setError("Failed to verify registration status. Please try again.");
        await handleSignOut();
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(error.message || "Error during Google Sign-In");
    } finally {
      setLoading(false);
    }
  };
  
  // Updated handleSignOut to prevent unnecessary errors
  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setStep("initial");
      setAuthData({
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        verificationCode: "",
      });
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        phoneNumber: "",
        gender: "",
        licenseNumber: "",
        vehicleNumber: "",
        vehicleType: "",
        isAvailable: false,
        licenseValidity: "",
      });
    } catch (error) {
      console.error("Sign Out Error:", error);
      setError("Error signing out");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
        ...formData,
        userType,
      });
      setRegistrationComplete(true);
      router.push(userType === "driver" ? "/dashboard" : "/");
    } catch (error) {
      setError("The user already exists");
      await handleSignOut();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({ ...formData, [id]: type === "checkbox" ? checked : value });
  };

  const handlePasswordReset = async () => {
    const { value: email } = await Swal.fire({
      title: "Reset Password",
      html: `
        <input 
          type="email" 
          id="email" 
          class="swal2-input" 
          placeholder="Enter your email address"
          autocomplete="email"
          required
        >
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Reset Link",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        validationMessage: "text-red-500 text-sm mt-2",
      },
      preConfirm: () => {
        const email = Swal.getPopup().querySelector("#email").value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
          Swal.showValidationMessage("Please enter an email address");
          return false;
        }
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage("Please enter a valid email address");
          return false;
        }
        return email;
      },
    });

    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        await Swal.fire({
          title: "Email Sent!",
          html: `
            <div class="text-center">
              <svg class="mx-auto mb-4 w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-700">
                We've sent password reset instructions to<br>
                <span class="font-semibold">${email}</span>
              </p>
            </div>
          `,
          icon: "success",
          showConfirmButton: false,
          timer: 3000,
        });
      } catch (error) {
        await Swal.fire({
          title: "Failed to Send",
          text: error.message || "Could not send reset instructions",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    }
  };

  return (
    <div>
      <TopBar />
      <div className="min-h-screen bg-gray-100 py-12 px-4 mt-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            {step === "profile"
              ? "Complete Your Profile"
              : "Welcome to RideWise"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {step === "initial" && (
            <div className="space-y-6">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 py-2 rounded ${
                    authMethod === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 py-2 rounded ${
                    authMethod === "phone"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Phone
                </button>
              </div>

              {authMethod === "email" &&
                (isLoginMode ? (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={authData.email}
                        onChange={(e) =>
                          setAuthData({ ...authData, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={authData.password}
                        onChange={(e) =>
                          setAuthData({ ...authData, password: e.target.value })
                        }
                        placeholder="Password"
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Log in"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={authData.email}
                        onChange={(e) =>
                          setAuthData({ ...authData, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={authData.password}
                        onChange={(e) =>
                          setAuthData({ ...authData, password: e.target.value })
                        }
                        placeholder="Password"
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={authData.confirmPassword}
                        onChange={(e) =>
                          setAuthData({
                            ...authData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm Password"
                        className="w-full p-3 border rounded"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                      disabled={loading}
                    >
                      {loading ? "Signing up..." : "Sign Up"}
                    </button>
                  </form>
                ))}

              {authMethod === "phone" && (
                <form onSubmit={handlePhoneSignUp} className="space-y-4">
                  <div>
                    <input
                      type="tel"
                      value={authData.phone}
                      onChange={(e) =>
                        setAuthData({ ...authData, phone: e.target.value })
                      }
                      placeholder="Phone number"
                      className="w-full p-3 border rounded"
                      required
                    />
                  </div>
                  <div id="recaptcha-container" />
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={loading}
                  >
                    {loading ? "Sending code..." : "Send Code"}
                  </button>
                </form>
              )}

              <div className="text-right mb-6">
                <button
                  onClick={handlePasswordReset}
                  className="text-blue-600 underline"
                >
                  {isLoginMode ? "Forgot Password?" : ""}
                </button>
              </div>

              <div className="text-center mb-6">
                <button
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-blue-600 underline"
                >
                  {isLoginMode
                    ? "Create an account"
                    : "Already have an account? Log in"}
                </button>
              </div>

              <div className="text-center my-6 flex items-center justify-center">
                <div className="border-b border-gray-300 flex-grow mr-2" />
                <span className="text-gray-500">or</span>
                <div className="border-b border-gray-300 flex-grow ml-2" />
              </div>

              <div className="flex justify-center mt-4">
                <div className="border border-gray-300 rounded-lg shadow-md p-3 w-full max-w-xs">
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center w-full text-gray-700 hover:text-gray-900"
                  >
                    <Image
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Login with Google
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={authData.verificationCode}
                  onChange={(e) =>
                    setAuthData({
                      ...authData,
                      verificationCode: e.target.value,
                    })
                  }
                  placeholder="Verification code"
                  className="w-full p-3 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile completion form fields */}
              <div>
                <label className="block text-gray-700 mb-1">Account Type</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="passenger"
                      checked={userType === "passenger"}
                      onChange={() => setUserType("passenger")}
                      className="mr-2"
                    />
                    Passenger
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="driver"
                      checked={userType === "driver"}
                      onChange={() => setUserType("driver")}
                      className="mr-2"
                    />
                    Driver
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  className="border border-gray-300 p-2 rounded w-full"
                  disabled
                />
              </div>

              <div>
                <label htmlFor="firstName" className="block text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              {userType === "driver" ? (
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-gray-700 mb-1"
                  >
                    Date-Of-Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
              ) : (
                ""
              )}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  pattern="[1-9]{1}[0-9]{9}"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded w-full"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {userType === "driver" && (
                <>
                  <div>
                    <label
                      htmlFor="licenseNumber"
                      className="block text-gray-700 mb-1"
                    >
                      License Number
                    </label>
                    <input
                      id="licenseNumber"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vehicleNumber"
                      className="block text-gray-700 mb-1"
                    >
                      Vehicle Number
                    </label>
                    <input
                      id="vehicleNumber"
                      required
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="vehicleType"
                      className="block text-gray-700 mb-1"
                    >
                      Vehicle Type
                    </label>
                    <select
                      id="vehicleType"
                      required
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded w-full"
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="sedan">Sedan</option>
                      <option value="msuv">MUV/SUV</option>
                      <option value="convertible">Convertible</option>
                      <option value="coupe">Coupe</option>
                      <option value="wagon">Wagon</option>
                      <option value="jeep">Jeep</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="isAvailable"
                      className="block text-gray-700 mb-1"
                    >
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Available for rides
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="licenseValidity"
                      className="block text-gray-700 mb-1"
                    >
                      License Validity
                    </label>
                    <input
                      type="date"
                      id="licenseValidity"
                      required
                      value={formData.licenseValidity}
                      onChange={handleChange}
                      className="border border-gray-300 p-2 rounded w-full"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Complete Registration"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 bg-gray-500 text-white rounded px-4 py-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
