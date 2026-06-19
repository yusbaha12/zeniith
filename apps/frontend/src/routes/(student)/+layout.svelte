<!--
Tujuan: Menyediakan shell navigasi untuk seluruh area murid.
Caller: Route group `(student)`.
Dependensi: RoleShell dan auth store.
Main Functions: Menghydrasi auth store lalu merender sidebar murid dan children route.
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
    { href: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      label: 'Pembelajaran',
      icon: 'book-open',
      children: [
        { href: '/student/materi', label: 'Materi Belajar', icon: 'book-open' },
        { href: '/student/tryout', label: 'Try Out Ujian', icon: 'file-text' },
        { href: '/student/leaderboard', label: 'Leaderboard Murid', icon: 'trophy' }
      ]
    },
    {
      label: 'Keuangan',
      icon: 'credit-card',
      children: [
        { href: '/student/pembelian', label: 'Pembelian Saya', icon: 'credit-card' }
      ]
    },
    { href: '/student/profil', label: 'Profil Saya', icon: 'user' }
  ]
</script>

<RoleShell user={data.user} {items}>
  {@render children()}
</RoleShell>
