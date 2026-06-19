<!--
Tujuan: Menjadi shell root frontend fase 0 dengan header publik dan render seluruh route.
Caller: Semua halaman SvelteKit.
Dependensi: app.css global dan route children SvelteKit.
Main Functions: Menyediakan navigasi dasar, branding proyek, dan slot render halaman.
Side Effects: Tidak ada selain render UI root lintas halaman.
-->

<script lang="ts">
  import '../app.css'
  import 'katex/dist/katex.min.css'

  let { children } = $props()

  const navItems = [
    { href: '/', label: 'Beranda' },
    { href: '/paket', label: 'Paket Belajar' },
    { href: '/login', label: 'Masuk' },
    { href: '/daftar', label: 'Daftar' }
  ]
</script>

<div class="flex flex-col min-h-screen">
  <header id="app-header" class="sticky top-0 z-20 border-b-4 border-black bg-neo-yellow shrink-0">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <a href="/" class="text-xl font-extrabold uppercase tracking-tight text-black">LMS Bimbel</a>
      <nav class="hidden gap-5 md:flex">
        {#each navItems as item}
          <a href={item.href} class="text-sm font-bold uppercase text-black transition-transform hover:-translate-y-0.5">
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  </header>

  <main class="flex-1 overflow-y-auto px-6 py-6">
    {@render children()}
  </main>
</div>

<style>
  /* Expose header height as CSS variable for sidebar alignment */
  :global(:root) {
    --header-height: 72px;
  }
</style>
