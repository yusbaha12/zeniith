<!--
Tujuan: Menyediakan shell navigasi untuk seluruh area guru.
Caller: Route group `(teacher)`.
Dependensi: RoleShell dan auth store.
Main Functions: Menghydrasi auth store lalu merender sidebar guru dan children route.
Side Effects: Menyimpan user aktif ke auth store client-side.
-->

<script lang="ts">
  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import RoleShell from '$lib/components/layout/RoleShell.svelte'

  let { data, children } = $props()
  $effect(() => {
    authStore.hydrate(data.user)
  })

  const items = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      label: 'Akademik',
      icon: 'book-open',
      children: [
        { href: '/teacher/materi', label: 'Kelola Materi', icon: 'book-open' },
        { href: '/teacher/ujian', label: 'Kelola Ujian', icon: 'file-text' }
      ]
    },
    { href: '/teacher/profil', label: 'Profil Saya', icon: 'user' }
  ]
</script>

<RoleShell user={data.user} {items}>
  {@render children()}
</RoleShell>
