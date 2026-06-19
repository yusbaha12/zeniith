<!--
Tujuan: Menyediakan halaman profil murid fase 1.
Caller: Route `/student/profil`.
Dependensi: ProfilePanel dan data user dari layout server.
Main Functions: Menampilkan form update profil dan password untuk murid.
Side Effects: Tidak ada selain render komponen form profil.
-->

<script lang="ts">
  import ProfilePanel from '$lib/components/layout/ProfilePanel.svelte'

  let { data } = $props()
</script>

<h1 class="text-3xl font-extrabold uppercase text-black">Profil Murid</h1>
<p class="mt-3 text-sm font-bold leading-7 text-black/70">Perbarui nama, nomor HP, dan password akun Anda dari sini.</p>

<div class="mt-8">
  <ProfilePanel user={data.user} />
</div>
