import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../client";

const Login = ({ setToken }) => {
  let navigate = useNavigate();
  const [formData, setFormData] = useState({
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
      const { data, error } = await supabase.auth.signInWithPassword({
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
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-blue-200 p-8 w-80">
        <h2>Login</h2>
        <form onSubmit={handlesubmit} className="flex flex-col space-y-4">
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
            Login
          </button>
        </form>
        <p>
          Belum Punya akun?{""}
          <Link to="/signup" className="text-blue-500">
            SignUp
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
