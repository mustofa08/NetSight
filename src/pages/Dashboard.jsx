import React, { useEffect, useState } from "react";
import { supabase } from "../client";
import { CalendarDays, MapPin, Clock, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Dashboard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*");
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("❌ Gagal mengambil event:", err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const eventByMonth = monthNames.map((month) => {
    const count = events.filter(
      (ev) =>
        (ev.month || "").toLowerCase() === month.toLowerCase() &&
        Number(ev.year) === selectedYear
    ).length;

    return {
      month: month.slice(0, 3),
      count,
    };
  });

  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300 p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          Selamat Datang,{" "}
          <span className="text-blue-600 dark:text-blue-400">{userName}</span>{" "}
          👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Berikut ringkasan kegiatan dan event Anda
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">
          Memuat data...
        </p>
      ) : (
        <>
          {/* Statistik Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: <CalendarDays className="text-blue-500" size={26} />,
                label: "Total Event",
                value: totalEvents,
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: <MapPin className="text-green-500" size={26} />,
                label: "Lokasi Terbanyak",
                value: topLocation,
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: <Clock className="text-orange-500" size={26} />,
                label: "Event Terdekat",
                value: upcomingEvent ? upcomingEvent.name : "-",
                sub: upcomingEvent
                  ? new Date(upcomingEvent.start_date).toLocaleDateString(
                      "id-ID"
                    )
                  : "",
                color: "from-yellow-400 to-orange-500",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative bg-gradient-to-br ${item.color} p-[2px] rounded-2xl shadow-md hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 h-full">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <h2 className="text-gray-600 dark:text-gray-300 text-sm">
                        {item.label}
                      </h2>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {item.value}
                      </p>
                      {item.sub && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.sub}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tahun */}
          <div className="flex justify-end mb-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-md px-3 py-2 text-sm shadow-sm hover:border-blue-400 focus:ring-2 focus:ring-blue-300"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-10 shadow-md border dark:border-slate-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="text-blue-500" /> Statistik Event per
                Bulan
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={eventByMonth}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  stroke="#9CA3AF"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    color: "#F8FAFC",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daftar Event */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <CalendarDays className="text-blue-600" /> Daftar Event Terbaru
            </h2>
            {events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Belum ada data event.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-100 border-b dark:border-slate-600">
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
                      .slice(0, 8)
                      .map((e) => (
                        <tr
                          key={e.id}
                          className="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition duration-200"
                        >
                          <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                            {e.name}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">
                            {e.category}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">
                            {e.location}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">
                            {e.start_date && e.end_date
                              ? `${new Date(e.start_date).toLocaleDateString(
                                  "id-ID"
                                )} - ${new Date(e.end_date).toLocaleDateString(
                                  "id-ID"
                                )}`
                              : "Tanggal belum ditentukan"}
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
