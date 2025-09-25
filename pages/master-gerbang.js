import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { IoEyeSharp } from "react-icons/io5";
import { BiSolidPencil } from "react-icons/bi";
import { HiTrash } from "react-icons/hi2";
import { CiSearch } from "react-icons/ci";

import { useFormik } from 'formik';

import Layout from "../components/Layout/Layout";
import withAuth from "../lib/withAuth";
import { api } from "../lib/apiClient";
import PrimaryButton from "../components/PrimaryButton";
import ToastMessage from "../components/ToastMessage";

function MasterGerbangPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [viewMode, setViewMode] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [toast, setToast] = useState(null);
  
  // === State untuk sorting ===
  const [sortColumn, setSortColumn] = useState('IdCabang');
  const [sortOrder, setSortOrder] = useState('asc');
  // ============================

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // === Mengambil data tanpa parameter sorting dari API ===
  async function loadGerbangs() {
    try {
      setLoading(true);
      const res = await api.fetchGerbangs(page, rowsPerPage, search);
      const fetchedRows = res.data.rows.rows || [];
      const total = res.data.count || 0;

      // === Mengurutkan data setelah diterima dari API ===
      const sortedRows = [...fetchedRows].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Penanganan untuk nilai numerik
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Penanganan untuk nilai string
        const result = String(aValue).localeCompare(String(bValue));
        return sortOrder === 'asc' ? result : -result;
      });
      // ======================================
      
      setRows(sortedRows);
      setTotalCount(total);
    } catch (err) {
      console.error("Error fetch gerbangs:", err);
    } finally {
      setLoading(false);
    }
  }

  // === Dependency array sekarang hanya bergantung pada page, rowsPerPage, search, sortColumn, dan sortOrder ===
  useEffect(() => {
    loadGerbangs();
  }, [page, rowsPerPage, search, sortColumn, sortOrder]);
  // =========================================================================================================

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput, setSearch, setPage]);

  // === Fungsi handler untuk sorting, tanpa memanggil API baru ===
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };
  // =============================================================

  async function handleCreate(values) {
    try {
      setLoading(true);
      const createRes = await api.createGerbang(values);
      setOpenModal(false);
      formik.resetForm();
      await loadGerbangs();
      setToast({
        type: "success",
        text: createRes.message,
      });
    } catch (err) {
      const match = err.message.match(/{.*}/);
      let errorMsg = "Terjadi kesalahan";
      if (match) {
        const parsed = JSON.parse(match[0]);
        errorMsg = parsed.message;
      }
      setToast({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Yakin ingin menghapus gerbang "${row.NamaGerbang}"?`)) return;

    try {
      setLoading(true);
      const deleteRes = await api.deleteGerbang({
        id: row.id,
        IdCabang: row.IdCabang,
      });
      await loadGerbangs();
      setToast({
        type: "success",
        text: deleteRes.message,
      });
    } catch (err) {
      const match = err.message.match(/{.*}/);
      let errorMsg = "Terjadi kesalahan";
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          errorMsg = parsed.message || errorMsg;
        } catch {}
      }
      setToast({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(values) {
    try {
      setLoading(true);
      const updateRes = await api.updateGerbang(values);
      setOpenModal(false);
      setEditMode(false);
      formik.resetForm();
      await loadGerbangs();
      setToast({
        type: "success",
        text: updateRes.message || "Data Gerbang berhasil diperbarui",
      });
    } catch (err) {
      const match = err.message.match(/{.*}/);
      let errorMsg = "Terjadi kesalahan";
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          errorMsg = parsed.message || errorMsg;
        } catch {}
      }
      setToast({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleView = (row) => {
    setViewMode(true);
    setViewRow(row);
    setOpenModal(true); // Gunakan modal yang sama
  };

  const [openModal, setOpenModal] = useState(false);
  const formik = useFormik({
    initialValues: {
      id: '',
      IdCabang: '',
      NamaGerbang: '',
      NamaCabang: '',
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      if (editMode) {
        handleUpdate(values);
      } else {
        handleCreate(values);
      }
    },
  });

  return (
    <Layout>
      <Typography variant="h5" gutterBottom style={{ marginBottom: 35 }}>
        Master Data Gerbang
      </Typography>

      <div className="flex justify-between items-center mb-4">
        <TextField
          size="small"
          placeholder="Cari Nama Gerbang"
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
        <PrimaryButton
          sx= {{ backgroundColor: '#939CC7' }}
          onClick={() => setOpenModal(true)}
        >
          Tambah
        </PrimaryButton>
      </div>

      <ToastMessage toast={toast} setToast={setToast} />
      <Paper elevation={0}>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('id')}>
                ID
                {sortColumn === 'id' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('IdCabang')}>
                ID Cabang
                {sortColumn === 'IdCabang' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('NamaCabang')}>
                Nama Cabang
                {sortColumn === 'NamaCabang' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-2 border-b cursor-pointer" onClick={() => handleSort('NamaGerbang')}>
                Nama Gerbang
                {sortColumn === 'NamaGerbang' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center px-4 py-2 border-b">
                  Loading...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={`${row.IdCabang}-${row.id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-2">{row.id}</td>
                  <td className="px-4 py-2">{row.IdCabang}</td>
                  <td className="px-4 py-2">{row.NamaCabang}</td>
                  <td className="px-4 py-2">{row.NamaGerbang}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-x-3">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setEditRow(row);
                          formik.setValues(row);
                          setOpenModal(true);
                        }}
                      >
                        <BiSolidPencil />
                      </button>
                      <button onClick={() => handleView(row)}>
                        <IoEyeSharp />
                      </button>
                      <button onClick={() => handleDelete(row)}>
                        <HiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center px-4 py-2 border-b">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-end mt-4 gap-x-4">
          <div>
            <label className="mr-2 text-sm">Show:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={2}>2</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <span className="ml-2 text-sm">entries</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .map((p, idx, arr) => (
                <div key={p} className="flex">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 py-1">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${
                      p === page ? "bg-gray-200 font-semibold" : ""
                    }`}
                  >
                    {p}
                  </button>
                </div>
              ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>

        <Dialog
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditMode(false);
            setViewMode(false); // Reset viewMode saat menutup
            formik.resetForm();
          }}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>
            {editMode ? "Edit Gerbang" : viewMode ? "Lihat Detail Gerbang" : "Tambah Gerbang"}
          </DialogTitle>
          <DialogContent className="space-y-4">
            <TextField
              placeholder="ID"
              fullWidth
              name="id"
              value={viewMode ? viewRow?.id : formik.values.id}
              onChange={formik.handleChange}
              disabled={viewMode} // Disable jika dalam mode lihat
            />
            <TextField
              placeholder="ID Cabang"
              fullWidth
              name="IdCabang"
              value={viewMode ? viewRow?.IdCabang : formik.values.IdCabang}
              onChange={formik.handleChange}
              disabled={viewMode}
            />
            <TextField
              placeholder="Nama Cabang"
              fullWidth
              name="NamaCabang"
              value={viewMode ? viewRow?.NamaCabang : formik.values.NamaCabang}
              onChange={formik.handleChange}
              disabled={viewMode}
            />
            <TextField
              placeholder="Nama Gerbang"
              fullWidth
              name="NamaGerbang"
              value={viewMode ? viewRow?.NamaGerbang : formik.values.NamaGerbang}
              onChange={formik.handleChange}
              disabled={viewMode}
            />
          </DialogContent>
          <DialogActions>
            <PrimaryButton
              sx={{ backgroundColor: '#939CC7' }}
              onClick={() => {
                setOpenModal(false);
                setEditMode(false);
                setViewMode(false); // Reset viewMode saat menutup
                formik.resetForm();
              }}
            >
              {viewMode ? "Tutup" : "Batal"}
            </PrimaryButton>
            {!viewMode && (
              <PrimaryButton
                loading={loading}
                onClick={formik.handleSubmit}
              >
                {editMode ? "Update" : "Simpan"}
              </PrimaryButton>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Layout>
  )
};

export default withAuth(MasterGerbangPage);