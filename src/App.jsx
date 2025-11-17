import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./client";
import { Login, Signup } from "./pages";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
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
      {/* Jika sudah login → redirect ke /home */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/home" replace />
          ) : (
            <Login setToken={setToken} />
          )
        }
      />

      <Route path="/signup" element={<Signup />} />

      {token && (
        <Route element={<Layout setToken={setToken} user={user} />}>
          <Route path="/home" element={<Dashboard user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/calender" element={<Calender user={user} />} />
          <Route path="/event/:id" element={<EventDetail />} />
        </Route>
      )}
    </Routes>
  );
};

export default App;
