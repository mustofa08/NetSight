import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../client";
import { Eye, EyeOff, LogIn } from "lucide-react";

const Login = ({ setToken }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      setToken(userData.user);
      navigate("/home");
    } catch (error) {
      setErrorMsg("Email atau password salah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-gray-900 text-gray-800 dark:text-white">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-2xl shadow-2xl p-8 w-[90%] max-w-md transition-all">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          🔐 Login ke <span className="text-blue-400">NetSight</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan email Anda"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-300 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          )}

          {/* Tombol login */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white transition-all ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            <LogIn size={18} />
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-300 mt-5">
          Belum punya akun?{" "}
          <Link
            to="/signup"
            className="text-blue-400 hover:underline font-semibold"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
