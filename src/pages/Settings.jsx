import React, { useEffect, useState } from "react";
import { supabase } from "../client";
import { User, Mail, Lock, CheckCircle, AlertTriangle } from "lucide-react";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [lastLogin, setLastLogin] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) console.error("Error fetching user:", error.message);
    else if (user) {
      setUser(user);
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        email: user.email,
      });
      setLastLogin(user.last_sign_in_at || "-");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const { error } = await supabase.auth.updateUser({
      email: profile.email,
      data: { full_name: profile.full_name },
    });

    if (error)
      setMessage({
        text: `❌ Gagal memperbarui profil: ${error.message}`,
        type: "error",
      });
    else
      setMessage({ text: "✅ Profil berhasil diperbarui!", type: "success" });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword.length < 6) {
      setMessage({ text: "⚠️ Password minimal 6 karakter!", type: "error" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error)
      setMessage({
        text: `❌ Gagal mengganti password: ${error.message}`,
        type: "error",
      });
    else {
      setMessage({ text: "✅ Password berhasil diperbarui!", type: "success" });
      setNewPassword("");
      setPasswordStrength(0);
    }
  };

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    setPasswordStrength(strength);
  }, [newPassword]);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1:
        return "bg-red-500 w-1/4";
      case 2:
        return "bg-yellow-500 w-1/2";
      case 3:
        return "bg-blue-500 w-3/4";
      case 4:
        return "bg-green-500 w-full";
      default:
        return "bg-gray-200 w-0";
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-slate-900 min-h-screen transition-all duration-300">
      <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
        ⚙️ Pengaturan Akun
      </h1>

      {message.text && (
        <div
          className={`p-3 rounded-md text-sm flex items-center gap-2 max-w-md ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"
              : "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {message.text}
        </div>
      )}

      {/* Profil Pengguna */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 max-w-lg border border-gray-200 dark:border-slate-700 transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
            {profile.full_name
              ? profile.full_name.charAt(0).toUpperCase()
              : "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold dark:text-white">
              {profile.full_name || "Pengguna"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Terakhir login: {new Date(lastLogin).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
          <label className="text-sm font-medium dark:text-gray-200">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            className="border p-2 rounded-md dark:bg-slate-700 dark:text-white"
          />
          <label className="text-sm font-medium dark:text-gray-200">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="border p-2 rounded-md dark:bg-slate-700 dark:text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
          >
            Simpan Perubahan
          </button>
        </form>
      </section>

      {/* Ganti Password */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 max-w-lg border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
          <Lock /> Ganti Password
        </h2>
        <form
          onSubmit={handleChangePassword}
          className="flex flex-col gap-3 relative"
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password Baru"
              className="border p-2 rounded-md w-full pr-10 dark:bg-slate-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-600 dark:text-gray-300 hover:text-black text-sm"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-md overflow-hidden">
            <div
              className={`h-2 rounded-md transition-all duration-300 ${getStrengthColor()}`}
            ></div>
          </div>
          <button
            type="submit"
            className="bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600 transition"
          >
            Ganti Password
          </button>
        </form>
      </section>
    </div>
  );
};

export default Settings;
