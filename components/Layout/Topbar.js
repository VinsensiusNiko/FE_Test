import { useState, useRef, useEffect } from "react"
import { FaUserCircle, FaCog } from "react-icons/fa"

export default function Topbar({ collapsed}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // klik di luar → tutup menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleLogout() {
    localStorage.removeItem("jm_token") // hapus token
    window.location.href = "/" // redirect ke login
  }

  return (
    <header className={`h-14 bg-gray-200 flex items-center justify-end px-4 fixed top-0 right-0 left-60 z-10 transition-all duration-300 z-10
      transition-all duration-300 z-10 ${collapsed ? "left-16" : "left-60"}`}
    >
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <FaCog size={20} className="cursor-pointer" />

        {/* User Icon */}
        <FaUserCircle
          size={22}
          className="cursor-pointer"
          onClick={() => setOpen(!open)}
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-10 right-0 bg-white border rounded shadow-md w-32">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
