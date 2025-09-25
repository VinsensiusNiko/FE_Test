import { useState } from "react";
import Link from "next/link";
import {
  FaChartBar,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"
import { MdDashboard } from "react-icons/md";

export default function Sidebar({ collapsed, setCollapsed }) {
  const [openReport, setOpenReport] = useState(false);

  return (
    <aside
      className={`bg-gray-100 h-screen fixed top-0 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo & Collapse Button */}
      <div className="flex items-center justify-between py-4 px-2 border-b">
        {!collapsed && (
          <img src="/assets/logo-app.png" alt="App Logo" className="w-20" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-200"
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2">
        <ul>
          <li className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded cursor-pointer">
            <Link href="/dashboard" className="flex items-center gap-3 w-full">
              <MdDashboard size={18} />
              {!collapsed && "Dashboard"}
            </Link>
          </li>

          <li
            className="flex items-center justify-between p-2 hover:bg-gray-200 rounded cursor-pointer"
            onClick={() => setOpenReport(!openReport)}
          >
            <span className="flex items-center gap-3">
              <FaChartBar size={16} />
              {!collapsed && "Laporan Lalin"}
            </span>
            {!collapsed &&
              (openReport ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />)}
          </li>
          {openReport && !collapsed && (
            <Link href="/laporan-hari" className="flex items-center gap-3 w-full p-2">
              <MdDashboard size={18} />
              {!collapsed && "Laporan Per Hari"}
            </Link>
          )}

          <li className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded cursor-pointer">
            <Link href="/master-gerbang" className="flex items-center gap-3 w-full">
              <FaBuilding size={16} />
              {!collapsed && "Master Gerbang"}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
};
