import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./client";

import { Login, Signup } from "./pages";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import EventData from "./pages/EventData";
import Comparison from "./pages/Comparison";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import InputData from "./pages/InputData";
import Calender from "./pages/Calender";
import EventDetail from "./pages/EventDetail";

const App = () => {
  // ✅ Gunakan localStorage yang aman untuk menyimpan token
  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem("token");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Token parse error:", error);
      localStorage.removeItem("token");
      return null;
    }
  });

  const [user, setUser] = useState(null);

  // ✅ Simpan token ke localStorage setiap kali berubah
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", JSON.stringify(token));
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ✅ Ambil session Supabase saat pertama kali load
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session Error:", error.message);
      } else if (data?.session) {
        setToken(data.session.access_token);
        setUser(data.session.user);
      }
    };

    getSession();

    // ✅ Pantau perubahan status login Supabase
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setToken(session.access_token);
          setUser(session.user);
          localStorage.setItem("token", JSON.stringify(session.access_token));
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login setToken={setToken} />} />
      <Route path="/signup" element={<Signup />} />

      {token && (
        <Route element={<Layout setToken={setToken} user={user} />}>
          <Route path="/home" element={<Dashboard user={user} />} />
          <Route path="/event-data" element={<EventData user={user} />} />
          <Route path="/input-data" element={<InputData user={user} />} />
          <Route path="/comparison" element={<Comparison user={user} />} />
          <Route path="/analytics" element={<Analytics user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/calender" element={<Calender user={user} />} />
          <Route path="/event/:id" element={<EventDetail />} />
        </Route>
      )}
    </Routes>
  );
};

export default App;
