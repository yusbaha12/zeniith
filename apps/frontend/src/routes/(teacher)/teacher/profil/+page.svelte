<!--
Tujuan: Menyediakan halaman profil guru fase 1.
Caller: Route `/teacher/profil`.
Dependensi: ProfilePanel dan data user dari layout server.
Main Functions: Menampilkan form update profil dan password untuk guru.
Side Effects: Tidak ada selain render komponen form profil.
-->

<script lang="ts">
  import ProfilePanel from '$lib/components/layout/ProfilePanel.svelte'

  let { data } = $props()
</script>

<div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden mb-8">
  <!-- Accent bar representing the active section -->
  <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
  
  <div class="flex-grow p-6">
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
        Pengaturan Akun
      </span>
      <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
        Profil Guru
      </span>
    </div>
    <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Profil Guru</h1>
    <p class="mt-1 text-sm font-bold text-ink/60">Perbarui data akun guru Anda dari halaman ini.</p>
  </div>
</div>

<div class="mt-8">
  <ProfilePanel user={data.user} />
</div>
