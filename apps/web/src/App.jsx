import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-80">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-700/30" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-600/20" />
      </div>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home darkMode={darkMode} />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<Login darkMode={darkMode} />} />
          <Route path="/register" element={<Register darkMode={darkMode} />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard darkMode={darkMode} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard darkMode={darkMode} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
