import React, { useEffect, useState } from "react";
import { supabase } from "../client";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchUser();
  }, []);

  // 🔹 Ambil data user aktif
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
    }
  };

  // 🔹 Update nama/email
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const { error } = await supabase.auth.updateUser({
      email: profile.email,
      data: { full_name: profile.full_name },
    });

    if (error)
      setMessage({
        text: "❌ Gagal memperbarui profil: " + error.message,
        type: "error",
      });
    else
      setMessage({ text: "✅ Profil berhasil diperbarui!", type: "success" });
  };

  // 🔹 Ganti password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword.length < 6) {
      setMessage({ text: "⚠️ Password minimal 6 karakter!", type: "error" });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error)
      setMessage({
        text: "❌ Gagal mengganti password: " + error.message,
        type: "error",
      });
    else {
      setMessage({ text: "✅ Password berhasil diperbarui!", type: "success" });
      setNewPassword("");
    }
  };

  // 🔹 Ganti tema (opsional)
  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">⚙️ Pengaturan Akun</h1>

      {/* 🟩 Pesan Notifikasi */}
      {message.text && (
        <p
          className={`text-center text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* 🟦 Update Profil */}
      <section className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Profil Pengguna</h2>
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            placeholder="Nama Lengkap"
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Email"
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Simpan Perubahan
          </button>
        </form>
      </section>

      {/* 🟧 Ganti Password */}
      <section className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Ganti Password</h2>
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
              className="border p-2 rounded w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-600 hover:text-black text-sm"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button
            type="submit"
            className="bg-amber-500 text-white py-2 rounded hover:bg-amber-600 transition"
          >
            Ganti Password
          </button>
        </form>
      </section>

      {/* 🟫 Tema (opsional) */}
      {/* 
      <section className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Tampilan</h2>
        <button
          onClick={handleToggleTheme}
          className="bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-700"
        >
          Ganti ke {theme === "light" ? "Mode Gelap 🌙" : "Mode Terang ☀️"}
        </button>
      </section>
      */}
    </div>
  );
};

export default Settings;
