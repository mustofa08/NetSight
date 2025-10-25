import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../client";

const EventDetail = () => {
  const { id } = useParams(); // ambil ID event dari URL
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Gagal memuat event:", error);
      } else {
        setEvent(data);
      }
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
    <div className="p-8">
      <Link
        to="/calender"
        className="text-blue-500 hover:underline flex items-center gap-1 mb-6"
      >
        ← Kembali ke Kalender
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto border-t-4 border-blue-600">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{event.name}</h1>

        <div className="text-gray-600 space-y-2">
          <p>
            <strong>Kategori:</strong> {event.category || "-"}
          </p>
          <p>
            <strong>Wilayah:</strong> {event.regional || "-"}
          </p>
          <p>
            <strong>Bulan:</strong> {event.month || "-"}
          </p>
          <p>
            <strong>Lokasi:</strong> {event.location || "-"}
          </p>
          <p>
            <strong>Tanggal Mulai:</strong>{" "}
            {event.start_date
              ? new Date(event.start_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"}
          </p>
          <p>
            <strong>Tanggal Selesai:</strong>{" "}
            {event.end_date
              ? new Date(event.end_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
