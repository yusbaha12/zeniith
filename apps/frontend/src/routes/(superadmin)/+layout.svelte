<!--
Tujuan: Menyediakan shell navigasi untuk seluruh area super admin.
Caller: Route group `(superadmin)`.
Dependensi: RoleShell dan auth store.
Main Functions: Menghydrasi auth store lalu merender sidebar super admin dan children route.
Side Effects: Menyimpan user aktif ke auth store client-side.
-->

<script lang="ts">
  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import RoleShell from '$lib/components/layout/RoleShell.svelte'

  let { data, children } = $props()
  $effect(() => {
    authStore.hydrate(data.user)
  })

  interface MenuItem {
    href?: string
    label: string
    icon?: string
    permission?: string
    children?: {
      href: string
      label: string
      icon?: string
      permission?: string
    }[]
  }

  const allItems: MenuItem[] = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      label: 'Operasional',
      icon: 'building',
      children: [
        { href: '/superadmin/cabang', label: 'Kelola Cabang', permission: 'branch.manage', icon: 'building' },
        { href: '/superadmin/pengguna', label: 'Kelola Pengguna', permission: 'user.view.global', icon: 'users' }
      ]
    },
    {
      label: 'Akademik & Produk',
      icon: 'book-open',
      children: [
        { href: '/superadmin/kurikulum', label: 'Kelola Kurikulum', permission: 'curriculum.manage', icon: 'book-open' },
        { href: '/superadmin/materi', label: 'Kelola Materi', permission: 'material.manage.branch', icon: 'book-open' },
        { href: '/superadmin/ujian', label: 'Kelola Ujian & Soal', permission: 'exam.view', icon: 'file-text' },
        { href: '/superadmin/paket', label: 'Kelola Paket', permission: 'package.manage', icon: 'package' }
      ]
    },
    {
      label: 'Analisis & Log',
      icon: 'bar-chart',
      children: [
        { href: '/superadmin/laporan', label: 'Laporan Global', permission: 'report.global.view', icon: 'bar-chart' },
        { href: '/superadmin/log', label: 'Log Sistem', permission: 'audit_log.view', icon: 'activity' }
      ]
    },
    {
      label: 'Konfigurasi',
      icon: 'settings',
      children: [
        { href: '/superadmin/pengaturan', label: 'Pengaturan Sistem', permission: 'settings.manage', icon: 'settings' }
      ]
    },
    { href: '/superadmin/profil', label: 'Profil Saya', icon: 'user' }
  ]

  const items = allItems.map((item: MenuItem) => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (!child.permission) return true
        return data.user?.permissions?.includes(child.permission)
      })
      return { ...item, children: filteredChildren }
    }
    return item
  }).filter((item: MenuItem) => {
    if (item.children) {
      return item.children.length > 0
    }
    if (item.permission) {
      return data.user?.permissions?.includes(item.permission)
    }
    return true
  })
</script>

<RoleShell user={data.user} {items}>
  {@render children()}
</RoleShell>
