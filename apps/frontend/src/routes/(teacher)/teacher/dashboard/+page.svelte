<!--
Tujuan: Menyediakan dashboard awal guru fase 1 setelah login berhasil.
Caller: Route `/teacher/dashboard`.
Dependensi: Data user dari layout server.
Main Functions: Menampilkan welcome state awal untuk guru.
Side Effects: Tidak ada selain render UI.
-->

<script lang="ts">
  let { data } = $props()
</script>

<div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
  <!-- Accent bar representing the active section -->
  <div class="w-4 bg-neo-stripes-yellow border-r-4 border-black flex-shrink-0"></div>
  
  <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
          Dashboard Guru
        </span>
      </div>
      <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Selamat datang, {data.user.name}</h1>
      <p class="mt-1 text-sm font-bold text-ink/60">Area guru siap untuk modul materi dan ujian pada fase selanjutnya. Untuk sekarang, profil dan akses role sudah aktif.</p>
    </div>
  </div>
</div>
