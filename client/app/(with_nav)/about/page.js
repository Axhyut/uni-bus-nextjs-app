"use client";

import React from "react";

const AboutPage = () => {
  return (
    <div className="font-sans ">
      <section
        className="relative bg-cover bg-center h-screen text-white"
        style={{ backgroundImage: "url('/your-hero-image.jpg')" }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center">
          <h1 className="text-5xl font-bold mb-4">
            Learn more about UniBuss, the smart way to move around campus.
          </h1>
          <p className="text-lg max-w-2xl">
            Creating new ways for people, goods, and communities to move around
            the world.
          </p>
          <p className="mb-4 text-lg">
          We are <strong>UniBuss</strong> — a team of problem-solvers on a mission to revolutionize campus movement.
          Born out of a real need at Tezpur University in 2024, UNiBuss is a smart platform for real-time university bus tracking and booking.
        </p>

        <p className="mb-4 text-lg">
          At UniBuss, we believe movement should be seamless, reliable, and accessible for every student and faculty member.
          We empower people to know exactly where their campus buses are, when they’ll arrive, and even book their seats ahead of time.
        </p>

        <p className="mb-4 text-lg">
          What started as a final-year CSE project is now a full-fledged tech solution designed to solve a daily campus problem.
          With modern web technologies like React, Next.js, and Supabase, we connect the physical and digital worlds — helping people move smarter, not harder.
        </p>

        <p className="mb-4 text-lg">
          Whether you’re rushing to class, heading to the hostel, or catching a ride across campus, UniBuss gives you confidence and control over your commute.
          And we’re just getting started.
        </p>

        <p className="text-lg">
          We're committed to building technology that is inclusive, safe, and sustainable. And even when we don’t get everything perfect,
          we listen, learn, and iterate — because making campus life smoother for everyone is what UniBuss is all about.
        </p>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-semibold mb-6 text-center">Our Mission</h2>
        <p className="text-center text-lg text-gray-700">
        At UniBuss, our mission is to simplify and transform campus transportation by providing a smart, real-time bus tracking and booking solution tailored for university students and staff. 
        We aim to eliminate the daily uncertainty of campus commuting by connecting people to their rides with accuracy, 
        reliability, and ease — ensuring that every journey across campus is efficient, stress-free, and on time.
        </p>
      </section>

      {/* Values Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-semibold text-center mb-10">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white p-8 shadow-md rounded-md">
              <h3 className="text-2xl font-bold mb-4">Safety First</h3>
              <p className="text-gray-700">
                Ensuring the safety of our riders, drivers, and communities is
                our top priority.
              </p>
            </div>
            <div className="bg-white p-8 shadow-md rounded-md">
              <h3 className="text-2xl font-bold mb-4">Innovative Solutions</h3>
              <p className="text-gray-700">
                We push boundaries with technology to solve transportation
                challenges worldwide.
              </p>
            </div>
            <div className="bg-white p-8 shadow-md rounded-md">
              <h3 className="text-2xl font-bold mb-4">Empowering People</h3>
              <p className="text-gray-700">
                We create opportunities for individuals to thrive and achieve
                their goals.
              </p>
            </div>
            <div className="bg-white p-8 shadow-md rounded-md">
              <h3 className="text-2xl font-bold mb-4">Sustainability</h3>
              <p className="text-gray-700">
                We are committed to a greener planet through eco-friendly
                initiatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-semibold text-center mb-10">
          Global Impact
        </h2>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto mb-10">
          We’re continuously working to make a positive impact by creating
          economic opportunities, connecting people and places, and reducing
          environmental footprints in the cities we serve.
        </p>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-800 py-10 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p>
            &copy; {new Date().getFullYear()} UniBuss. All rights reserved.
          </p>
          <nav className="mt-4">
            <a href="" className="mr-4 text-gray-300 hover:text-white">
              Careers
            </a>
            <a href="" className="mr-4 text-gray-300 hover:text-white">
              Press
            </a>
            <a href="/contact" className="text-gray-300 hover:text-white">
              Contact Us
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
