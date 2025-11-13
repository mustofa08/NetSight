import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Layout = ({ setToken, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");

  // 🔹 Load tema dari localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  // 🔹 Toggle global theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-all duration-300">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          setToken={setToken}
          isSidebarOpen={isSidebarOpen}
          toggleTheme={toggleTheme}
          theme={theme}
        />
        <main className="flex-1 overflow-y-auto transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
