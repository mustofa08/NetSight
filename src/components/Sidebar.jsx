import { useState } from "react";
import {
  Home,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/home" },
    { name: "Calender", icon: <Calendar size={20} />, path: "/calender" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-slate-900 to-blue-800 dark:from-slate-950 dark:to-slate-800 text-gray-100 h-screen p-4 flex flex-col transition-all duration-300 border-r border-slate-700/50 shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div
          className={`flex items-center gap-2 transition-all ${
            !isOpen && "hidden"
          }`}
        >
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Net<span className="text-blue-400">Sight</span>
          </h1>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all duration-300 text-gray-200"
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={item.name}
              className={`group relative flex items-center gap-3 p-3 rounded-md transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg dark:bg-blue-500"
                    : "hover:bg-slate-800 dark:hover:bg-slate-700 text-gray-300"
                }`}
            >
              <div
                className={`transition-transform duration-200 ${
                  isActive
                    ? "scale-110 text-white"
                    : "group-hover:text-blue-400"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`${
                  !isOpen && "hidden"
                } text-sm font-medium tracking-wide`}
              >
                {item.name}
              </span>

              {/* Tooltip saat collapsed */}
              {!isOpen && (
                <span
                  className="absolute left-16 bg-slate-800 text-gray-100 text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap border border-slate-700"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Mini Info */}
      <div
        className={`mt-auto pt-6 border-t border-slate-700/50 ${
          !isOpen && "hidden"
        }`}
      >
        <p className="text-xs text-slate-400 text-center">
          © 2025 NetSight. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
