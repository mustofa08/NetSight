import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../client";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlechange = (event) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
    setErrorMsg("");
  };

  async function handlesubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password.length < 6) {
        setErrorMsg("Password minimal 6 karakter!");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullname },
        },
      });

      if (error) throw error;

      alert("Pendaftaran berhasil! Periksa email kamu untuk verifikasi.");
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan, coba lagi.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-gray-900 text-gray-800 dark:text-white">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-2xl shadow-2xl p-8 w-[90%] max-w-md transition-all">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          📝 <span className="text-blue-400">Buat Akun NetSight</span>
        </h2>

        <form onSubmit={handlesubmit} className="space-y-5">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Nama Lengkap
            </label>
            <input
              placeholder="Masukkan nama lengkap"
              name="fullname"
              onChange={handlechange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              placeholder="Masukkan email"
              name="email"
              type="email"
              required
              onChange={handlechange}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                placeholder="Minimal 6 karakter"
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={handlechange}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
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

          {/* Error Message */}
          {errorMsg && (
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          )}

          {/* Tombol daftar */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white transition-all ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            <UserPlus size={18} />
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        {/* Sudah punya akun? */}
        <p className="text-center text-sm text-gray-300 mt-5">
          Sudah punya akun?
          <Link
            to="/"
            className="text-blue-400 hover:underline font-semibold ml-1"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
