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
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          📅 EVENT CALENDAR {selectedYear}
        </h1>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border rounded px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: 7 }, (_, i) => 2024 + i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <p className="text-gray-600 mb-8">
        Area Network Operation Jawa Bali – Kelola Event Tahunan
      </p>

      {/* 🔍 Search Bar */}
      <div className="mb-10">
        <input
          type="text"
          placeholder="Cari event berdasarkan nama, kategori, atau lokasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border rounded px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 🔎 Hasil Pencarian */}
      {search && (
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-3 text-blue-700">
            🔍 Hasil Pencarian:
          </h2>
          {filteredEvents.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {filteredEvents.map((ev, i) => (
                <li
                  key={i}
                  className="bg-white border rounded p-3 shadow-sm flex justify-between"
                >
                  <div>
                    <div className="font-bold text-black">{ev.category}</div>
                    <Link
                      to={`/event/${ev.id}`}
                      className="text-blue-700 hover:underline block"
                    >
                      {ev.name}
                    </Link>

                    <div className="text-xs text-gray-500">
                      📍 {ev.location || "-"} | {ev.regional} ({ev.month})
                    </div>
                    <div className="text-xs text-gray-500">
                      📆 {formatTanggal(ev.startDate, ev.endDate)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() =>
                        handleEdit(
                          ev.monthIndex,
                          ev.regionalIndex,
                          ev.eventIndex,
                          ev
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => handleRemove(ev.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      🗑 Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm italic mt-2">
              Tidak ada event ditemukan.
            </p>
          )}
        </div>
      )}

      {/* 🔽 Semua Bulan */}
      <div className="space-y-10">
        {data.map((month, monthIndex) => (
          <div key={month.month}>
            <h2 className="text-xl font-bold bg-blue-900 text-white p-3 rounded-md mb-4 inline-block">
              {month.month.toUpperCase()}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {month.regional.map((wil, regionalIndex) => (
                <div
                  key={wil.nama}
                  className={`bg-white rounded-lg shadow p-4 border-t-4 ${getBorderColor(
                    wil.nama
                  )}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-blue-700">
                      {wil.nama}
                    </h3>
                    <button
                      onClick={() => handleAdd(monthIndex, regionalIndex)}
                      className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700"
                    >
                      + Tambah
                    </button>
                  </div>

                  {wil.events.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {wil.events.map((ev, idx) => (
                        <li
                          key={idx}
                          className="bg-gray-50 p-2 rounded border flex justify-between items-start"
                        >
                          <div>
                            <div className="font-bold">{ev.category}</div>
                            <Link
                              to={`/event/${ev.id}`}
                              className="text-blue-700 hover:underline block"
                            >
                              {ev.name}
                            </Link>
                            <div className="text-xs text-gray-500">
                              📍 {ev.location}
                            </div>
                            <div className="text-xs text-gray-500">
                              📆 {formatTanggal(ev.startDate, ev.endDate)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() =>
                                handleEdit(monthIndex, regionalIndex, idx, ev)
                              }
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => handleRemove(ev.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              🗑 Hapus
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic text-xs">
                      Belum ada event
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-blue-700">
              {isEditing ? "Edit Event" : "Tambah Event"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Kategori Event*</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Nama Event*</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
