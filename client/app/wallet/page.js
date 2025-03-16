"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/components/firebase/firebaseconfig";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";

const WalletPage = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: []
  });
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const BASE_URL = "https://ridewise-server.vercel.app";

  const fetchWallet = async (email) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/${email}`);
      setWalletData(response.data);
      setLoading(false);
    } catch (error) {
      setError("Failed to load wallet data");
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    if (!amount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      setProcessing(false);
      return;
    }

    try {
      // Simulated payment processing
      const paymentResult = await axios.post(`${BASE_URL}/api/payments`, {
        amount: parseFloat(amount),
        currency: "INR",
        paymentMethod,
        email: auth.currentUser.email
      });

      if (paymentResult.data.success) {
        // Update wallet balance
        const updatedWallet = await axios.patch(
          `${BASE_URL}/api/wallet/${auth.currentUser.email}/add`,
          { amount: parseFloat(amount) }
        );

        setWalletData(prev => ({
          balance: updatedWallet.data.balance,
          transactions: [
            ...prev.transactions,
            {
              amount: parseFloat(amount),
              type: "credit",
              date: new Date().toISOString(),
              method: paymentMethod
            }
          ]
        }));

        Swal.fire({
          title: "Payment Successful!",
          text: `₹${amount} added to your wallet`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        setAmount("");
      }
    } catch (error) {
      Swal.fire({
        title: "Payment Failed",
        text: error.response?.data?.message || "Payment processing failed",
        icon: "error"
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        fetchWallet(user.email);
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
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Balance</h2>
              <p className="text-3xl font-bold text-green-600">
                ₹{walletData.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block mb-2">Add Money to Wallet</label>
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

          <div>
            <label className="block mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="net_banking">Net Banking</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={processing}
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
              processing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {processing ? "Processing..." : "Add Money"}
          </button>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {walletData.transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {walletData.transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.type === "credit" ? "Added" : "Paid"}: ₹
                      {transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">
                    {transaction.method.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WalletPage;