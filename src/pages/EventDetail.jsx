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
  const [actions, setActions] = useState([]);
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
        setActions(
          data.action ? data.action.split(",").map((a) => a.trim()) : []
        );
        setExcelUrl(data.excel_url || "");
        setExcelFilePath(data.excel_file_path || "");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  // 🔹 Load & parsing Excel dari Supabase + Auto isi Site Serving
  useEffect(() => {
    if (!excelUrl) return;

    const fetchExcel = async () => {
      try {
        const res = await fetch(excelUrl);
        const arrayBuffer = await res.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 🧩 Tentukan ulang range secara manual biar semua data kebaca
        let maxRow = 0;
        let maxCol = 0;
        Object.keys(sheet).forEach((addr) => {
          if (addr[0] === "!") return; // skip metadata
          const { r, c } = XLSX.utils.decode_cell(addr);
          if (r > maxRow) maxRow = r;
          if (c > maxCol) maxCol = c;
        });
        sheet["!ref"] = XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: maxRow, c: maxCol },
        });

        // 🧾 Convert ke JSON (pakai defval agar kosong tidak di-skip)
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
          defval: "",
        });

        const [headerRow, ...rows] = jsonData;
        if (!headerRow || headerRow.length === 0) return;

        // 🔄 Format baris menjadi objek
        const formatted = rows
          .filter((r) => r.some((cell) => cell !== ""))
          .map((row) => {
            const obj = {};
            headerRow.forEach((key, i) => {
              let value = row[i];
              if (typeof value === "string") {
                // Normalisasi angka dengan koma/titik campur
                value = value.replace(/\./g, "").replace(/,/g, ".");
              }
              if (!isNaN(parseFloat(value)) && value !== "")
                value = parseFloat(value);
              obj[key] = value;
            });

            // Konversi tanggal (kolom pertama)
            const firstKey = headerRow[0];
            if (obj[firstKey]) {
              const raw = obj[firstKey];
              let dateVal;

              if (typeof raw === "number") {
                const parsed = XLSX.SSF.parse_date_code(raw);
                if (parsed)
                  dateVal = new Date(parsed.y, parsed.m - 1, parsed.d);
              } else if (typeof raw === "string") {
                let clean = raw
                  .trim()
                  .replace(/\./g, "")
                  .replace(/[-_/]/g, " ")
                  .replace(/\s+/g, " ");
                const parts = clean.split(" ");
                const monthMap = {
                  jan: 0,
                  feb: 1,
                  mar: 2,
                  apr: 3,
                  mei: 4,
                  may: 4,
                  jun: 5,
                  jul: 6,
                  agu: 7,
                  ags: 7,
                  aug: 7,
                  sep: 8,
                  okt: 9,
                  oct: 9,
                  nov: 10,
                  des: 11,
                  dec: 11,
                };
                if (parts.length >= 2) {
                  const day = parseInt(parts[0]);
                  const monthTxt = parts[1].slice(0, 3).toLowerCase();
                  const month = monthMap[monthTxt];
                  if (!isNaN(day) && month !== undefined) {
                    const eventYear = new Date(
                      event?.start_date || Date.now()
                    ).getFullYear();
                    const year = eventYear;

                    dateVal = new Date(year, month, day);
                  }
                }
              }

              if (dateVal && !isNaN(dateVal)) {
                const monthShort = dateVal
                  .toLocaleString("id-ID", { month: "short" })
                  .replace(".", ""); // hapus titik dari 'Sep.'
                obj[firstKey] = `${dateVal.getDate()} ${monthShort}`;
              } else {
                console.warn("⚠️ Skip baris karena tanggal tidak valid:", raw);
              }
            }

            return obj;
          });

        setHeaders(headerRow);
        setExcelData(formatted);

        // 🟩 Auto isi site_serving
        const siteIdKey = headerRow.find(
          (h) =>
            h.toLowerCase().includes("site_id") ||
            h.toLowerCase().includes("site")
        );

        if (siteIdKey) {
          const uniqueSites = [
            ...new Set(
              formatted
                .map((row) => row[siteIdKey])
                .filter((v) => v && v.toString().trim() !== "")
            ),
          ];

          const siteString = uniqueSites.join(", ");

          // ✅ Simpan ke state lokal React
          setSiteServing(siteString);
          setEvent((prev) => ({
            ...prev,
            site_serving: siteString,
          }));

          // 🧭 Simpan otomatis site_serving ke database setelah upload Excel
          if (event?.id && siteString) {
            const { error } = await supabase
              .from("calender_events")
              .update({ site_serving: siteString })
              .eq("id", event.id);

            if (error) {
              console.error("❌ Gagal update site_serving:", error.message);
            } else {
              console.log(
                "✅ site_serving berhasil diupdate ke Supabase:",
                siteString
              );
            }
          }
        }
      } catch (err) {
        console.error("Gagal fetch Excel:", err);
      }
    };

    fetchExcel();
  }, [excelUrl]);

  // 🔹 Simpan perubahan Action
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("calender_events")
      .update({
        site_serving: siteServing,
        action: actions.join(", "),
      })
      .eq("id", event.id);

    if (error) alert("Gagal menyimpan perubahan!");
    else {
      setEvent((prev) => ({
        ...prev,
        site_serving: siteServing,
        action: actions.join(", "),
      }));
      setEditing(false);
    }
    setSaving(false);
  };

  // 🔹 Upload Excel ke Supabase
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (excelFilePath) {
        await supabase.storage.from("event-excels").remove([excelFilePath]);
      }

      const fileExt = file.name.split(".").pop();
      const newFileName = `event-${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-excels")
        .upload(newFileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("event-excels")
        .getPublicUrl(newFileName);

      if (urlError) throw urlError;
      const publicUrl = publicUrlData.publicUrl;

      await supabase
        .from("calender_events")
        .update({
          excel_url: publicUrl,
          excel_file_path: newFileName,
        })
        .eq("id", id);

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
      // 🧹 Reset dulu sebelum hapus agar state bersih
      const oldPath = excelFilePath;
      setExcelFilePath("");
      setExcelUrl("");
      setExcelData([]);
      setHeaders([]);
      setSiteServing("");
      setSummary({
        revenue: 0,
        payload: 0,
        maxUser: 0,
        growthRevenue: 0,
        growthPayload: 0,
        growthUser: 0,
      });
      setEvent((prev) => ({ ...prev, site_serving: "" }));

      // 🔹 Hapus file dari storage
      await supabase.storage.from("event-excels").remove([oldPath]);

      // 🔹 Hapus referensi di database
      await supabase
        .from("calender_events")
        .update({
          excel_url: null,
          excel_file_path: null,
          site_serving: "",
        })
        .eq("id", id);

      alert("✅ File Excel berhasil dihapus dan data direset!");
    } catch (err) {
      console.error(err);
      alert("❌ Gagal hapus file Excel!");
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
      excelData.length > 1 && excelData[0][revKey] !== 0
        ? ((excelData.at(-1)[revKey] - excelData[0][revKey]) /
            excelData[0][revKey]) *
          100
        : 0;

    const growthPayload =
      excelData.length > 1 && excelData[0][payloadKey] !== 0
        ? ((excelData.at(-1)[payloadKey] - excelData[0][payloadKey]) /
            excelData[0][payloadKey]) *
          100
        : 0;

    const growthUser =
      excelData.length > 1 && excelData[0][userKey] !== 0
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

  const [highlightZones, setHighlightZones] = useState([]);
  const [parsedData, setParsedData] = useState([]);

  useEffect(() => {
    if (
      !event ||
      !event.start_date ||
      !event.end_date ||
      excelData.length === 0
    )
      return;

    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    // 🔹 Deteksi metrik yang sedang aktif (chartType tidak pengaruh, semua baca sama)
    const metricMap = {
      payload: headers.find((h) => h.toLowerCase().includes("payload")),
      rev: headers.find((h) => h.toLowerCase().includes("rev")),
      user: headers.find(
        (h) =>
          h.toLowerCase().includes("user") || h.toLowerCase().includes("usr")
      ),
    };

    // fallback kalau belum ketemu
    const metricKey = metricMap.rev || metricMap.payload || metricMap.user;
    if (!metricKey) {
      console.warn("⚠️ Tidak menemukan kolom metrik di Excel");
      return;
    }

    // 🔸 Parse data dari Excel
    // 🔹 Buat parsed data per metrik
    const makeParsedData = (metricKey) => {
      return excelData
        .map((row) => {
          const raw = row[headers[0]];
          let dateVal = null;

          if (raw instanceof Date) {
            dateVal = raw;
          } else if (typeof raw === "number") {
            const parsed = XLSX.SSF.parse_date_code(raw);
            if (parsed) dateVal = new Date(parsed.y, parsed.m - 1, parsed.d);
          } else if (typeof raw === "string") {
            // Tangani format 17/09/2025 atau 2025-09-17
            const parts = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (parts) {
              const [_, d, m, y] = parts;
              const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
              dateVal = new Date(year, parseInt(m) - 1, parseInt(d));
            } else {
              // fallback ke format "17 Sep"
              const clean = raw
                .trim()
                .replace(/\./g, "")
                .replace(/[-_/]/g, " ");
              const seg = clean.split(" ");
              const monthMap = {
                jan: 0,
                feb: 1,
                mar: 2,
                apr: 3,
                mei: 4,
                may: 4,
                jun: 5,
                jul: 6,
                agu: 7,
                ags: 7,
                aug: 7,
                sep: 8,
                okt: 9,
                oct: 9,
                nov: 10,
                des: 11,
                dec: 11,
              };
              if (seg.length >= 2) {
                const day = parseInt(seg[0]);
                const month = monthMap[seg[1].slice(0, 3).toLowerCase()];
                const year = new Date(
                  event?.start_date || Date.now()
                ).getFullYear();
                if (!isNaN(day) && month !== undefined)
                  dateVal = new Date(year, month, day);
              }
            }
          }

          if (!dateVal || isNaN(dateVal)) return null;

          const monthShort = dateVal
            .toLocaleString("id-ID", { month: "short" })
            .replace(".", "");

          const siteKey = headers.find((h) => h.toLowerCase().includes("site"));
          const siteName = row[siteKey] ? String(row[siteKey]).trim() : "";

          const label = siteName
            ? `${dateVal.getDate()} ${monthShort} - ${siteName}`
            : `${dateVal.getDate()} ${monthShort}`;

          const value = parseFloat(row[metricKey]) || 0;

          return { date: dateVal, label, value, site: siteName };
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);
    };

    // 🔸 Generate untuk tiap metrik
    const revKey = headers.find((h) => h.toLowerCase().includes("rev"));
    const payloadKey = headers.find((h) => h.toLowerCase().includes("payload"));
    const userKey = headers.find(
      (h) => h.toLowerCase().includes("user") || h.toLowerCase().includes("usr")
    );
    const parsed = makeParsedData(metricKey);
    setParsedData({
      rev: makeParsedData(revKey),
      payload: makeParsedData(payloadKey),
      user: makeParsedData(userKey),
    });

    // 🔸 Cari semua label yang cocok dengan tanggal (bukan hanya satu)
    const findAllLabelsByDate = (targetDate) => {
      const targetDay = targetDate.getDate();
      const targetMonth = targetDate.getMonth();
      return parsed
        .filter(
          (d) =>
            d.date.getDate() === targetDay && d.date.getMonth() === targetMonth
        )
        .map((d) => d.label);
    };

    // 🟩 Event Zone (bisa multi label kalau di hari sama ada beberapa site)
    const eventLabels = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      eventLabels.push(...findAllLabelsByDate(new Date(d)));
    }

    // Ambil label paling awal dan paling akhir dari semua hari event
    const eventZone = {
      x1: eventLabels[0],
      x2: eventLabels[eventLabels.length - 1],
      type: "event",
    };

    // 🟦 Lowest Same-Day Zone
    // 🟦 Cari Lowest Same-Day Zone (multi-site fix)
    let lowestSameDayZone = null;
    let bestStartIndex = null;

    // Durasi event (dalam hari)
    const eventDuration = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Hari-hari event dalam seminggu
    const eventDays = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      eventDays.push(d.getDay());
    }

    // Site unik di data
    const uniqueSites = [...new Set(parsed.map((x) => x.site))];
    const sitesPerDay = uniqueSites.length;

    if (parsed.length > 0) {
      const pastData = parsed.filter((d) => d.date < start);

      if (pastData.length >= eventDuration * sitesPerDay) {
        let lowestAvg = Infinity;

        // iterasi window
        for (
          let i = 0;
          i <= pastData.length - eventDuration * sitesPerDay;
          i += sitesPerDay
        ) {
          const window = pastData.slice(i, i + eventDuration * sitesPerDay);
          const windowDays = [...new Set(window.map((d) => d.date.getDay()))];

          // Pastikan window mengandung semua hari event (misal Kamis–Senin)
          const allMatch = eventDays.every((d) => windowDays.includes(d));
          if (!allMatch) continue;

          const avg = window.reduce((s, d) => s + d.value, 0) / window.length;
          if (avg < lowestAvg) {
            lowestAvg = avg;
            bestStartIndex = i;
          }
        }

        if (bestStartIndex !== null) {
          const bestWindow = pastData.slice(
            bestStartIndex,
            bestStartIndex + eventDuration * sitesPerDay
          );

          const lowestDates = [
            ...new Set(bestWindow.map((d) => d.date.toDateString())),
          ];

          // Ambil semua label dari tanggal tersebut (semua site)
          const expandedLabels = parsed
            .filter((x) => lowestDates.includes(x.date.toDateString()))
            .map((x) => x.label);

          lowestSameDayZone = {
            x1: expandedLabels[0],
            x2: expandedLabels[expandedLabels.length - 1],
            type: "lowestSameDay",
            labels: expandedLabels,
          };

          console.log(
            "🟦 Lowest Same-Day Zone (multi-site FIXED):",
            expandedLabels.length,
            "bar, tanggal:",
            lowestDates.join(", ")
          );
        }
      }
    }

    const zones = [];
    if (eventZone) zones.push(eventZone);
    if (lowestSameDayZone) zones.push(lowestSameDayZone);
    if (bestStartIndex !== null && eventDuration > 0) {
      const bestWindow = parsed
        .filter((d) => d.date < start)
        .slice(bestStartIndex, bestStartIndex + eventDuration);

      const lowestDates = [
        ...new Set(bestWindow.map((d) => d.date.toDateString())),
      ];

      const expandedLabels = parsed
        .filter((x) => lowestDates.includes(x.date.toDateString()))
        .map((x) => x.label);

      lowestSameDayZone = {
        ...lowestSameDayZone,
        labels: expandedLabels,
      };

      console.log(
        "🟦 Lowest Same-Day Zone (multi-site FIXED):",
        expandedLabels.length,
        "bar, tanggal:",
        lowestDates.join(", ")
      );
    }

    setHighlightZones(zones);
    // 🧾 Debug visual untuk memastikan blok highlight benar
    const debugTable = parsed.map((d) => {
      const isEvent = d.date >= start && d.date <= end ? "✅" : "";
      const isLowest = lowestSameDayZone?.labels?.includes(d.label) ? "🟦" : "";
      return {
        Tanggal: d.label,
        Site: d.site || "-",
        "Event Zone": isEvent,
        "Lowest Zone": isLowest,
        Value: d.value,
      };
    });

    console.log("📋 DEBUG Highlight Table (cek site & hari terblok):");
    console.table(debugTable);
  }, [event, excelData, headers]);

  useEffect(() => {
    if (!highlightZones.length || !parsedData.rev) return;

    // Fungsi bantu ambil total nilai dari label range
    const getTotalInZone = (data, zone) => {
      if (!data.length || !zone) return 0;
      const startIndex = data.findIndex((d) => d.label === zone.x1);
      const endIndex = data.findIndex((d) => d.label === zone.x2);
      if (startIndex === -1 || endIndex === -1) return 0;

      const slice = data.slice(
        Math.min(startIndex, endIndex),
        Math.max(startIndex, endIndex) + 1
      );
      return slice.reduce((sum, d) => sum + (d.value || 0), 0);
    };

    // Ambil data per metrik
    const revData = parsedData.rev || [];
    const payloadData = parsedData.payload || [];
    const userData = parsedData.user || [];

    // Ambil masing-masing zona
    const eventZone = highlightZones.find((z) => z.type === "event");
    const lowestZone = highlightZones.find((z) => z.type === "lowestSameDay");

    if (!eventZone || !lowestZone) return;

    // Hitung total untuk setiap metrik
    const totalRevEvent = getTotalInZone(revData, eventZone);
    const totalRevLowest = getTotalInZone(revData, lowestZone);

    const totalPayloadEvent = getTotalInZone(payloadData, eventZone);
    const totalPayloadLowest = getTotalInZone(payloadData, lowestZone);

    const totalUserEvent = getTotalInZone(userData, eventZone);
    const totalUserLowest = getTotalInZone(userData, lowestZone);

    // Hindari pembagian 0
    const safeDiv = (num, den) => (den === 0 ? 0 : (num / den) * 100);

    // Simpan hasil ke summary
    setSummary({
      revenue: totalRevEvent - totalRevLowest,
      payload: totalPayloadEvent - totalPayloadLowest,
      maxUser: totalUserEvent - totalUserLowest,
      growthRevenue: Math.min(
        safeDiv(totalRevEvent - totalRevLowest, totalRevLowest),
        999.99
      ),
      growthPayload: Math.min(
        safeDiv(totalPayloadEvent - totalPayloadLowest, totalPayloadLowest),
        999.99
      ),
      growthUser: Math.min(
        safeDiv(totalUserEvent - totalUserLowest, totalUserLowest),
        999.99
      ),
    });

    console.log("🧮 SUMMARY PRODUCTIVITY CALCULATED:");
    console.table({
      totalRevEvent,
      totalRevLowest,
      totalPayloadEvent,
      totalPayloadLowest,
      totalUserEvent,
      totalUserLowest,
    });
  }, [highlightZones, parsedData]);

  // 🔹 Chart data
  const chartSections = [
    {
      title: "PAYLOAD",
      key: "payload",
      growth: `${summary.growthPayload.toFixed(2)}%`,
    },
    {
      title: "REVENUE",
      key: "rev",
      growth: `${summary.growthRevenue.toFixed(2)}%`,
    },
    {
      title: "USER",
      key: "user",
      growth: `${summary.growthUser.toFixed(2)}%`,
    },
  ];

  {
    /* 🔄 State untuk ubah unit payload */
  }
  const [payloadUnit, setPayloadUnit] = useState("MB");

  {
    /* Fungsi konversi payload */
  }
  const convertPayload = (value, unit) => {
    switch (unit) {
      case "KB":
        return value * 1024;
      case "MB":
        return value;
      case "GB":
        return value / 1024;
      case "TB":
        return value / (1024 * 1024);
      default:
        return value;
    }
  };

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

      {/* Background + Summary */}
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
                Local Event{" "}
                <span className="text-red-600">{event?.name || "-"}</span>
              </p>
              <p>
                <span className="font-semibold">Date: </span>
                {event?.start_date && event?.end_date
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
                <li>{event?.location || "-"}</li>
              </ul>

              <p className="font-semibold mt-2">Site Serving:</p>
              <ul className="list-disc ml-5">
                {siteServing
                  ? siteServing
                      .split(",")
                      .map((s, i) => <li key={`site-${i}`}>{s.trim()}</li>)
                  : "Belum diisi"}
              </ul>

              <p className="font-semibold mt-2">Action:</p>
              <ul className="list-disc ml-5">
                {event?.action
                  ? event.action
                      .split(",")
                      .map((a, i) => <li key={`act-${i}`}>{a.trim()}</li>)
                  : "Belum diisi"}
              </ul>
            </div>
          ) : (
            <div>
              <label className="block font-semibold mb-1">Action</label>
              <div className="space-y-2">
                {actions.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={act}
                      onChange={(e) => {
                        const updated = [...actions];
                        updated[idx] = e.target.value;
                        setActions(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const updated = [...actions];
                          updated.splice(idx + 1, 0, "");
                          setActions(updated);
                        }
                      }}
                      className="w-full border rounded-md p-2"
                      placeholder={`Action ${idx + 1}`}
                    />

                    {/* Tombol hapus action */}
                    <button
                      type="button"
                      onClick={() =>
                        setActions(actions.filter((_, i) => i !== idx))
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-sm"
                      title="Hapus Action"
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setActions([...actions, ""])}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  + Tambah Action
                </button>
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

          {/* Bagian UI */}
          <ul className="space-y-2 text-gray-800 font-semibold">
            {/* 🔹 PAYLOAD DULU */}
            <li className="flex items-center justify-between">
              <div>
                Incremental Payload During Event :
                <span className="text-green-600">
                  {" "}
                  {convertPayload(summary.payload, payloadUnit).toLocaleString(
                    "id-ID",
                    { maximumFractionDigits: 2 }
                  )}{" "}
                  {payloadUnit} ({summary.growthPayload.toFixed(2)}%)
                </span>
              </div>

              {/* Dropdown Unit */}
              <select
                value={payloadUnit}
                onChange={(e) => setPayloadUnit(e.target.value)}
                className="ml-3 border border-gray-300 rounded-md px-2 py-1 text-sm bg-white hover:border-gray-400 focus:outline-none"
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </li>

            {/* 🔹 REVENUE */}
            <li>
              Incremental Revenue During Event :
              <span className="text-green-600">
                {" "}
                Rp{" "}
                {summary.revenue.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                ({summary.growthRevenue.toFixed(2)}%)
              </span>
            </li>

            {/* 🔹 USER */}
            <li>
              Incremental Max User During Event :
              <span className="text-green-600">
                {" "}
                {summary.maxUser.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                User ({summary.growthUser.toFixed(2)}%)
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Upload Excel & Chart Section */}
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
              // Tentukan key Excel yang sesuai
              const metricKey =
                chart.key === "rev"
                  ? headers.find((h) => /^rev$/i.test(h.trim()))
                  : chart.key === "payload"
                  ? headers.find((h) => h.toLowerCase().includes("payload"))
                  : headers.find(
                      (h) =>
                        h.toLowerCase().includes("user") ||
                        h.toLowerCase().includes("usr")
                    );

              if (!metricKey) return null;

              // 🔹 Generate data spesifik untuk tiap chart
              const chartData = parsedData[chart.key] || [];

              const colorMap = {
                payload: "#2563eb", // biru
                rev: "#16a34a", // hijau
                user: "#9333ea", // ungu
              };

              return (
                <div key={chart.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-700 text-white px-4 py-1 rounded-md font-bold">
                      {chart.title}
                    </div>
                    <div
                      className={`${
                        parseFloat(chart.growth) >= 0
                          ? "bg-green-500"
                          : "bg-red-500"
                      } text-white px-3 py-1 rounded-lg text-sm font-semibold shadow`}
                    >
                      {chart.growth}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2 text-sm">
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
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          {highlightZones
                            .filter((z) => z && z.x1 && z.x2)
                            .map((z, i) => (
                              <ReferenceArea
                                key={`${chart.key}-zone-${i}`}
                                x1={z.x1}
                                x2={z.x2}
                                fill={
                                  z.type === "lowestSameDay"
                                    ? "#bfdbfe" // biru muda
                                    : "#a7f3d0" // hijau muda
                                }
                                stroke={
                                  z.type === "lowestSameDay"
                                    ? "#3b82f6" // biru
                                    : "#059669" // hijau
                                }
                                strokeOpacity={0.7}
                                fillOpacity={0.4}
                              />
                            ))}
                          <Bar
                            dataKey="value"
                            fill={colorMap[chart.key]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          {highlightZones
                            .filter((z) => z && z.x1 && z.x2)
                            .map((z, i) => (
                              <ReferenceArea
                                key={`${chart.key}-zone-${i}`}
                                x1={z.x1}
                                x2={z.x2}
                                fill={
                                  z.type === "lowestSameDay"
                                    ? "#bfdbfe" // biru muda
                                    : "#a7f3d0" // hijau muda
                                }
                                stroke={
                                  z.type === "lowestSameDay"
                                    ? "#3b82f6" // biru
                                    : "#059669" // hijau
                                }
                                strokeOpacity={0.7}
                                fillOpacity={0.4}
                              />
                            ))}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={colorMap[chart.key]}
                            strokeWidth={2}
                            dot={false}
                          />
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
