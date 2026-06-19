<!--
Tujuan: Menyediakan dashboard admin cabang yang interaktif dengan visualisasi statistik cabang (murid aktif & avg score) dan akses ekspor laporan.
Caller: Route `/admin/dashboard`.
Dependensi: Svelte 5 Runes, stats dari load function.
Main Functions: Menampilkan grid dashboard, visualisasi glassmorphism statistik, dan tombol unduh CSV.
-->

<script lang="ts">
  let { data } = $props()

  const stats = $derived(data.stats)
  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="text-3xl font-extrabold uppercase tracking-tight text-black">Dashboard Admin Cabang</h1>
      <p class="mt-2 text-sm font-semibold text-black">
        Selamat datang kembali, <span class="font-extrabold text-neo-blue">{data.user.name}</span>. Berikut adalah rangkuman performa cabang Anda hari ini.
      </p>
    </div>

    <div>
      <a
        id="btn-export-csv"
        href={`${apiBaseUrl}/admin/reports/export`}
        target="_blank"
        class="inline-flex items-center gap-2 rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Ekspor Laporan (CSV)
      </a>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-6 md:grid-cols-2">
    <!-- Avg Score Card -->
    <div class="relative overflow-hidden rounded-xl border-4 border-black bg-white p-8 shadow-solid-md transition-transform hover:-translate-y-1 hover:shadow-solid-lg">
      <div class="flex items-center justify-between">
        <p class="text-xs font-extrabold uppercase tracking-widest text-neo-blue">Rata-rata Nilai Try Out</p>
        <span class="rounded-md border-2 border-black bg-neo-green px-3 py-1 text-xs font-bold text-black">Cabang</span>
      </div>
      <div class="mt-6 flex items-baseline gap-2">
        <span class="text-5xl font-black tracking-tight text-black">{stats.avgScore ?? 0}</span>
        <span class="text-sm font-bold text-black">/ 100</span>
      </div>
      <p class="mt-4 text-xs font-semibold leading-relaxed text-black">
        Rata-rata akumulasi seluruh ujian try out yang diselesaikan oleh murid terdaftar di cabang Anda.
      </p>
    </div>

    <!-- Active Students Card -->
    <div class="relative overflow-hidden rounded-xl border-4 border-black bg-white p-8 shadow-solid-md transition-transform hover:-translate-y-1 hover:shadow-solid-lg">
      <div class="flex items-center justify-between">
        <p class="text-xs font-extrabold uppercase tracking-widest text-neo-red">Murid Aktif Cabang</p>
        <span class="rounded-md border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-bold text-black">Langganan</span>
      </div>
      <div class="mt-6 flex items-baseline gap-2">
        <span class="text-5xl font-black tracking-tight text-black">{stats.activeStudents ?? 0}</span>
        <span class="text-sm font-bold text-black">Murid</span>
      </div>
      <p class="mt-4 text-xs font-semibold leading-relaxed text-black">
        Jumlah murid terdaftar yang memiliki paket belajar/langganan aktif yang belum kedaluwarsa.
      </p>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
    <h3 class="text-lg font-extrabold uppercase text-black">Aksi Cepat Manajemen</h3>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <a
        href="/admin/murid"
        class="flex items-center justify-between rounded-lg border-4 border-black bg-white p-4 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-md border-2 border-black bg-neo-blue p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 21c-2.324 0-4.503-.69-6.327-1.879m16.327-3.07a8.212 8.212 0 0 1-.786 3.07M19.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.997 12c.007-.06.007-.12.007-.18a7.5 7.5 0 1 1-1.026-3.832c.3.176.626.31.975.39a3.75 3.75 0 0 0 4.29-3.758 7.5 7.5 0 0 1 2.215 5.56c0 .416-.034.82-.1 1.217M10.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold uppercase text-black">Kelola Murid Cabang</p>
            <p class="text-xs font-semibold text-black">Tambah, edit, dan nonaktifkan murid</p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-black">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </a>

      <a
        href="/admin/pembayaran"
        class="flex items-center justify-between rounded-lg border-4 border-black bg-white p-4 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-md border-2 border-black bg-neo-red p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          </div>
          <div>
            <p class="font-extrabold uppercase text-black">Verifikasi Pembayaran</p>
            <p class="text-xs font-semibold text-black">Approve/reject bukti transfer murid</p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-black">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </a>
    </div>
  </div>
</div>
