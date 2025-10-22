import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../client";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handlechange(event) {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
    setErrorMsg("");
  }

  async function handlesubmit(e) {
    e.preventDefault();
    try {
      if (formData.password.length < 6) {
        setErrorMsg("Password minimal 6 karakter!");
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
      alert("Pendaftaran Berhasi coba cek email kamu untuk verivikasi");
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan coba lagi");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-blue-200 p-8 w-80">
        <h2>Sign Up</h2>
        <form onSubmit={handlesubmit} className="flex flex-col space-y-4">
          <input
            placeholder="Full Name"
            name="fullname"
            onChange={handlechange}
            required
            className="border-2 bg-amber-200 p-2 mb-3 "
          />
          <input
            placeholder="Email"
            name="email"
            type="email"
            onChange={handlechange}
            required
            className="border-2 bg-amber-200 p-2 mb-3"
          />
          <div className="relative">
            <input
              placeholder="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={handlechange}
              required
              className="border-2 bg-amber-200 p-2 mb-3 w-full pr-10 "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 cursor-pointer bg-transparent border-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {errorMsg && (
            <p style={{ color: "red", fontSize: 13, margin: 0 }}>{errorMsg}</p>
          )}

          <button type="submit" className="bg-blue-500 rounded py-2 px-4">
            Sign Up
          </button>
        </form>
        <p>
          Sudah Punya akun?{""}
          <Link to="/" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
