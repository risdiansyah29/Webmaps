# Supabase Backend

Backend aplikasi ini menggunakan Supabase (Auth + Postgres).

## Environment Variables

Set di `.env` / hosting env:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Database Schema

Jalankan migration SQL di `supabase/migrations/001_init.sql` melalui Supabase SQL Editor.

Tabel yang dipakai frontend:

- `locations`
- `reviews`
- `favorites`

Semua tabel sudah mengaktifkan RLS dan policy minimal agar aplikasi bisa:

- public read untuk `locations` dan `reviews`
- write hanya untuk user yang login (`favorites`, `reviews`)
