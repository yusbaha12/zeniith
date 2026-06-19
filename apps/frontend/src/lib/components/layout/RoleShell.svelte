<!--
Tujuan: Menyediakan shell sidebar seragam untuk dashboard dan halaman profil per role.
Caller: Layout route student, teacher, admin, dan superadmin.
Dependensi: Auth store, tipe user frontend, dan children layout SvelteKit.
Main Functions: Menampilkan identitas user, navigasi role berkelompok (parent-child) dengan icon, dan tombol logout.
Side Effects: Memicu logout via API saat tombol keluar ditekan.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import type { FrontendUser } from '$lib/domain/types/user.types'
  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import Icon from '$lib/components/ui/Icon.svelte'

  interface NavChild {
    href: string
    label: string
    icon?: string
  }

  interface NavItem {
    href?: string
    label: string
    icon?: string
    children?: NavChild[]
  }

  let { user, items, children } = $props<{
    user: FrontendUser
    items: NavItem[]
    children: () => unknown
  }>()

  const handleLogout = async () => {
    await authStore.logout()
    await goto('/login')
  }

  // Reactive state to keep track of expanded groups
  let expandedGroups = $state<Record<string, boolean>>({})

  // Automatically expand groups containing the active path on load or navigation
  $effect(() => {
    const currentPath = page.url.pathname
    items.forEach((item: NavItem) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child: NavChild) => currentPath === child.href || currentPath.startsWith(child.href)
        )
        if (hasActiveChild && expandedGroups[item.label] === undefined) {
          expandedGroups[item.label] = true
        }
      }
    })
  })

  const toggleGroup = (label: string) => {
    expandedGroups[label] = !expandedGroups[label]
  }

  const isActive = (href: string) => {
    const currentPath = page.url.pathname
    // Prevent generic active state on dashboard matching everything else
    if (href === '/teacher/dashboard' || href === '/admin/dashboard' || href === '/superadmin/dashboard' || href === '/student/dashboard') {
      return currentPath === href
    }
    return currentPath === href || currentPath.startsWith(href)
  }
</script>

<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
  <aside class="sidebar-sticky rounded-xl border-4 border-black bg-neo-blue p-6 shadow-solid-lg text-white flex flex-col justify-between">
    <div class="flex flex-col flex-1 min-h-0">
      <div class="border-b-2 border-black/20 pb-4 shrink-0">
        <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-neo-yellow">Area Pengguna</p>
        <h2 class="mt-3 text-xl font-extrabold uppercase tracking-tight text-white line-clamp-1">{user.name}</h2>
        <p class="mt-1 text-xs font-semibold text-white/70 truncate">{user.email}</p>
        
        <div class="mt-3 inline-flex items-center gap-1.5 rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-solid-sm">
          Role: {user.role}
        </div>
      </div>

      <nav class="mt-6 space-y-2 overflow-y-auto flex-1 pr-1">
        {#each items as item}
          {#if item.children && item.children.length > 0}
            <!-- Parent Group Menu -->
            <div class="space-y-1">
              <button
                type="button"
                onclick={() => toggleGroup(item.label)}
                class="flex w-full items-center justify-between rounded-lg border-2 border-transparent px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-white/90 hover:bg-white/10 cursor-pointer"
              >
                <span class="flex items-center gap-2.5">
                  {#if item.icon}
                    <Icon name={item.icon} size={18} class="text-neo-yellow" />
                  {/if}
                  <span>{item.label}</span>
                </span>
                <Icon name={expandedGroups[item.label] ? 'chevron-up' : 'chevron-down'} size={14} class="text-white/60" />
              </button>

              <!-- Sub-menu (Children) -->
              {#if expandedGroups[item.label]}
                <div class="ml-4 pl-3 border-l-2 border-dashed border-white/20 space-y-1.5 py-1">
                  {#each item.children as child}
                    <a
                      href={child.href}
                      class="flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-xs font-bold uppercase transition-all cursor-pointer {
                        isActive(child.href)
                          ? 'border-black bg-neo-yellow text-black shadow-solid-sm -translate-y-0.5'
                          : 'border-transparent text-white/80 hover:bg-white/10'
                      }"
                    >
                      {#if child.icon}
                        <Icon name={child.icon} size={14} class={isActive(child.href) ? 'text-black' : 'text-neo-yellow/70'} />
                      {/if}
                      <span>{child.label}</span>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <!-- Single Link Menu -->
            <a
              href={item.href}
              class="flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer {
                item.href && isActive(item.href)
                  ? 'border-black bg-neo-yellow text-black shadow-solid-sm -translate-y-0.5'
                  : 'border-transparent text-white hover:bg-white/10'
              }"
            >
              {#if item.icon}
                <Icon name={item.icon} size={18} class={item.href && isActive(item.href) ? 'text-black' : 'text-neo-yellow'} />
              {/if}
              <span>{item.label}</span>
            </a>
          {/if}
        {/each}
      </nav>
    </div>

    <button
      type="button"
      class="mt-6 shrink-0 w-full rounded-lg border-4 border-black bg-neo-red px-4 py-3 text-xs font-black uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
      onclick={handleLogout}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Keluar
    </button>
  </aside>

  <section class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    {@render children()}
  </section>
</div>

<style>
  /* Sidebar: sticky inside the scrollable main container */
  .sidebar-sticky {
    min-height: 400px;
  }

  @media (min-width: 1024px) {
    .sidebar-sticky {
      position: sticky;
      top: 0;
      /* header is 72px, main has py-6 (24px top + 24px bottom) = 48px total padding */
      /* so the total non-content height is 72px header + 48px padding = 120px */
      height: calc(100svh - 72px - 3rem);
    }
  }

  /* Custom scrollbar for nav area */
  nav::-webkit-scrollbar {
    width: 6px;
  }
  nav::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.20);
    border-radius: 3px;
  }
  nav::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.40);
  }
</style>
