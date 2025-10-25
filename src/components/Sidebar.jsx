import { useState } from "react";
import {
  BarChart3,
  Database,
  LineChart,
  Settings,
  Home,
  FilePlus,
  Calendar,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation(); // 👉 untuk mendeteksi halaman aktif

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/home" },
    // { name: "Event Data", icon: <Database size={20} />, path: "/event-data" },
    // { name: "Input Data", icon: <FilePlus size={20} />, path: "/input-data" },
    // { name: "Comparison", icon: <BarChart3 size={20} />, path: "/comparison" },
    // { name: "Analytics", icon: <LineChart size={20} />, path: "/analytics" },
    { name: "Calender", icon: <Calendar size={20} />, path: "/calender" },
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-slate-900 text-gray-100 h-screen p-4 flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center-between mb-6">
        <h1 className={`text-xl font-bold ${!isOpen && "hidden"}`}>NetSight</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-800 p-2 rounded-md hover:bg-slate-700"
        >
          ☰
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={item.name}
              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md" // highlight aktif
                    : "hover:bg-slate-800 text-gray-300"
                }`}
            >
              {item.icon}
              <span className={`${!isOpen && "hidden"} text-sm`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
