import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../client";
import { Sun, Moon, Settings, LogOut, ChevronDown } from "lucide-react";

const Navbar = ({ setToken, toggleTheme, theme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("token");
    setToken(false);
    navigate("/");
  };

  return (
    <nav className="w-full bg-gradient-to-r from-blue-950 via-slate-500 to-red-500 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 shadow-md text-white sticky top-0 z-50 transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-3">
        {/* 🔹 Logo kiri */}
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 cursor-pointer group transition-all"
        >
          <h1 className="text-xl font-bold tracking-wide group-hover:text-gray-200 transition">
            NetSight <span className="font-light">Dashboard</span>
          </h1>
        </div>

        {/* 🔹 Bagian kanan */}
        <div className="flex items-center gap-4">
          {/* 🌓 Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-700 hover:scale-105 shadow-md transition-all dark:bg-slate-700 dark:text-yellow-300"
            title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* 👤 User Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-semibold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <ChevronDown size={16} />
            </button>

            {/* 🔽 Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {user?.user_metadata?.full_name ||
                      user?.email?.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <ul className="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-slate-700">
                  <li>
                    <button
                      onClick={() => navigate("/settings")}
                      className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <Settings size={16} /> Account Preferences
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
