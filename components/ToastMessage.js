/* eslint-disable no-unused-vars */
export default function Toast({ toast, setToast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 left-4 z-50 px-4 py-2 rounded shadow-lg text-sm transition-all duration-300 ${
        toast.type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
