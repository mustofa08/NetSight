import React, { useEffect, useState } from "react";
import { supabase } from "../client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [events, setEvents] = useState([]);
  const [highestEvent, setHighestEvent] = useState(null);
  const [lowestEvent, setLowestEvent] = useState(null); // 🆕 Tambahan
  const [averageUsers, setAverageUsers] = useState(0);
  const [avgByLocation, setAvgByLocation] = useState([]);
  const [avgByEvent, setAvgByEvent] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from("events").select("*");

    if (error) {
      console.error("Error fetching data:", error.message);
      return;
    }

    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(sortedData);

    const avg =
      data.length > 0
        ? data.reduce((acc, val) => acc + val.total_users, 0) / data.length
        : 0;
    setAverageUsers(avg.toFixed(0));

    // 🔹 Event dengan trafik tertinggi
    const maxEvent = data.reduce(
      (prev, curr) => (prev.total_users > curr.total_users ? prev : curr),
      data[0]
    );
    setHighestEvent(maxEvent);

    // 🔹 Event dengan trafik terendah
    const minEvent = data.reduce(
      (prev, curr) => (prev.total_users < curr.total_users ? prev : curr),
      data[0]
    );
    setLowestEvent(minEvent);

    // 🔹 Hitung rata-rata pengguna per lokasi
    const locationMap = {};
    data.forEach((e) => {
      if (!locationMap[e.location]) {
        locationMap[e.location] = { total: e.total_users, count: 1 };
      } else {
        locationMap[e.location].total += e.total_users;
        locationMap[e.location].count += 1;
      }
    });

    const locationAverages = Object.entries(locationMap).map(
      ([location, val]) => ({
        location,
        average_users: (val.total / val.count).toFixed(0),
      })
    );
    setAvgByLocation(locationAverages);

    // 🔹 Hitung rata-rata pengguna per event
    const eventMap = {};
    data.forEach((e) => {
      if (!eventMap[e.event_name]) {
        eventMap[e.event_name] = { total: e.total_users, count: 1 };
      } else {
        eventMap[e.event_name].total += e.total_users;
        eventMap[e.event_name].count += 1;
      }
    });

    const eventAverages = Object.entries(eventMap).map(([event, val]) => ({
      event_name: event,
      average_users: (val.total / val.count).toFixed(0),
    }));
    setAvgByEvent(eventAverages);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Analytics Data Event</h1>

      {/* Statistik Singkat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="font-semibold text-gray-700">Total Event</h3>
          <p className="text-3xl font-bold mt-2">{events.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="font-semibold text-gray-700">Rata-rata Pengguna</h3>
          <p className="text-3xl font-bold mt-2">{averageUsers}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="font-semibold text-gray-700">Event Tertinggi</h3>
          {highestEvent ? (
            <>
              <p className="text-lg font-semibold mt-2">
                {highestEvent.event_name}
              </p>
              <p className="text-green-600 font-bold text-2xl">
                {highestEvent.total_users}
              </p>
            </>
          ) : (
            <p className="text-gray-400">-</p>
          )}
        </div>

        {/* 🆕 Event Terendah */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="font-semibold text-gray-700">Event Terendah</h3>
          {lowestEvent ? (
            <>
              <p className="text-lg font-semibold mt-2">
                {lowestEvent.event_name}
              </p>
              <p className="text-red-600 font-bold text-2xl">
                {lowestEvent.total_users}
              </p>
            </>
          ) : (
            <p className="text-gray-400">-</p>
          )}
        </div>
      </div>

      {/* Grafik Tren Pengguna */}
      <div className="bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Tren Jumlah Pengguna</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={events}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_users"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Total Pengguna"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rata-rata Pengguna per Lokasi */}
      <div className="bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          📍 Rata-rata Pengguna Berdasarkan Lokasi
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={avgByLocation}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="average_users"
              fill="#f59e0b"
              name="Rata-rata Pengguna"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rata-rata Pengguna per Event */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">
          🗓️ Rata-rata Pengguna Berdasarkan Event
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={avgByEvent}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="average_users"
              fill="#3b82f6"
              name="Rata-rata Pengguna"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
