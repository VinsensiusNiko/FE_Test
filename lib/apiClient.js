const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  login: (payload) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  fetchTrafficSummary: (params) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/traffic/summary?${qs}`)
  },
  fetchDataLalin: (tanggal) =>
    request(`/api/lalins?tanggal=${tanggal}&limit=500`, { method: "GET" }),
  fetchGerbangs: (page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams({ page, limit })
    if (search) {
      params.append("NamaGerbang", search)
      // params.append("NamaCabang", search)
    }
    return request(`/api/gerbangs?${params.toString()}`)
  },
  createGerbang: (payload) =>
    request("/api/gerbangs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteGerbang: (payload) =>
    request("/api/gerbangs", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
  updateGerbang: (payload) =>
    request("/api/gerbangs", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
}
