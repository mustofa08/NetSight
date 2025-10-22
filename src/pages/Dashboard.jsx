import React, { useEffect, useState } from "react";
import { supabase } from "../client";

const Dashboard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*");
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hitung data ringkasan
  const totalEvents = events.length;
  const totalUsers = events.reduce((sum, e) => sum + (e.total_users || 0), 0);

  // Dapatkan event terbaru tanpa merusak urutan aslinya
  const latestEvent =
    events.length > 0
      ? [...events].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : null;

  // Ambil nama user dari metadata atau email
  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="p-6">
      {/* Judul */}
      <h1 className="text-2xl font-bold mb-4">
        Selamat Datang{" "}
        <span className="text-blue-600 font-extrabold">{userName}</span> di{" "}
        <span className="text-blue-600 font-extrabold">NetSight</span>
      </h1>

      {/* Loading */}
      {loading ? (
        <p className="text-gray-500">Memuat data...</p>
      ) : (
        <>
          {/* Ringkasan Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-md border">
              <h2 className="text-gray-600 text-sm mb-1">Total Event</h2>
              <p className="text-3xl font-semibold text-blue-600">
                {totalEvents}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-md border">
              <h2 className="text-gray-600 text-sm mb-1">Total Pengguna</h2>
              <p className="text-3xl font-semibold text-green-600">
                {totalUsers}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-md border">
              <h2 className="text-gray-600 text-sm mb-1">Event Terbaru</h2>
              <p className="text-lg font-medium text-gray-800">
                {latestEvent ? latestEvent.event_name : "-"}
              </p>
              <p className="text-sm text-gray-500">
                {latestEvent
                  ? new Date(latestEvent.date).toLocaleDateString("id-ID")
                  : ""}
              </p>
            </div>
          </div>

          {/* Tabel Ringkas */}
          <div className="bg-white rounded-xl shadow-md p-5 border">
            <h2 className="text-xl font-semibold mb-3">Daftar Event Terbaru</h2>
            {events.length === 0 ? (
              <p className="text-gray-500">Belum ada data event.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-3 text-left">Nama Event</th>
                      <th className="p-3 text-left">Lokasi</th>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Pengguna</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...events]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      .slice(0, 5)
                      .map((e) => (
                        <tr
                          key={e.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-3">{e.event_name}</td>
                          <td className="p-3">{e.location}</td>
                          <td className="p-3">
                            {new Date(e.date).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-3">{e.total_users}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
