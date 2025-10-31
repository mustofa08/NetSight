import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../client";
import * as XLSX from "xlsx";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [siteServing, setSiteServing] = useState("");
  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [excelUrl, setExcelUrl] = useState("");
  const [excelFilePath, setExcelFilePath] = useState("");

  const [chartType, setChartType] = useState({
    payload: "bar",
    rev: "bar",
    user: "bar",
  });
  const [chartFilter, setChartFilter] = useState({
    payload: "all",
    rev: "all",
    user: "all",
  });

  const [summary, setSummary] = useState({
    revenue: 0,
    payload: 0,
    maxUser: 0,
    growthRevenue: 0,
    growthPayload: 0,
    growthUser: 0,
  });

  // 🔹 Ambil data event dari Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("calender_events")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setEvent(data);
        setSiteServing(data.site_serving || "");
        setAction(data.action || "");
        setExcelUrl(data.excel_url || "");
        setExcelFilePath(data.excel_file_path || "");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  // 🔹 Load & parsing Excel dari Supabase
  useEffect(() => {
    if (!excelUrl) return;
    const fetchExcel = async () => {
      try {
        const res = await fetch(excelUrl);
        const arrayBuffer = await res.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const [headerRow, ...rows] = jsonData;
        if (!headerRow) return;

        const formatted = rows
          .filter((r) => r.length > 1)
          .map((row) => {
            const obj = {};
            headerRow.forEach((key, i) => {
              let value = row[i];
              if (!isNaN(value) && value !== "") value = Number(value);
              obj[key] = value;
            });

            // 🔸 Format tanggal aman
            const firstKey = headerRow[0];
            if (obj[firstKey]) {
              const raw = obj[firstKey];
              let dateVal;
              if (typeof raw === "number") {
                const parsed = XLSX.SSF.parse_date_code(raw);
                if (parsed) {
                  dateVal = new Date(parsed.y, parsed.m - 1, parsed.d);
                }
              } else {
                dateVal = new Date(raw);
              }

              if (dateVal && !isNaN(dateVal)) {
                obj[firstKey] = `${dateVal.getDate()} ${dateVal.toLocaleString(
                  "id-ID",
                  { month: "short" }
                )}`;
              }
            }
            return obj;
          });

        setHeaders(headerRow);
        setExcelData(formatted);
      } catch (err) {
        console.error("Gagal fetch Excel:", err);
      }
    };
    fetchExcel();
  }, [excelUrl]);

  // 🔹 Simpan perubahan manual site_serving & action
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("calender_events")
      .update({
        site_serving: siteServing,
        action: action,
      })
      .eq("id", event.id);

    if (error) alert("Gagal menyimpan perubahan!");
    else {
      setEvent({ ...event, site_serving: siteServing, action: action });
      setEditing(false);
    }
    setSaving(false);
  };

  // 🔹 Upload Excel ke Supabase
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Hapus file lama kalau ada
      if (excelFilePath) {
        await supabase.storage.from("event-excels").remove([excelFilePath]);
      }

      // Buat nama unik
      const fileExt = file.name.split(".").pop();
      const newFileName = `event-${id}-${Date.now()}.${fileExt}`;

      // Upload file ke bucket
      const { error: uploadError } = await supabase.storage
        .from("event-excels")
        .upload(newFileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // ✅ Ambil public URL dengan benar
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("event-excels")
        .getPublicUrl(newFileName);

      if (urlError) throw urlError;
      const publicUrl = publicUrlData.publicUrl;

      // ✅ Simpan ke database
      const { error: updateError } = await supabase
        .from("calender_events")
        .update({
          excel_url: publicUrl,
          excel_file_path: newFileName,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // ✅ Update state
      setExcelUrl(publicUrl);
      setExcelFilePath(newFileName);
      alert("✅ File berhasil diupload dan tersimpan!");
    } catch (err) {
      console.error("Gagal upload Excel:", err);
      alert("❌ Gagal upload file!");
    }
  };

  // 🔹 Hapus Excel
  const handleExcelDelete = async () => {
    if (!excelFilePath) return;
    try {
      await supabase.storage.from("event-excels").remove([excelFilePath]);
      await supabase
        .from("calender_events")
        .update({ excel_url: null, excel_file_path: null })
        .eq("id", id);
      setExcelUrl("");
      setExcelFilePath("");
      setExcelData([]);
      setHeaders([]);
      alert("File Excel berhasil dihapus!");
    } catch (err) {
      console.error(err);
      alert("Gagal hapus file Excel!");
    }
  };

  // 🔹 Hitung summary productivity
  useEffect(() => {
    if (excelData.length === 0) return;

    const revKey = headers.find((h) => h.toLowerCase().includes("rev"));
    const payloadKey = headers.find((h) => h.toLowerCase().includes("payload"));
    const userKey = headers.find(
      (h) => h.toLowerCase().includes("user") || h.toLowerCase().includes("usr")
    );

    const totalRevenue = excelData.reduce(
      (sum, row) => sum + (row[revKey] || 0),
      0
    );
    const totalPayload = excelData.reduce(
      (sum, row) => sum + (row[payloadKey] || 0),
      0
    );
    const totalUser = excelData.reduce(
      (sum, row) => sum + (row[userKey] || 0),
      0
    );

    const growthRevenue =
      excelData.length > 1
        ? ((excelData.at(-1)[revKey] - excelData[0][revKey]) /
            excelData[0][revKey]) *
          100
        : 0;
    const growthPayload =
      excelData.length > 1
        ? ((excelData.at(-1)[payloadKey] - excelData[0][payloadKey]) /
            excelData[0][payloadKey]) *
          100
        : 0;
    const growthUser =
      excelData.length > 1
        ? ((excelData.at(-1)[userKey] - excelData[0][userKey]) /
            excelData[0][userKey]) *
          100
        : 0;

    setSummary({
      revenue: totalRevenue,
      payload: totalPayload,
      maxUser: totalUser,
      growthRevenue,
      growthPayload,
      growthUser,
    });
  }, [excelData, headers]);

  // 🔹 Chart data setup
  const chartSections = [
    { title: "PAYLOAD", key: "payload", growth: "+65.53%" },
    { title: "REVENUE", key: "rev", growth: "+43.85%" },
    { title: "USER", key: "user", growth: "+130.7%" },
  ];

  const highlightZones = [
    { x1: "7 Agu", x2: "14 Agu" },
    { x1: "13 Sep", x2: "15 Sep" },
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-96 text-gray-500">
        Memuat event...
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Link to="/calender" className="text-blue-600 hover:underline mb-6 block">
        ← Kembali ke Kalender
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-gray-700">
          POST IMPLEMENTATION ANALYSIS
        </h1>
        <h2 className="text-4xl font-bold mt-2">
          LOCAL EVENT |{" "}
          <span className="text-red-600">{event?.name || "Event"}</span>
        </h2>
      </div>

      {/* Background + Summary Productivity */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* BACKGROUND */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 relative">
          <div className="bg-gray-300 text-gray-800 font-bold px-4 py-1 rounded-md w-fit mb-4">
            BACKGROUND
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
            >
              Edit
            </button>
          )}
          {!editing ? (
            <div className="space-y-2 text-gray-800">
              <p className="font-semibold">
                Local Event <span className="text-red-600">{event.name}</span>
              </p>
              <p>
                <span className="font-semibold">Date: </span>
                {event.start_date && event.end_date
                  ? `${new Date(event.start_date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                    })} - ${new Date(event.end_date).toLocaleDateString(
                      "id-ID",
                      { day: "2-digit", month: "long", year: "numeric" }
                    )}`
                  : "-"}
              </p>
              <p className="font-semibold">Main Venue:</p>
              <ul className="list-disc ml-5">
                <li>{event.location || "-"}</li>
              </ul>
              <p className="font-semibold mt-2">Site Serving:</p>
              <ul className="list-disc ml-5">
                {event.site_serving
                  ? event.site_serving
                      .split(",")
                      .map((s, i) => <li key={`site-${i}`}>{s}</li>)
                  : "Belum diisi"}
              </ul>
              <p className="font-semibold mt-2">Action:</p>
              <ul className="list-disc ml-5">
                {event.action
                  ? event.action
                      .split(",")
                      .map((a, i) => <li key={`act-${i}`}>{a}</li>)
                  : "Belum diisi"}
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Site Serving</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="3"
                  value={siteServing}
                  onChange={(e) => setSiteServing(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Action</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="3"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY PRODUCTIVITY */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="bg-gray-300 text-gray-800 font-bold px-4 py-1 rounded-md w-fit mb-4">
            SUMMARY PRODUCTIVITY
          </div>
          <ul className="space-y-2 text-gray-800 font-semibold">
            <li>
              Incremental Revenue During Event :
              <span className="text-green-600">
                {" "}
                Rp {summary.revenue.toLocaleString()} Mio (
                {summary.growthRevenue.toFixed(2)}%)
              </span>
            </li>
            <li>
              Incremental Payload During Event :
              <span className="text-green-600">
                {" "}
                {summary.payload.toLocaleString()} TB (
                {summary.growthPayload.toFixed(2)}%)
              </span>
            </li>
            <li>
              Incremental Max User During Event :
              <span className="text-green-600">
                {" "}
                {summary.maxUser.toLocaleString()} User (
                {summary.growthUser.toFixed(2)}%)
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Upload & Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Upload Excel & Chart</h2>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="border rounded-md p-2 text-sm"
            />
            {excelUrl && (
              <button
                onClick={handleExcelDelete}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {excelData.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {chartSections.map((chart) => {
              const dataKeys = headers.filter((key) => {
                const lower = key.toLowerCase();
                if (key.length > 15) return false; // abaikan nama kolom panjang
                if (chart.key === "payload") return lower.includes("payload");
                if (chart.key === "rev") return lower.includes("rev");
                if (chart.key === "user")
                  return lower.includes("user") || lower.includes("usr");
                return false;
              });

              const filteredKeys =
                chartFilter[chart.key] === "all"
                  ? dataKeys
                  : [chartFilter[chart.key]];

              return (
                <div key={chart.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-700 text-white px-4 py-1 rounded-md font-bold">
                      {chart.title}
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow">
                      {chart.growth}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2 text-sm">
                    <select
                      className="border rounded px-2 py-1"
                      value={chartFilter[chart.key]}
                      onChange={(e) =>
                        setChartFilter({
                          ...chartFilter,
                          [chart.key]: e.target.value,
                        })
                      }
                    >
                      <option value="all">Semua</option>
                      {dataKeys.map((key) => (
                        <option key={`${chart.key}-${key}`} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>

                    <button
                      className="border px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      onClick={() =>
                        setChartType({
                          ...chartType,
                          [chart.key]:
                            chartType[chart.key] === "bar" ? "line" : "bar",
                        })
                      }
                    >
                      {chartType[chart.key] === "bar" ? "Bar 📊" : "Line 📈"}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg shadow p-3 border border-gray-200">
                    <ResponsiveContainer width="100%" height={280}>
                      {chartType[chart.key] === "bar" ? (
                        <BarChart data={excelData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={headers[0]} tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          {highlightZones.map((z, i) => (
                            <ReferenceArea
                              key={`${chart.key}-zone-${i}`}
                              x1={z.x1}
                              x2={z.x2}
                              fill="#d1fae5"
                              strokeOpacity={0.3}
                            />
                          ))}
                          {filteredKeys.map((key, i) => (
                            <Bar
                              key={`${chart.key}-${key}-${i}`}
                              dataKey={key}
                              fill={`hsl(${i * 80},70%,50%)`}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      ) : (
                        <LineChart data={excelData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={headers[0]} tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          {filteredKeys.map((key, i) => (
                            <Line
                              key={`${chart.key}-${key}-${i}`}
                              type="monotone"
                              dataKey={key}
                              stroke={`hsl(${i * 80},70%,50%)`}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-4">
            Belum ada file Excel diunggah 📄
          </p>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
