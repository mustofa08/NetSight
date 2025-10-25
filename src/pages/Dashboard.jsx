import React, { useEffect, useState } from "react";
import { supabase } from "../client";
import { CalendarDays, MapPin, Users, Clock } from "lucide-react";

const Dashboard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Ambil data dari tabel "calender_events"
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*");
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error(
        "❌ Gagal mengambil event dari calender_events:",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // 📊 Ringkasan data
  const totalEvents = events.length;

  // Lokasi terbanyak
  const locationCount = events.reduce((acc, ev) => {
    if (ev.location) acc[ev.location] = (acc[ev.location] || 0) + 1;
    return acc;
  }, {});
  const topLocation =
    Object.keys(locationCount).length > 0
      ? Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0][0]
      : "-";

  // Event terdekat
  const today = new Date();
  const upcomingEvent = [...events]
    .filter((e) => e.start_date && new Date(e.start_date) >= today)
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )[0];

  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">
        Selamat Datang, <span className="text-blue-600">{userName}</span> 👋
      </h1>
      <p className="text-gray-600 mb-8">Berikut ringkasan kegiatan dan event</p>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Memuat data...</p>
      ) : (
        <>
          {/* Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-blue-600" />
                <div>
                  <h2 className="text-gray-600 text-sm">Total Event</h2>
                  <p className="text-2xl font-semibold text-blue-600">
                    {totalEvents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <MapPin className="text-green-600" />
                <div>
                  <h2 className="text-gray-600 text-sm">Lokasi Terbanyak</h2>
                  <p className="text-lg font-medium text-green-600">
                    {topLocation}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <Clock className="text-orange-500" />
                <div>
                  <h2 className="text-gray-600 text-sm">Event Terdekat</h2>
                  <p className="text-lg font-medium text-gray-800">
                    {upcomingEvent ? upcomingEvent.name : "-"}
                  </p>
                  {upcomingEvent && (
                    <p className="text-xs text-gray-500">
                      {new Date(upcomingEvent.start_date).toLocaleDateString(
                        "id-ID"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <Users className="text-purple-600" />
                <div>
                  <h2 className="text-gray-600 text-sm">Total Regional</h2>
                  <p className="text-lg font-medium text-purple-600">
                    {new Set(events.map((e) => e.regional)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white rounded-2xl shadow-md border p-6">
            <h2 className="text-xl font-semibold mb-4">
              📅 Daftar Event Terbaru
            </h2>
            {events.length === 0 ? (
              <p className="text-gray-500">Belum ada data event.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 border-b">
                      <th className="p-3 text-left">Nama Event</th>
                      <th className="p-3 text-left">Kategori</th>
                      <th className="p-3 text-left">Lokasi</th>
                      <th className="p-3 text-left">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...events]
                      .sort(
                        (a, b) =>
                          new Date(b.start_date).getTime() -
                          new Date(a.start_date).getTime()
                      )
                      .slice(0, 6)
                      .map((e) => (
                        <tr
                          key={e.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-3 font-medium text-gray-800">
                            {e.name}
                          </td>
                          <td className="p-3 text-gray-600">{e.category}</td>
                          <td className="p-3 text-gray-600">{e.location}</td>
                          <td className="p-3 text-gray-600">
                            {new Date(e.start_date).toLocaleDateString("id-ID")}{" "}
                            - {new Date(e.end_date).toLocaleDateString("id-ID")}
                          </td>
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
