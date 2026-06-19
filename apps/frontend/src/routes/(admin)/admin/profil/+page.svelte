<!--
Tujuan: Menyediakan halaman profil admin cabang fase 1.
Caller: Route `/admin/profil`.
Dependensi: ProfilePanel dan data user dari layout server.
Main Functions: Menampilkan form update profil dan password untuk admin cabang.
Side Effects: Tidak ada selain render komponen form profil.
-->

<script lang="ts">
  import ProfilePanel from '$lib/components/layout/ProfilePanel.svelte'

  let { data } = $props()
</script>

<div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid mb-8">
  <span class="inline-block rounded-lg border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-solid-sm mb-2">
    Pengaturan Akun
  </span>
  <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Profil Admin Cabang</h1>
  <p class="mt-1 text-sm font-bold text-ink/60">Perbarui data akun admin cabang Anda dari halaman ini.</p>
</div>

<div class="mt-8">
  <ProfilePanel user={data.user} />
</div>
