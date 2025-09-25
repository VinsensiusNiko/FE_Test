import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function GateBarChart({ data }){
  return <Bar data={{ labels: data.labels, datasets:[{ label: 'Jumlah', data: data.values }] }} />
}
