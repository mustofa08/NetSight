import React, { useEffect, useState } from "react";
import { supabase } from "../client";

const EventData = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [editingEvent, setEditingEvent] = useState(null); // event yang sedang diedit
  const [formData, setFormData] = useState({
    event_name: "",
    location: "",
    date: "",
    total_users: "",
  });

  // Ambil data
  const fetchData = async (sortOption = "date_desc") => {
    setLoading(true);
    let query = supabase.from("events").select("*");

    switch (sortOption) {
      case "date_asc":
        query = query.order("date", { ascending: true });
        break;
      case "date_desc":
        query = query.order("date", { ascending: false });
        break;
      case "users_asc":
        query = query.order("total_users", { ascending: true });
        break;
      case "users_desc":
        query = query.order("total_users", { ascending: false });
        break;
      case "name_asc":
        query = query.order("event_name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("event_name", { ascending: false });
        break;
      default:
        query = query.order("date", { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      setMessage("❌ Gagal mengambil data: " + error.message);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  // Hapus data
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Apakah kamu yakin ingin menghapus data ini?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      setMessage("✅ Data berhasil dihapus!");
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error(err);
      setMessage("❌ Gagal menghapus data: " + err.message);
    }
  };

  // Buka modal edit
  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      event_name: event.event_name,
      location: event.location,
      date: event.date.split("T")[0], // ambil bagian tanggal saja
      total_users: event.total_users,
    });
  };

  // Simpan hasil edit
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("events")
        .update({
          event_name: formData.event_name,
          location: formData.location,
          date: formData.date,
          total_users: formData.total_users,
        })
        .eq("id", editingEvent.id);

      if (error) throw error;

      setMessage("✅ Data berhasil diperbarui!");
      setEditingEvent(null);

      // update tampilan data tanpa fetch ulang semua
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEvent.id ? { ...ev, ...formData } : ev
        )
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Gagal memperbarui data: " + err.message);
    }
  };

  useEffect(() => {
    fetchData(sortBy);
  }, [sortBy]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Event Data</h1>

        {/* Dropdown Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="date_desc">📅 Tanggal (Terbaru)</option>
          <option value="date_asc">📅 Tanggal (Terlama)</option>
          <option value="users_desc">👥 Pengguna (Terbanyak)</option>
          <option value="users_asc">👥 Pengguna (Tersedikit)</option>
          <option value="name_asc">🔤 Nama Event (A-Z)</option>
          <option value="name_desc">🔤 Nama Event (Z-A)</option>
        </select>
      </div>

      {message && (
        <p className="mb-4 text-sm text-gray-700 bg-gray-100 p-2 rounded">
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading data...</p>
      ) : events.length === 0 ? (
        <p>Belum ada data event yang tersedia.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-3 text-left">Nama Event</th>
                <th className="p-3 text-left">Lokasi</th>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Total Pengguna</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{event.event_name}</td>
                  <td className="p-3">{event.location}</td>
                  <td className="p-3">
                    {new Date(event.date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="p-3">{event.total_users}</td>
                  <td className="p-3 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(event)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edit */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleUpdate}
            className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-2xl w-96 border border-white/40"
          >
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              Edit Event
            </h2>

            <label className="block text-sm font-semibold">Nama Event</label>
            <input
              type="text"
              value={formData.event_name}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
              className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />

            <label className="block text-sm font-semibold">Lokasi</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />

            <label className="block text-sm font-semibold">Tanggal</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />

            <label className="block text-sm font-semibold">
              Total Pengguna
            </label>
            <input
              type="number"
              value={formData.total_users}
              onChange={(e) =>
                setFormData({ ...formData, total_users: e.target.value })
              }
              className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventData;
