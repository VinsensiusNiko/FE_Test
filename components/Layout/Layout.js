import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-60"
        }`}
      >
        {/* Topbar */}
        <Topbar collapsed={collapsed} />

        {/* Main Content */}
        <main className="p-6 mt-14">{children}</main>
      </div>
    </div>
  )
}
