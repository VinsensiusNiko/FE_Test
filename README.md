# Jasamarga Next.js Frontend Test

## Cara Install & Jalankan
1. Extract file zip ini
2. Masuk folder project:
   ```bash
   cd jasamarga-nextjs
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
   atau jika pakai yarn:
   ```bash
   yarn install
   ```
4. Copy `.env.local.example` menjadi `.env.local` dan sesuaikan API URL jika perlu
   ```bash
   cp .env.local.example .env.local
   ```
5. Jalankan development server:
   ```bash
   npm run dev
   ```
   Aplikasi jalan di http://localhost:3000

## Catatan
- Login memanggil endpoint `/auth/login` pada API di `http://localhost:8080`
- Dashboard memanggil `/traffic/summary` dan butuh response JSON dengan struktur:
  ```json
  {
    "byPayment": {"labels": ["BCA","BRI"], "values": [10,20]},
    "byGate": {"labels": ["Gate A"], "values": [5]},
    "byShift": {"labels": ["Shift 1","Shift 2","Shift 3"], "values": [30,40,50]},
    "byBranch": {"labels": ["Ruas A"], "values": [60]}
  }
  ```
