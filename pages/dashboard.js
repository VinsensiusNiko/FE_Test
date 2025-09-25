import { useState, useEffect } from "react";
import {
  TextField,
  Card,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import PaymentBarChart from "../components/Charts/PaymentBarChart";
import GateBarChart from "../components/Charts/GateBarChart";
import ShiftDoughnut from "../components/Charts/ShiftDoughnut";
import BranchDoughnut from "../components/Charts/BranchDoughnut";
import dayjs from "dayjs";
import Layout from "../components/Layout/Layout";
import withAuth from "../lib/withAuth";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../lib/apiClient";

// Helper function to handle various API response formats
function safeArrayFromResponse(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res?.data) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.rows) {
      if (Array.isArray(res.data.rows)) return res.data.rows;
      if (Array.isArray(res.data.rows?.rows)) return res.data.rows.rows;
    }
  }
  return [];
}

function DashboardPage() {
  const [tanggal, setTanggal] = useState("2023-11-01");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({ labels: [], values: [] });
  const [gateData, setGateData] = useState({ labels: [], values: [] });
  const [shiftData, setShiftData] = useState({ labels: [], values: [] });
  const [branchData, setBranchData] = useState({ labels: [], values: [] });

  const fetchData = async (date) => {
    setLoading(true);
    try {
      const res = await api.fetchDataLalin(date);
      const rawData = safeArrayFromResponse(res);

      if (rawData.length === 0) {
        setPaymentData({ labels: [], values: [] });
        setGateData({ labels: [], values: [] });
        setShiftData({ labels: [], values: [] });
        setBranchData({ labels: [], values: [] });
        return;
      }

      // Aggregate data for each chart
      const payments = {};
      const gates = {};
      const shifts = {};
      const branches = {};

      rawData.forEach((item) => {
        const tunai = Number(item?.Tunai) || 0;
        const flo = Number(item?.eFlo) || 0;
        
        // ✅ Perbaikan: Pisahkan setiap jenis pembayaran e-Toll
        const eMandiri = Number(item?.eMandiri) || 0;
        const eBri = Number(item?.eBri) || 0;
        const eBni = Number(item?.eBni) || 0;
        const eBca = Number(item?.eBca) || 0;
        const eNobu = Number(item?.eNobu) || 0;
        const eDKI = Number(item?.eDKI) || 0;
        const eMega = Number(item?.eMega) || 0;
        
        const total = tunai + eMandiri + eBri + eBni + eBca + eNobu + eDKI + eMega + flo;

        // ✅ Perbaikan: Kumpulkan data untuk setiap jenis pembayaran
        payments["Tunai"] = (payments["Tunai"] || 0) + tunai;
        payments["BCA"] = (payments["BCA"] || 0) + eBca;
        payments["BRI"] = (payments["BRI"] || 0) + eBri;
        payments["BNI"] = (payments["BNI"] || 0) + eBni;
        payments["DKI"] = (payments["DKI"] || 0) + eDKI;
        payments["Mandiri"] = (payments["Mandiri"] || 0) + eMandiri;
        payments["Mega"] = (payments["Mega"] || 0) + eMega;
        payments["Flo"] = (payments["Flo"] || 0) + flo;


        // Gate Data
        const gateKey = `Gerbang ${item?.IdGerbang}`;
        gates[gateKey] = (gates[gateKey] || 0) + total;
        
        // Shift Data (assuming 'Shift' key exists in API response)
        const shiftKey = `Shift ${item?.Shift ?? 'N/A'}`; // Assuming API returns a 'Shift' field
        shifts[shiftKey] = (shifts[shiftKey] || 0) + total;

        // Branch Data
        const branchKey = `Ruas ${item?.IdCabang}`;
        branches[branchKey] = (branches[branchKey] || 0) + total;
      });

      // Set state with processed data
      setPaymentData({
        labels: Object.keys(payments),
        values: Object.values(payments),
      });
      setGateData({
        labels: Object.keys(gates),
        values: Object.values(gates),
      });
      setShiftData({
        labels: Object.keys(shifts),
        values: Object.values(shifts),
      });
      setBranchData({
        labels: Object.keys(branches),
        values: Object.values(branches),
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Clear data on error
      setPaymentData({ labels: [], values: [] });
      setGateData({ labels: [], values: [] });
      setShiftData({ labels: [], values: [] });
      setBranchData({ labels: [], values: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch on component mount
    fetchData(tanggal);
  }, []); // Run only once

  const handleFilter = () => {
    fetchData(tanggal);
  };

  return (
    <Layout>
      <div>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>

        {/* Filter Section - Using Grid for layout */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Tanggal"
                  value={dayjs(tanggal)}
                  onChange={(d) => setTanggal(dayjs(d).format("YYYY-MM-DD"))}
                />
              </LocalizationProvider>
            </div>
            <div className="w-full md:w-1/2">
              <PrimaryButton onClick={handleFilter}>
                Filter
              </PrimaryButton>
            </div>
          </div>
        </Card>

        {/* Charts Section - Using Flexbox for layout */}
        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        ) : (
          <div className="flex flex-wrap -mx-3">
            {/* First Row of Charts */}
            <div className="w-full md:w-1/2 px-3 mb-6">
              <Card className="p-4">
                <Typography variant="h6" className="text-center">Traffic by Payment</Typography>
                <PaymentBarChart data={paymentData} />
              </Card>
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6">
              <Card className="p-4">
                <Typography variant="h6" className="text-center">Traffic by Shift</Typography>
                <ShiftDoughnut data={shiftData} />
              </Card>
            </div>

            {/* Second Row of Charts */}
            <div className="w-full md:w-1/2 px-3 mb-6">
              <Card className="p-4">
                <Typography variant="h6" className="text-center">Traffic by Gate</Typography>
                <GateBarChart data={gateData} />
              </Card>
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6">
              <Card className="p-4">
                <Typography variant="h6" className="text-center">Traffic by Branch</Typography>
                <BranchDoughnut data={branchData} />
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ✅ wrap export dengan withAuth
export default withAuth(DashboardPage);