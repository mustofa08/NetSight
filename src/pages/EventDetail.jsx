import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../client";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [siteServing, setSiteServing] = useState("");
  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Ambil data event berdasarkan ID
  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Gagal memuat event:", error);
      else {
        setEvent(data);
        setSiteServing(data.site_serving || "");
        setAction(data.action || "");
      }

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  // 🔹 Simpan perubahan ke Supabase
  const handleSave = async () => {
    if (!event) return;
    setSaving(true);

    const { error } = await supabase
      .from("calender_events")
      .update({
        site_serving: siteServing,
        action: action,
      })
      .eq("id", event.id);

    if (error) {
      console.error("Gagal menyimpan perubahan:", error);
      alert("Gagal menyimpan perubahan!");
    } else {
      setEvent({
        ...event,
        site_serving: siteServing,
        action: action,
      });
      setEditing(false);
    }

    setSaving(false);
  };

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
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 relative">
          <div className="bg-gray-300 text-gray-800 font-bold px-4 py-1 rounded-md w-fit mb-4">
            BACKGROUND
          </div>

          {/* Tombol Edit di pojok kanan atas */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="absolute top-4 right-4 bg-blue-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          )}

          <div className="space-y-2 text-gray-800">
            <p className="font-semibold">
              Local Event{" "}
              <span className="text-red-600">{event.name || "-"}</span>
            </p>

            <p>
              <span className="font-semibold">Date : </span>
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
                : ""}{" "}
              (
              {event.start_date && event.end_date
                ? `${
                    Math.ceil(
                      (new Date(event.end_date) - new Date(event.start_date)) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                  } Day`
                : "Unknown"}
              )
            </p>

            <div>
              <p className="font-semibold">Main Venue :</p>
              <ul className="list-disc ml-5">
                <li>{event.location || "-"}</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">Site Serving :</p>
              <ul className="list-disc ml-5">
                {event.site_serving ? (
                  event.site_serving
                    .split(",")
                    .map((site, i) => <li key={i}>{site.trim()}</li>)
                ) : (
                  <li>Belum diisi</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-semibold">Action :</p>
              <ul className="list-disc ml-5">
                {event.action ? (
                  event.action
                    .split(",")
                    .map((act, i) => <li key={i}>{act.trim()}</li>)
                ) : (
                  <li>Belum diisi</li>
                )}
              </ul>
            </div>
          </div>

          {/* Mode Edit */}
          {editing && (
            <div className="mt-6 border-t pt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Site Serving
                </label>
                <input
                  type="text"
                  value={siteServing}
                  onChange={(e) => setSiteServing(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Contoh: SBY767, SBX370"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Action
                </label>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Contoh: Healthy Check & Optim Site Surrounding"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY PRODUCTIVITY */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <div className="bg-gray-300 text-gray-800 font-bold px-3 py-1 rounded-md w-fit mb-3">
            SUMMARY PRODUCTIVITY
          </div>
          <ul className="list-disc ml-5 space-y-2">
            <li>
              Incremental <strong>Revenue</strong> During Event :{" "}
              <span className="text-green-600 font-semibold">kosong</span>
            </li>
            <li>
              Incremental <strong>Payload</strong> During Event :{" "}
              <span className="text-green-600 font-semibold">kosong</span>
            </li>
            <li>
              Total Incremental <strong>Max User</strong> :{" "}
              <span className="text-green-600 font-semibold">kosong</span>
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
