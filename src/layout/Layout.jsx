import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Layout = ({ setToken }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar setToken={setToken} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
