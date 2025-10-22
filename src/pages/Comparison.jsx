import React, { useEffect, useState } from "react";
import { supabase } from "../client";

const Comparison = () => {
  const [events, setEvents] = useState([]);
  const [eventA, setEventA] = useState(null);
  const [eventB, setEventB] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      console.error("Error fetching events:", error.message);
    } else {
      setEvents(data);
    }
  };

  const handleCompare = (id, type) => {
    const selectedEvent = events.find((e) => e.id === parseInt(id));
    if (type === "A") setEventA(selectedEvent);
    else setEventB(selectedEvent);
  };

  // Fungsi untuk menghitung selisih dan persentase
  const getComparisonDetails = (a, b) => {
    if (!a || !b) return null;

    const diff = a.total_users - b.total_users;
    const absDiff = Math.abs(diff);
    const percent =
      b.total_users !== 0 ? ((absDiff / b.total_users) * 100).toFixed(2) : "0";

    return {
      diff,
      absDiff,
      percent,
    };
  };

  const comparison =
    eventA && eventB ? getComparisonDetails(eventA, eventB) : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Perbandingan Data Event</h1>

      {/* Dropdown untuk memilih event */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">
            Pilih Event 1
          </label>
          <select
            className="border rounded p-2 w-full"
            onChange={(e) => handleCompare(e.target.value, "A")}
          >
            <option value="">-- Pilih Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">
            Pilih Event 2
          </label>
          <select
            className="border rounded p-2 w-full"
            onChange={(e) => handleCompare(e.target.value, "B")}
          >
            <option value="">-- Pilih Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hasil perbandingan */}
      {(eventA || eventB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[eventA, eventB].map((event, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl shadow-md border ${
                event ? "bg-white" : "bg-gray-50"
              }`}
            >
              {event ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">
                    {event.event_name}
                  </h2>
                  <p className="text-gray-600">
                    📍 <strong>Lokasi:</strong> {event.location}
                  </p>
                  <p className="text-gray-600">
                    📅 <strong>Tanggal:</strong>{" "}
                    {new Date(event.date).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-gray-600">
                    👥 <strong>Jumlah Pengguna:</strong> {event.total_users}
                  </p>
                </>
              ) : (
                <p className="text-gray-400 italic text-center">
                  Belum ada event dipilih.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hasil perbandingan detail */}
      {eventA && eventB && (
        <div className="mt-8 bg-blue-50 border border-blue-200 p-5 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">📊 Hasil Perbandingan</h2>

          <p className="mb-2">
            {eventA.total_users > eventB.total_users
              ? `Event "${eventA.event_name}" memiliki lebih banyak pengguna (${eventA.total_users}) dibanding "${eventB.event_name}" (${eventB.total_users}).`
              : eventA.total_users < eventB.total_users
              ? `Event "${eventB.event_name}" memiliki lebih banyak pengguna (${eventB.total_users}) dibanding "${eventA.event_name}" (${eventA.total_users}).`
              : `Kedua event memiliki jumlah pengguna yang sama (${eventA.total_users}).`}
          </p>

          <p className="text-gray-700 font-medium">
            🔢 Selisih jumlah pengguna: {comparison.absDiff}
          </p>
          <p className="text-gray-700 font-medium">
            📈 Perbedaan persentase: {comparison.percent}%
          </p>
        </div>
      )}
    </div>
  );
};

export default Comparison;
