<!--
Tujuan: Menyediakan landing shell fase 0 sebagai bukti frontend berhasil berjalan.
Caller: Route root `/`.
Dependensi: Root layout dan utilitas Tailwind global.
Main Functions: Menampilkan identitas proyek, status fase 0, dan CTA teknis awal.
Side Effects: Tidak ada selain render UI statis awal.
-->

<script lang="ts">
  const milestones = [
    'Frontend SvelteKit hidup dengan tema dasar proyek',
    'Backend ElysiaJS menyiapkan health endpoint dan Swagger',
    'Shared package siap dipakai lintas backend dan frontend'
  ]
</script>

<section class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
  <div class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
    <span class="inline-flex rounded-md border-2 border-black bg-neo-yellow px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">
      Fase 0 • Fondasi & Scaffold
    </span>
    <h1 class="mt-6 text-4xl font-extrabold uppercase leading-tight text-black md:text-5xl">
      LMS Bimbel mulai dibangun dengan fondasi real-time yang rapi dan siap tumbuh.
    </h1>
    <p class="mt-5 max-w-2xl text-base font-semibold leading-7 text-black">
      Repo ini sudah menyiapkan monorepo Bun, backend ElysiaJS, frontend SvelteKit, dan package shared
      sebagai dasar implementasi fase berikutnya.
    </p>
    <div class="mt-8 flex flex-wrap gap-4">
      <a
        href="http://localhost:3000/docs"
        class="rounded-lg border-4 border-black bg-neo-blue px-6 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Buka Swagger
      </a>
      <a
        href="http://localhost:3000/health"
        class="rounded-lg border-4 border-black bg-neo-green px-6 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Cek Health
      </a>
    </div>
  </div>

  <div class="space-y-4">
    {#each milestones as milestone}
      <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-md transition-transform hover:-translate-y-1">
        <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-neo-red">Progress</p>
        <p class="mt-3 text-base font-bold leading-7 text-black">{milestone}</p>
      </article>
    {/each}
  </div>
</section>
