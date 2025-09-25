import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function PaymentBarChart({ data }) {
  // Pastikan data tidak kosong sebelum merender chart
  if (!data || !data.labels || data.labels.length === 0) {
    return <div className="text-center p-4">Tidak ada data yang tersedia untuk chart ini.</div>;
  }

  // Buat array datasets, di mana setiap objek datasets mewakili satu bar
  const datasets = data.labels.map((label, index) => {
    return {
      label: label,
      data: [data.values[index]], // Menggunakan array dengan satu nilai untuk membuat bar tunggal
      backgroundColor: 'rgba(54, 75, 96, 1)',
      borderColor: 'rgba(54, 75, 96, 1)',
      borderWidth: 1,
    };
  });

  // Konfigurasi opsi untuk chart
  const options = {
    responsive: true,
    scales: {
      x: {
        display: false, // Menyembunyikan label sumbu X utama
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Jumlah Lalin',
        },
        grid: {
          display: true,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Sembunyikan legend
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].dataset.label;
          },
        },
      },
    },
  };

  // Kirim data ke komponen <Bar>
  return <Bar data={{ labels: [''], datasets: datasets }} options={options} />;
}