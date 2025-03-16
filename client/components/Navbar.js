"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, UserCircle, LogOut, Edit } from "lucide-react";
import { auth } from "@/components/firebase/firebaseconfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import axios from "axios";

const BASE_URL = "https://ridewise-server.vercel.app";

const Navbar = () => {
  const router = useRouter();
  const [state, setState] = useState({
    isMenuOpen: false,
    isProfileMenuOpen: false,
    user: null,
    isAvailable: null,
    isUpdating: false,
  });

  const navigationLinks = [
    { path: "/", label: "Ride" },
    { path: "/dashboard", label: "Drive" },
    { path: "/help", label: "Help" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const fetchUserData = async (user) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/auth/user/${user.email}`
      );
      const profileResponse = await axios.get(
        `${BASE_URL}/api/auth/profile/${user.email}`
      );

      setState((prev) => ({
        ...prev,
        user: {
          email: user.email,
          type: response.data.userType,
          name: response.data.userName,
          photo: user.photoURL,
        },
        isAvailable: profileResponse.data.isAvailable,
      }));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user?.email) {
        await fetchUserData(user);
      } else {
        setState((prev) => ({
          ...prev,
          user: null,
          isAvailable: null,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (action) => {
    try {
      if (action === "logout") {
        await signOut(auth);
        router.push("/");
      }
    } catch (error) {
      console.error(`${action} error:`, error);
    }
  };

  const handleToggleAvailability = async () => {
    const { isAvailable, isUpdating, user } = state;
    if (isUpdating || !user) return;

    try {
      setState((prev) => ({ ...prev, isUpdating: true }));
      const newStatus = !isAvailable;

      await axios.patch(`${BASE_URL}/api/auth/profile/${user.email}`, {
        isAvailable: newStatus,
      });
      setState((prev) => ({ ...prev, isAvailable: newStatus }));
    } catch (error) {
    } finally {
      setState((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  const handleProfileMenuToggle = (isOpen) => {
    setState((prev) => ({ ...prev, isProfileMenuOpen: isOpen }));
  };

  const renderNavigationLinks = (isMobile = false) =>
    navigationLinks.map(({ path, label }) => (
      <Link key={path} href={path}>
        <button
          className={`block px-4 py-2 text-white hover:bg-gray-900 rounded ${
            isMobile ? "w-full text-left" : ""
          }`}
        >
          {label}
        </button>
      </Link>
    ));

  const renderAuthButtons = (isMobile = false) =>
    state.user ? (
      <ProfileDropdown
        user={state.user}
        isAvailable={state.isAvailable}
        isMobile={isMobile}
        isOpen={state.isProfileMenuOpen}
        onOpen={() => handleProfileMenuToggle(true)}
        onClose={() => handleProfileMenuToggle(false)}
        handleToggleAvailability={handleToggleAvailability}
        handleProfileEdit={() => router.push("/profile")}
        handleLogout={() => handleAuthAction("logout")}
      />
    ) : (
      <>
        <Link href="/auth">
          <button className="px-3 py-2 text-white hover:text-gray-200">
            Log in
          </button>
        </Link>
        <Link href="/auth">
          <button className="px-3 py-2 bg-white text-black font-medium rounded hover:bg-gray-100">
            Sign up
          </button>
        </Link>
      </>
    );

  return (
    <nav className="bg-black text-white fixed w-full top-0 z-50">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center text-2xl font-bold">
            RideWise
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {renderNavigationLinks()}
            {renderAuthButtons()}
          </div>

          <MobileMenu
            isOpen={state.isMenuOpen}
            toggleMenu={() =>
              setState((prev) => ({ ...prev, isMenuOpen: !prev.isMenuOpen }))
            }
            renderNavigationLinks={renderNavigationLinks}
            renderAuthButtons={renderAuthButtons}
          />
        </div>
      </div>
    </nav>
  );
};

const ProfileDropdown = ({
  user,
  isAvailable,
  isMobile,
  isOpen,
  onOpen,
  onClose,
  handleToggleAvailability,
  handleProfileEdit,
  handleLogout,
}) => (
  <div
    className={`relative ${isMobile ? "w-full" : ""}`}
    {...(!isMobile && {
      onMouseEnter: onOpen,
      onMouseLeave: onClose,
    })}
  >
    <button
      className="flex items-center space-x-2 text-white hover:text-gray-200"
      onClick={isMobile ? () => onOpen(!isOpen) : undefined}
    >
      {user.photo ? (
        <img src={user.photo} alt="Profile" className="h-8 w-8 rounded-full" />
      ) : (
        <UserCircle className="h-8 w-8" />
      )}
    </button>

    {(isOpen || !isMobile) && (
      <div
        className={`absolute right-0 top-full w-56 rounded-lg shadow-xl bg-white text-black border z-50 ${
          isMobile ? "relative mt-2" : ""
        }`}
      >
        <div className="py-2">
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-semibold truncate">{user.name}</div>
          </div>
          <ToggleButton
            isAvailable={isAvailable}
            handleToggle={handleToggleAvailability}
          />
          <MenuButton
            icon={<Edit />}
            label="Edit Profile"
            onClick={handleProfileEdit}
          />
          <MenuButton icon={<LogOut />} label="Logout" onClick={handleLogout} />
        </div>
      </div>
    )}
  </div>
);

const ToggleButton = ({ isAvailable, handleToggle }) => (
  <button
    onClick={handleToggle}
    className="w-full px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between"
  >
    <div className="flex items-center space-x-3">
      <div
        className={`h-4 w-4 rounded-full ${
          isAvailable ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>Available?</span>
    </div>
    <div
      className={`relative inline-flex h-5 w-9 items-center rounded-full ${
        isAvailable ? "bg-green-200" : "bg-red-200"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white ${
          isAvailable ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </div>
  </button>
);

const MenuButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center space-x-3"
  >
    {React.cloneElement(icon, { className: "h-4 w-4 text-gray-600" })}
    <span>{label}</span>
  </button>
);

const MobileMenu = ({
  isOpen,
  toggleMenu,
  renderNavigationLinks,
  renderAuthButtons,
}) => (
  <>
    <div className="md:hidden flex items-center">
      <button onClick={toggleMenu} className="text-white hover:text-gray-200">
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>

    {isOpen && (
      <div className="md:hidden absolute top-16 left-0 right-0 bg-black">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {renderNavigationLinks(true)}
          {renderAuthButtons(true)}
        </div>
      </div>
    )}
  </>
);

export default Navbar;
