import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../client";

const Navbar = ({ setToken }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem("token");
      setToken(false);
      navigate("/");
    } catch (error) {
      console.error("Gagal logout:", error.message);
    }
  };

  return (
    <div className="w-full bg-white shadow-sm flex items-center justify-between px-6 py-3">
      <h2 className="text-xl font-semibold text-slate-800">🎯</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
