import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../client";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Gagal memuat event:", error);
      else setEvent(data);

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500 animate-pulse">Memuat detail event...</p>
      </div>
    );

  if (!event)
    return (
      <div className="p-10 text-center text-gray-500">
        Event tidak ditemukan 😢
        <div className="mt-4">
          <Link
            to="/calender"
            className="text-blue-500 hover:underline font-medium"
          >
            ← Kembali ke Kalender
          </Link>
        </div>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Tombol Kembali */}
      <Link
        to="/calender"
        className="text-blue-500 hover:underline flex items-center gap-1 mb-6"
      >
        ← Kembali ke Kalender
      </Link>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-gray-700">
          POST IMPLEMENTATION ANALYSIS
        </h1>
        <h2 className="text-4xl font-bold mt-2">
          LOCAL EVENT |{" "}
          <span className="text-red-600">{event.name || "Event"}</span>
        </h2>
        <h3 className="text-lg mt-2 text-gray-600 font-medium">
          {event.location || "Lokasi Tidak Diketahui"}
        </h3>
      </div>

      {/* Container Utama */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* BACKGROUND */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <div className="bg-gray-300 text-gray-800 font-bold px-3 py-1 rounded-md w-fit mb-3">
            BACKGROUND
          </div>
          <p className="font-semibold text-gray-800">
            Local Event{" "}
            <span className="text-red-600">{event.name || "-"}</span>
          </p>
          <p className="mt-2">
            Date:{" "}
            <span className="font-medium">
              {event.start_date
                ? new Date(event.start_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
              {event.end_date
                ? ` - ${new Date(event.end_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}`
                : ""}
            </span>
          </p>
          <p>Main Venue: {event.location || "-"}</p>
          <p>Regional: {event.regional || "-"}</p>
          <p className="mt-2 text-gray-700">
            Action: <span className="italic">Healthy Check & Optimization</span>
          </p>
        </div>

        {/* SUMMARY PRODUCTIVITY */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <div className="bg-gray-300 text-gray-800 font-bold px-3 py-1 rounded-md w-fit mb-3">
            SUMMARY PRODUCTIVITY
          </div>
          <ul className="list-disc ml-5 space-y-2">
            <li>
              Incremental <strong>Revenue</strong> During Event :{" "}
              <span className="text-green-600 font-semibold">
                Rp 5,022 Mio (43.85%)
              </span>
            </li>
            <li>
              Incremental <strong>Payload</strong> During Event :{" "}
              <span className="text-green-600 font-semibold">
                2.59 TB (65.53%)
              </span>
            </li>
            <li>
              Total Incremental <strong>Max User</strong> :{" "}
              <span className="text-green-600 font-semibold">
                6,413 User (130.7%)
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Grafik Section */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {[
          { title: "PAYLOAD", growth: "+65.53%" },
          { title: "REVENUE", growth: "+43.8%" },
          { title: "USER", growth: "+130.7%" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-xl shadow border border-gray-200"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="bg-blue-900 text-white text-sm px-3 py-1 rounded">
                {item.title}
              </span>
              <span className="text-green-600 font-bold">{item.growth}</span>
            </div>
            <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400 text-sm rounded">
              Grafik {item.title} Placeholder
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDetail;
