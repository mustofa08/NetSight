import React, { useState } from "react";
import { supabase } from "../client";

const InputData = () => {
  const [formData, setFormData] = useState({
    event_name: "",
    location: "",
    date: "",
    total_users: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const { error } = await supabase.from("events").insert([
        {
          event_name: formData.event_name,
          location: formData.location,
          date: formData.date,
          total_users: parseInt(formData.total_users),
        },
      ]);

      if (error) throw error;
      setMessage("✅ Data berhasil disimpan!");
      setFormData({ event_name: "", location: "", date: "", total_users: "" });
    } catch (err) {
      console.error(err);
      setMessage("❌ Gagal menyimpan data: " + err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Input Data Event</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          name="event_name"
          value={formData.event_name}
          onChange={handleChange}
          placeholder="Nama Event"
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Lokasi Event"
          className="border p-2 rounded"
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="total_users"
          value={formData.total_users}
          onChange={handleChange}
          placeholder="Jumlah Pengguna"
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Simpan
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default InputData;
