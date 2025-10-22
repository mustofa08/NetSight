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

const App = () => {
  const [token, setToken] = useState(false);
  const [user, setUser] = useState(null);

  // Simpan token ke sessionStorage
  useEffect(() => {
    if (token) sessionStorage.setItem("token", JSON.stringify(token));
  }, [token]);

  // Cek session Supabase saat pertama kali load
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Session Error:", error.message);
      setUser(data?.session?.user ?? null);
    };

    getSession();

    // Update user saat ada perubahan status login
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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
        </Route>
      )}
    </Routes>
  );
};

export default App;
