// pages/laporan-hari.js
import { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { CiSearch } from "react-icons/ci";
import { FaCalendarAlt, FaDownload } from "react-icons/fa";
import dayjs from "dayjs";

import Layout from "../components/Layout/Layout";
import withAuth from "../lib/withAuth";
import { api } from "../lib/apiClient";
import PrimaryButton from "../components/PrimaryButton";

function safeArrayFromResponse(res) {
  // support multiple possible shapes
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res?.data) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.rows) {
      // could be { rows: [...] } or { rows: { rows: [...] } }
      if (Array.isArray(res.data.rows)) return res.data.rows;
      if (Array.isArray(res.data.rows?.rows)) return res.data.rows.rows;
    }
  }
  // final fallback: if object with keys numeric
  return [];
}

function LaporanLalinPage() {
  const [rawData, setRawData] = useState([]); // raw records from /api/lalins
  const [data, setData] = useState([]); // aggregated & mapped rows for table
  const [gerbangMap, setGerbangMap] = useState({}); // { "IdCabang-IdGerbang": { NamaCabang, NamaGerbang } }
  const [loading, setLoading] = useState(false);

  // filters / UI
  const [tanggal, setTanggal] = useState("2023-11-01");
  const [selectedTab, setSelectedTab] = useState(0);
  const tabLabels = [
    "Total Tunai",
    "Total E-Toll",
    "Total Flo",
    "Total KTP",
    "Total Keseluruhan",
    "Total E-Toll+Tunai+Flo",
  ];

  // search + debounce
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1); // 1-based
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- 1) load master gerbangs once to build mapping
  useEffect(() => {
    let mounted = true;
    async function loadGerbangs() {
      try {
        const res = await api.fetchGerbangs(1, 1000); // grab many so we can map
        const rows = safeArrayFromResponse(res);
        if (!mounted) return;
        const map = {};
        rows.forEach((g) => {
          // g.id (gerbang id), g.IdCabang (cabang id)
          // key by combination
          const key = `${g.IdCabang}-${g.id}`;
          map[key] = {
            NamaCabang: g.NamaCabang ?? `Cabang ${g.IdCabang}`,
            NamaGerbang: g.NamaGerbang ?? `Gerbang ${g.id}`,
          };
          // also optionally map by gerbang-only and cabang-only for fallback
          map[`gerbang-${g.id}`] = { NamaGerbang: g.NamaGerbang ?? `Gerbang ${g.id}` };
          map[`cabang-${g.IdCabang}`] = { NamaCabang: g.NamaCabang ?? `Cabang ${g.IdCabang}` };
        });
        setGerbangMap(map);
      } catch (err) {
        console.error("Error load gerbangs:", err);
      }
    }
    loadGerbangs();
    return () => { mounted = false; };
  }, []);

  // --- 2) load raw lalin data for selected tanggal
  useEffect(() => {
    let mounted = true;
    async function loadLalin() {
      setLoading(true);
      try {
        const res = await api.fetchDataLalin(tanggal);
        const rows = safeArrayFromResponse(res);
        if (!mounted) return;
        setRawData(rows);
      } catch (err) {
        console.error("Error fetch data lalin:", err);
        if (mounted) setRawData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    // only fetch when tanggal exists
    if (tanggal) loadLalin();
    return () => { mounted = false; };
  }, [tanggal]);

  // --- 3) aggregate + map rawData whenever rawData, gerbangMap, or selectedTab changes
  useEffect(() => {
    // build aggregatedData keyed by: IdCabang-IdGerbang-Gardu-Tanggal (so we don't mix gardu)
    const aggregated = {};
    const roman = ["", "I", "II", "III", "IV", "V"];

    rawData.forEach((item) => {
      const cabangId = item?.IdCabang;
      const gerbangId = item?.IdGerbang;
      const garduId = item?.IdGardu ?? 0;
      const dateOnly = (item?.Tanggal || "").split("T")[0] || tanggal;

      const key = `${cabangId}-${gerbangId}-${garduId}-${dateOnly}`;

      // Lookup names from map; fallback if missing
      const mapKey = `${cabangId}-${gerbangId}`;
      const mapping = gerbangMap[mapKey] ?? gerbangMap[`gerbang-${gerbangId}`] ?? gerbangMap[`cabang-${cabangId}`] ?? null;

      if (!aggregated[key]) {
        aggregated[key] = {
          Ruas: mapping?.NamaCabang ?? `Ruas ${cabangId}`,
          Gerbang: mapping?.NamaGerbang ?? `Gerbang ${gerbangId}`,
          Gardu: garduId,
          Hari: new Date(dateOnly).toLocaleDateString("id-ID", { weekday: "long" }),
          Tanggal: dateOnly,
          "Gol I": 0,
          "Gol II": 0,
          "Gol III": 0,
          "Gol IV": 0,
          "Gol V": 0,
          "Total Lalin": 0,
          "Metode Pembayaran": "",
        };
      }

      // determine which counts to add depending on selectedTab
      const g = Number(item?.Golongan) || 0;
      if (g < 1 || g > 5) return; // skip invalid golongan
      const golKey = `Gol ${roman[g]}`;

      let add = 0;
      let metode = "";

      switch (selectedTab) {
        case 0: // Tunai
          add = Number(item?.Tunai) || 0;
          metode = "Tunai";
          break;
        case 1: // E-Toll (group many e- fields)
          add =
            (Number(item?.eMandiri) || 0) +
            (Number(item?.eBri) || 0) +
            (Number(item?.eBni) || 0) +
            (Number(item?.eBca) || 0) +
            (Number(item?.eNobu) || 0) +
            (Number(item?.eDKI) || 0) +
            (Number(item?.eMega) || 0);
          metode = "E-Toll";
          break;
        case 2: // Flo
          add = Number(item?.eFlo) || 0;
          metode = "Flo";
          break;
        case 3: // KTP (no fields provided in sample; keep 0)
          add = 0;
          metode = "KTP";
          break;
        case 4: // Keseluruhan
          add =
            (Number(item?.Tunai) || 0) +
            (Number(item?.eMandiri) || 0) +
            (Number(item?.eBri) || 0) +
            (Number(item?.eBni) || 0) +
            (Number(item?.eBca) || 0) +
            (Number(item?.eNobu) || 0) +
            (Number(item?.eDKI) || 0) +
            (Number(item?.eMega) || 0) +
            (Number(item?.eFlo) || 0);
          metode = "Keseluruhan";
          break;
        case 5: // E-Toll+Tunai+Flo (same as keseluruhan here)
          add =
            (Number(item?.Tunai) || 0) +
            (Number(item?.eMandiri) || 0) +
            (Number(item?.eBri) || 0) +
            (Number(item?.eBni) || 0) +
            (Number(item?.eBca) || 0) +
            (Number(item?.eNobu) || 0) +
            (Number(item?.eDKI) || 0) +
            (Number(item?.eMega) || 0) +
            (Number(item?.eFlo) || 0);
          metode = "E-Toll+Tunai+Flo";
          break;
        default:
          add = 0;
      }

      // accumulate
      if (aggregated[key][golKey] !== undefined) {
        aggregated[key][golKey] += add;
        aggregated[key]["Total Lalin"] += add;
        // if metode already set to something else, we keep the latest non-empty (it's a label per tab)
        aggregated[key]["Metode Pembayaran"] = metode;
      }
    });

    // produce array and set
    const built = Object.values(aggregated);
    setData(built);
    // reset page to 1 when aggregation changes (optional)
    setPage(1);
  }, [rawData, gerbangMap, selectedTab, tanggal]);

  // debounce search input -> search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // filtered + paginated view
  const filteredData = Array.isArray(data)
    ? data.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes((search ?? "").toLowerCase())
        )
      )
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // totals (overall, same logic as earlier)
  const calculateTotals = (arr) => {
    const totals = {
      'Gol I': 0, 'Gol II': 0, 'Gol III': 0, 'Gol IV': 0, 'Gol V': 0, 'Total Lalin': 0
    };
    arr.forEach(r => {
      totals['Gol I'] += Number(r['Gol I'] || 0);
      totals['Gol II'] += Number(r['Gol II'] || 0);
      totals['Gol III'] += Number(r['Gol III'] || 0);
      totals['Gol IV'] += Number(r['Gol IV'] || 0);
      totals['Gol V'] += Number(r['Gol V'] || 0);
      totals['Total Lalin'] += Number(r['Total Lalin'] || 0);
    });
    return totals;
  };

  const totals = calculateTotals(filteredData);
  
  // ===========================================
  // === FUNGSI BARU UNTUK EKSPOR KE CSV
  // ===========================================
  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    // Tentukan headers (sesuai urutan kolom di tabel)
    const headers = [
      "No.",
      "Ruas",
      "Gerbang",
      "Gardu",
      "Hari",
      "Tanggal",
      "Metode Pembayaran",
      "Gol I",
      "Gol II",
      "Gol III",
      "Gol IV",
      "Gol V",
      "Total Lalin",
    ];

    // Buat baris header CSV
    let csv = headers.join(";") + "\n";

    // Tambahkan baris data
    filteredData.forEach((row, index) => {
      const csvRow = [
        index + 1, // Nomor urut
        row.Ruas,
        row.Gerbang,
        row.Gardu,
        row.Hari,
        row.Tanggal,
        row["Metode Pembayaran"],
        row["Gol I"],
        row["Gol II"],
        row["Gol III"],
        row["Gol IV"],
        row["Gol V"],
        row["Total Lalin"],
      ].map(value => {
        // Enclose values in quotes if they contain semicolons or quotes
        // This is a simple approach, more robust logic may be needed for complex data
        let stringValue = String(value);
        if (stringValue.includes(';') || stringValue.includes('"')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(";");
      csv += csvRow + "\n";
    });

    // Buat baris total
    const totalRow = [
      "", "", "", "", "", "", "TOTAL",
      totals['Gol I'],
      totals['Gol II'],
      totals['Gol III'],
      totals['Gol IV'],
      totals['Gol V'],
      totals['Total Lalin'],
    ].join(";");
    csv += totalRow + "\n";
    
    // Buat Blob dari string CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Buat URL dan link untuk unduhan
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-lalin-${tanggal}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <Typography variant="h5" gutterBottom style={{ marginBottom: 20 }}>
        Laporan Lalin Per Hari
      </Typography>

      <Box className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <TextField
            size="small"
            placeholder="Cari nama ruas / gerbang"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CiSearch size={18} className="text-gray-500" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Tanggal"
            InputLabelProps={{ shrink: true }}
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <FaCalendarAlt size={18} className="text-gray-500" />
                </InputAdornment>
              ),
            }}
          />
          <PrimaryButton onClick={() => { /* manual refresh */ setTanggal(tanggal); }}>
            Filter
          </PrimaryButton>
          <PrimaryButton onClick={() => { setSearchInput(''); setSearch(''); }}>
            Reset
          </PrimaryButton>
        </div>
        
        {/* Panggil fungsi handleExportCsv saat tombol diklik */}
        <PrimaryButton startIcon={<FaDownload />} onClick={handleExportCsv}>
          Export
        </PrimaryButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          {tabLabels.map((label, i) => <Tab key={i} label={label} />)}
        </Tabs>
      </Box>

      <Paper elevation={0}>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">No.</th>
              <th className="px-4 py-2 border-b">Ruas</th>
              <th className="px-4 py-2 border-b">Gerbang</th>
              <th className="px-4 py-2 border-b">Gardu</th>
              <th className="px-4 py-2 border-b">Hari</th>
              <th className="px-4 py-2 border-b">Tanggal</th>
              <th className="px-4 py-2 border-b">Metode Pembayaran</th>
              <th className="px-4 py-2 border-b">Gol I</th>
              <th className="px-4 py-2 border-b">Gol II</th>
              <th className="px-4 py-2 border-b">Gol III</th>
              <th className="px-4 py-2 border-b">Gol IV</th>
              <th className="px-4 py-2 border-b">Gol V</th>
              <th className="px-4 py-2 border-b">Total Lalin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center px-4 py-2 border-b">Loading...</td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{(page - 1) * rowsPerPage + idx + 1}</td>
                  <td className="px-4 py-2">{row.Ruas}</td>
                  <td className="px-4 py-2">{row.Gerbang}</td>
                  <td className="px-4 py-2">{row.Gardu}</td>
                  <td className="px-4 py-2">{row.Hari}</td>
                  <td className="px-4 py-2">{row.Tanggal}</td>
                  <td className="px-4 py-2">{row["Metode Pembayaran"]}</td>
                  <td className="px-4 py-2">{row["Gol I"]}</td>
                  <td className="px-4 py-2">{row["Gol II"]}</td>
                  <td className="px-4 py-2">{row["Gol III"]}</td>
                  <td className="px-4 py-2">{row["Gol IV"]}</td>
                  <td className="px-4 py-2">{row["Gol V"]}</td>
                  <td className="px-4 py-2">{row["Total Lalin"]}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="text-center px-4 py-2 border-b">Tidak ada data</td>
              </tr>
            )}
          </tbody>

          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={7} className="text-right font-bold px-4 py-2 border-b">Total</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Gol I']}</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Gol II']}</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Gol III']}</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Gol IV']}</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Gol V']}</td>
              <td className="px-4 py-2 border-b font-semibold">{totals['Total Lalin']}</td>
            </tr>
          </tfoot>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-end mt-4 gap-x-4">
          <div>
            <label className="mr-2 text-sm">Show:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2 text-sm">entries</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .map((p, idx, arr) => (
                <div key={p} className="flex">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 py-1">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${p === page ? "bg-gray-200 font-semibold" : ""}`}
                  >
                    {p}
                  </button>
                </div>
              ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </Paper>
    </Layout>
  );
}

export default withAuth(LaporanLalinPage);