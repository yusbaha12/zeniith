<!--
Tujuan: Menjadi halaman error global frontend fase 0 untuk 404 dan error runtime route.
Caller: SvelteKit error boundary.
Dependensi: $app/state dan styling global frontend.
Main Functions: Menampilkan status dan pesan error dalam Bahasa Indonesia yang mudah dipindai.
Side Effects: Tidak ada selain render UI error.
-->

<script lang="ts">
  import { page } from '$app/state'
</script>

<section class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-[2rem] border border-white/60 bg-white/80 p-10 text-center shadow-glow backdrop-blur-xl">
  <span class="rounded-full bg-rose-gold/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-ink/70">
    Error Halaman
  </span>
  <h1 class="mt-6 text-5xl font-extrabold text-ink">{page.status}</h1>
  <p class="mt-4 text-lg font-medium text-ink/80">{page.error?.message ?? 'Halaman tidak dapat dimuat.'}</p>
  <a href="/" class="mt-8 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
    Kembali ke beranda
  </a>
</section>
