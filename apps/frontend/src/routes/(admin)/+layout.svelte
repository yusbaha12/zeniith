<!--
Tujuan: Menyediakan shell navigasi untuk seluruh area admin cabang.
Caller: Route group `(admin)`.
Dependensi: RoleShell dan auth store.
Main Functions: Menghydrasi auth store lalu merender sidebar admin dan children route.
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
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      label: 'Operasional Cabang',
      icon: 'building',
      children: [
        { href: '/admin/murid', label: 'Kelola Murid', permission: 'user.view.branch', icon: 'users' },
        { href: '/admin/pembayaran', label: 'Pembayaran Cabang', permission: 'order.branch.view', icon: 'credit-card' }
      ]
    },
    { href: '/admin/profil', label: 'Profil Saya', icon: 'user' }
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
