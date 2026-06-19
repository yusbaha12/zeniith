<!--
Tujuan: Menyediakan dashboard super admin yang interaktif dengan visualisasi statistik nasional (rata-rata try out, murid aktif nasional, jumlah cabang, total registrasi murid) dan akses ekspor laporan nasional.
Caller: Route `/superadmin/dashboard`.
Dependensi: Svelte 5 Runes, stats dari load function.
Main Functions: Menampilkan grid ringkasan metrics nasional dan akses cepat menu superadmin.
-->

<script lang="ts">
  let { data } = $props()

  const stats = $derived(data.stats)
  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'
</script>

<div class="space-y-8">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-yellow border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Sistem Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Dashboard
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Dashboard Super Admin</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">
          Selamat datang kembali, <span class="font-black text-neo-blue">{data.user.name}</span>. Anda mengelola sistem secara global.
        </p>
      </div>
      <div>
        <a
          id="btn-export-national"
          href={`${apiBaseUrl}/superadmin/reports/export`}
          target="_blank"
          class="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Laporan Nasional (CSV)
        </a>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <!-- National Avg Score -->
    <div class="relative overflow-hidden rounded-2xl border-4 border-black bg-white p-6 shadow-solid-md">
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-neo-yellow border-b border-black"></div>
      <p class="text-xs font-black uppercase tracking-wider text-ink/60 mt-1">Avg Score Nasional</p>
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-black tracking-tight text-ink">{stats.avgScore ?? 0}</span>
        <span class="text-xs font-bold text-ink/40">/ 100</span>
      </div>
      <p class="mt-2 text-[10px] font-bold text-ink/50">Rata-rata akumulasi nilai ujian se-nasional.</p>
    </div>

    <!-- National Active Students -->
    <div class="relative overflow-hidden rounded-2xl border-4 border-black bg-white p-6 shadow-solid-md">
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-neo-blue border-b border-black"></div>
      <p class="text-xs font-black uppercase tracking-wider text-ink/60 mt-1">Murid Aktif Nasional</p>
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-black tracking-tight text-ink">{stats.activeStudents ?? 0}</span>
        <span class="text-xs font-bold text-ink/40">Siswa</span>
      </div>
      <p class="mt-2 text-[10px] font-bold text-ink/50">Murid dengan langganan aktif se-nasional.</p>
    </div>

    <!-- Total Branches -->
    <div class="relative overflow-hidden rounded-2xl border-4 border-black bg-white p-6 shadow-solid-md">
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-neo-green border-b border-black"></div>
      <p class="text-xs font-black uppercase tracking-wider text-ink/60 mt-1">Total Cabang Aktif</p>
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-black tracking-tight text-ink">{stats.totalBranches ?? 0}</span>
        <span class="text-xs font-bold text-ink/40">Cabang</span>
      </div>
      <p class="mt-2 text-[10px] font-bold text-ink/50">Jumlah cabang bimbel aktif yang terdaftar.</p>
    </div>

    <!-- Total Registered Students -->
    <div class="relative overflow-hidden rounded-2xl border-4 border-black bg-white p-6 shadow-solid-md">
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-neo-pink border-b border-black"></div>
      <p class="text-xs font-black uppercase tracking-wider text-ink/60 mt-1">Total Siswa Terdaftar</p>
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-black tracking-tight text-ink">{stats.totalStudents ?? 0}</span>
        <span class="text-xs font-bold text-ink/40">Siswa</span>
      </div>
      <p class="mt-2 text-[10px] font-bold text-ink/50">Akumulasi siswa terdaftar sejak sistem aktif.</p>
    </div>
  </div>

  <!-- Operational Areas / Quick Actions -->
  <div class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid-md">
    <h3 class="text-lg font-black text-ink">Pusat Kendali Operasional</h3>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Cabang -->
      <a
        href="/superadmin/cabang"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-neo-yellow/5"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-neo-yellow p-2 text-black shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h-5.625" />
            </svg>
          </div>
          <p class="font-black text-ink">Kelola Cabang</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Atur unit cabang bimbel se-Indonesia</p>
      </a>

      <!-- Pengguna -->
      <a
        href="/superadmin/pengguna"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-neo-blue/5"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-neo-blue p-2 text-white shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 21c-2.324 0-4.503-.69-6.327-1.879m16.327-3.07a8.212 8.212 0 0 1-.786 3.07M19.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.997 12c.007-.06.007-.12.007-.18a7.5 7.5 0 1 1-1.026-3.832c.3.176.626.31.975.39a3.75 3.75 0 0 0 4.29-3.758 7.5 7.5 0 0 1 2.215 5.56c0 .416-.034.82-.1 1.217M10.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <p class="font-black text-ink">Kelola Pengguna</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Murid, Guru, Admin Cabang, & Super Admin</p>
      </a>

      <!-- Paket -->
      <a
        href="/superadmin/paket"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-neo-green/5"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-neo-green p-2 text-black shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <p class="font-black text-ink">Kelola Paket</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Atur paket reguler, intensif, & premium</p>
      </a>

      <!-- Kurikulum -->
      <a
        href="/superadmin/kurikulum"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-neo-yellow/5"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-neo-yellow p-2 text-black shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-16.25v14.25" />
            </svg>
          </div>
          <p class="font-black text-ink">Kelola Kurikulum</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Mata pelajaran, modul, dan silabus</p>
      </a>

      <!-- Pengaturan -->
      <a
        href="/superadmin/pengaturan"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-neo-pink/5"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-neo-pink p-2 text-white shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <p class="font-black text-ink">Pengaturan</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Atur maintenance mode, limit warning, dsb</p>
      </a>

      <!-- Log -->
      <a
        href="/superadmin/log"
        class="flex flex-col justify-between rounded-xl border-2 border-black bg-white p-5 shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform hover:bg-slate-50"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg border-2 border-black bg-slate-200 p-2 text-black shadow-solid-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
          </div>
          <p class="font-black text-ink">Log Sistem</p>
        </div>
        <p class="mt-3 text-xs font-bold text-ink/50">Audit log, permission trail, & log aktivitas</p>
      </a>
    </div>
  </div>
</div>
