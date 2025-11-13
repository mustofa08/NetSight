import React, { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { supabase } from "../client";
import { Link } from "react-router-dom";

const Calender = () => {
  const initialData = [
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
  ].map((month) => ({
    month,
    regional: [
      { nama: "JATENG DIY", events: [] },
      { nama: "JAWA TIMUR", events: [] },
      { nama: "BALI NUSRA", events: [] },
    ],
  }));

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState({
    month: null,
    regional: null,
    event: null,
  });
  const [scrollY, setScrollY] = useState(0);

  const [formData, setFormData] = useState({
    id: null,
    category: "",
    name: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  // 🔹 Fungsi warna border
  const getBorderColor = (nama) => {
    switch (nama) {
      case "JATENG DIY":
        return "border-green-500";
      case "JAWA TIMUR":
        return "border-blue-500";
      case "BALI NUSRA":
        return "border-red-500";
      default:
        return "border-blue-500";
    }
  };

  // 🔹 Ambil data awal dari Supabase
  const fetchData = async () => {
    setLoading(true);
    const { data: events, error } = await supabase
      .from("calender_events")
      .select("*")
      .eq("year", selectedYear);

    if (error) {
      console.error("Gagal mengambil data:", error);
      setLoading(false);
      return;
    }

    const updatedData = initialData.map((monthObj) => ({
      ...monthObj,
      regional: monthObj.regional.map((wilObj) => ({
        ...wilObj,
        events: events
          .filter(
            (ev) => ev.month === monthObj.month && ev.regional === wilObj.nama
          )
          .map((ev) => ({
            id: ev.id,
            category: ev.category,
            name: ev.name,
            location: ev.location,
            startDate: ev.start_date,
            endDate: ev.end_date,
          })),
      })),
    }));

    setData(updatedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  // 🔹 Setelah data berubah, jaga posisi scroll
  useLayoutEffect(() => {
    if (scrollY > 0) {
      window.scrollTo(0, scrollY);
    }
  }, [data]);

  // 🔹 Format tanggal
  const formatTanggal = (start, end) => {
    if (!start && !end) return "-";
    const f = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const s = start ? f.format(new Date(start)) : "";
    const e = end ? f.format(new Date(end)) : "";
    return !e || s === e ? s : `${s} s.d. ${e}`;
  };

  // 🔹 Tambah event baru
  const handleAdd = (monthIndex, regionalIndex) => {
    setSelected({ month: monthIndex, regional: regionalIndex, event: null });
    setFormData({
      id: null,
      category: "",
      name: "",
      location: "",
      startDate: "",
      endDate: "",
    });
    setIsEditing(false);
    setShowForm(true);
  };

  // 🔹 Edit event
  const handleEdit = (monthIndex, regionalIndex, eventIndex, event) => {
    setSelected({
      month: monthIndex,
      regional: regionalIndex,
      event: eventIndex,
    });
    setFormData(event);
    setIsEditing(true);
    setShowForm(true);
  };

  // 🔹 Hapus event
  const handleRemove = async (eventId) => {
    if (!window.confirm("Yakin ingin hapus event ini?")) return;
    setScrollY(window.scrollY);
    const { error } = await supabase
      .from("calender_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Gagal menghapus:", error);
      alert("Gagal menghapus event");
      return;
    }

    // Perbarui data lokal tanpa reload
    setData((prevData) =>
      prevData.map((m) => ({
        ...m,
        regional: m.regional.map((r) => ({
          ...r,
          events: r.events.filter((ev) => ev.id !== eventId),
        })),
      }))
    );
  };

  // 🔹 Simpan event (Tambah/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setScrollY(window.scrollY);

    const month = data[selected.month].month;
    const regional = data[selected.month].regional[selected.regional].nama;

    const payload = {
      year: selectedYear,
      month,
      regional,
      category: formData.category,
      name: formData.name,
      location: formData.location,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
    };

    let error, newEvent;

    if (isEditing && formData.id) {
      ({ error } = await supabase
        .from("calender_events")
        .update(payload)
        .eq("id", formData.id));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("calender_events")
        .insert([payload])
        .select()
        .single();
      error = insertError;
      newEvent = inserted;
    }

    if (error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal menyimpan event");
      return;
    }

    setShowForm(false);

    // 🔹 Update data lokal langsung tanpa reload
    setData((prevData) =>
      prevData.map((m, mi) =>
        mi === selected.month
          ? {
              ...m,
              regional: m.regional.map((r, ri) =>
                ri === selected.regional
                  ? {
                      ...r,
                      events: isEditing
                        ? r.events.map((ev) =>
                            ev.id === formData.id
                              ? {
                                  ...ev,
                                  ...payload,
                                  startDate: payload.start_date,
                                  endDate: payload.end_date,
                                }
                              : ev
                          )
                        : [
                            ...r.events,
                            {
                              ...newEvent,
                              startDate: payload.start_date,
                              endDate: payload.end_date,
                            },
                          ],
                    }
                  : r
              ),
            }
          : m
      )
    );
  };

  // 🔎 Filter pencarian
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return [];
    const keyword = search.toLowerCase();
    const results = [];
    data.forEach((month, monthIndex) => {
      month.regional.forEach((wil, regionalIndex) => {
        wil.events.forEach((ev, eventIndex) => {
          if (
            ev.name?.toLowerCase().includes(keyword) ||
            ev.category?.toLowerCase().includes(keyword) ||
            ev.location?.toLowerCase().includes(keyword)
          ) {
            results.push({
              ...ev,
              month: month.month,
              regional: wil.nama,
              monthIndex,
              regionalIndex,
              eventIndex,
            });
          }
        });
      });
    });
    return results;
  }, [data, search]);

  if (loading) return <p className="text-center p-8">Memuat data...</p>;

  // =======================================================================
  // ============================ RENDER ===================================
  // =======================================================================
  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-screen transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <span className="text-gray-800 dark:text-gray-100">📅</span>
          <span className="bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent dark:from-blue-300 dark:to-sky-500">
            Event Calendar
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            {selectedYear}
          </span>
        </h1>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-4 py-2 shadow-sm hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {Array.from({ length: 7 }, (_, i) => 2024 + i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <p className="text-gray-600 dark:text-slate-200 mb-6 italic">
        Area Network Operation Jawa Bali – Kelola Event Tahunan dengan mudah 💡
      </p>

      {/* Search Bar */}
      <div className="mb-10 flex items-center relative w-full md:w-1/2">
        <span className="absolute left-3 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Cari event berdasarkan nama, kategori, atau lokasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Hasil Pencarian */}
      {search && (
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-3 text-blue-700 dark:text-blue-400">
            🔍 Hasil Pencarian:
          </h2>

          {filteredEvents.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {filteredEvents.map((ev, i) => (
                <li
                  key={i}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex justify-between"
                >
                  <div>
                    <div className="font-semibold text-blue-800 dark:text-blue-400">
                      {ev.category}
                    </div>
                    <Link
                      to={`/event/${ev.id}`}
                      className="text-blue-600 dark:text-blue-300 hover:underline block text-base font-bold"
                    >
                      {ev.name}
                    </Link>
                    <div className="text-xs text-gray-500 dark:text-slate-200 mt-1">
                      📍 {ev.location || "-"} | {ev.regional} ({ev.month})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-200">
                      📆 {formatTanggal(ev.startDate, ev.endDate)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        handleEdit(
                          ev.monthIndex,
                          ev.regionalIndex,
                          ev.eventIndex,
                          ev
                        )
                      }
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => handleRemove(ev.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium"
                    >
                      🗑 Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic mt-2">
              Tidak ada event ditemukan.
            </p>
          )}
        </div>
      )}

      {/* Semua Bulan */}
      <div className="space-y-12">
        {data.map((month, monthIndex) => (
          <div key={month.month}>
            <h2 className="text-xl font-bold text-white bg-blue-800 dark:bg-blue-600 px-5 py-2 rounded-md shadow-md inline-block mb-5">
              {month.month.toUpperCase()}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {month.regional.map((wil, regionalIndex) => (
                <div
                  key={wil.nama}
                  className={`bg-white dark:bg-slate-800 border-l-4 ${getBorderColor(
                    wil.nama
                  )} rounded-lg shadow-md hover:shadow-lg transition-all p-4`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100">
                      {wil.nama}
                    </h3>

                    <button
                      onClick={() => handleAdd(monthIndex, regionalIndex)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs shadow"
                    >
                      + Tambah
                    </button>
                  </div>

                  {wil.events.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {wil.events.map((ev, idx) => (
                        <li
                          key={idx}
                          className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-3 rounded-md flex justify-between items-start hover:bg-gray-100 dark:hover:bg-slate-600 transition-all"
                        >
                          <div>
                            <div className="font-bold text-blue-700 dark:text-blue-400">
                              {ev.category}
                            </div>

                            <Link
                              to={`/event/${ev.id}`}
                              className="text-blue-600 dark:text-blue-300 hover:underline font-semibold"
                            >
                              {ev.name}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1 dark:text-slate-200">
                              📍 {ev.location}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-200">
                              📆 {formatTanggal(ev.startDate, ev.endDate)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() =>
                                handleEdit(monthIndex, regionalIndex, idx, ev)
                              }
                              className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => handleRemove(ev.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              🗑 Hapus
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 dark:text-slate-400 italic text-xs text-center py-2">
                      Belum ada event
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-5 text-blue-700 text-center">
              {isEditing ? "✏ Edit Event" : "➕ Tambah Event"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-white">
                  Kategori Event*
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-white">
                  Nama Event*
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white
"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-white">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white
"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-white">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-white">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-slate-600 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
                >
                  {isEditing ? "Simpan Perubahan" : "Tambah Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calender;
