<!--
Tujuan: Menyediakan halaman laporan global untuk super admin.
Caller: Route `/superadmin/laporan`.
Dependensi: Svelte 5 Runes, SvelteKit data.
Main Functions: Visualisasi metrik nasional dan pemicu download CSV laporan global.
-->

<script lang="ts">
  let { data } = $props()

  const stats = $derived(data.stats)
  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'
</script>

<div class="space-y-6">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-pink border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Laporan Nasional
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-pink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Laporan & Ekspor
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Laporan Global & Ekspor</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Lihat agregasi performa sistem dan ekspor laporan terperinci dalam format CSV.</p>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  {#if stats}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid hover:-translate-y-0.5 transition-transform">
        <p class="text-xs font-black text-black uppercase tracking-wider">Rata-rata Nilai Nasional</p>
        <p class="mt-4 text-3xl font-black text-black">{stats.avgScore ?? 0} <span class="text-xs font-bold text-black/50">/ 100</span></p>
      </div>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid hover:-translate-y-0.5 transition-transform">
        <p class="text-xs font-black text-black uppercase tracking-wider">Total Murid Aktif</p>
        <p class="mt-4 text-3xl font-black text-black">{stats.activeStudents ?? 0} <span class="text-xs font-bold text-black/50">Siswa</span></p>
      </div>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid hover:-translate-y-0.5 transition-transform">
        <p class="text-xs font-black text-black uppercase tracking-wider">Total Cabang Bimbel</p>
        <p class="mt-4 text-3xl font-black text-black">{stats.totalBranches ?? 0} <span class="text-xs font-bold text-black/50">Cabang</span></p>
      </div>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid hover:-translate-y-0.5 transition-transform">
        <p class="text-xs font-black text-black uppercase tracking-wider">Total Murid Terdaftar</p>
        <p class="mt-4 text-3xl font-black text-black">{stats.totalStudents ?? 0} <span class="text-xs font-bold text-black/50">Siswa</span></p>
      </div>
    </div>
  {/if}

  <!-- Export Actions -->
  <div class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
    <h3 class="text-xl font-black text-black uppercase tracking-tight">Ekspor Data Terintegrasi</h3>
    <p class="mt-2 text-sm font-bold text-ink/75 leading-relaxed max-w-xl">
      Unduh laporan lengkap dalam format CSV yang mencakup ID Murid, Nama, Email, Nomor Telepon, Nama Cabang, Paket Belajar Aktif, Status Langganan, dan Tanggal Kedaluwarsa.
    </p>

    <div class="mt-6 flex flex-wrap gap-4">
      <a
        href={`${apiBaseUrl}/superadmin/reports/export`}
        target="_blank"
        class="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-neo-green px-6 py-4 text-sm font-extrabold uppercase text-black shadow-solid hover:-translate-y-0.5 active:translate-y-0 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Ekspor Semua Murid (CSV)
      </a>
    </div>
  </div>
</div>
