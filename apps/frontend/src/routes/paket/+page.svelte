<!--
Tujuan: Menyediakan halaman katalog paket belajar fase 2 untuk pengunjung publik dan murid.
Caller: Route publik `/paket`.
Dependensi: Package API dan tipe package frontend.
Main Functions: Mengambil daftar paket aktif lalu menampilkan kartu paket dan CTA ke detail paket.
Side Effects: Melakukan HTTP call ke backend untuk daftar paket aktif.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type { FrontendPackageSummary } from '$lib/domain/types/package.types'
  import { packageApi } from '$lib/infrastructure/api/package.api'

  let packages = $state<FrontendPackageSummary[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  onMount(async () => {
    try {
      packages = await packageApi.list()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar paket gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<section class="space-y-8">
  <div class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
    <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-neo-blue">Paket Belajar</p>
    <h1 class="mt-4 text-4xl font-extrabold uppercase text-black">Pilih paket yang paling pas untuk ritme belajar Anda</h1>
    <p class="mt-3 max-w-3xl text-sm font-semibold leading-7 text-black">
      Semua paket bisa dibayar manual lalu diverifikasi admin cabang. Setelah aktif, akses materi dan try out akan terbuka otomatis.
    </p>
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-black border-dashed bg-white p-8 text-sm font-bold text-black">
      Memuat daftar paket belajar...
    </div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red p-8 text-sm font-bold text-black">
      {loadError}
    </div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-3">
      {#each packages as packageItem}
        <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-md transition-transform hover:-translate-y-1 hover:shadow-solid-lg">
          <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-neo-green">{packageItem.type}</p>
          <h2 class="mt-4 text-2xl font-extrabold uppercase text-black">{packageItem.name}</h2>
          <p class="mt-4 text-sm font-semibold leading-7 text-black">{packageItem.description}</p>

          <div class="mt-6 rounded-lg border-4 border-black bg-neo-yellow p-4">
            <p class="text-3xl font-extrabold text-black">{packageItem.priceLabel}</p>
            <p class="mt-2 text-sm font-bold text-black">Akses aktif selama {packageItem.durationDays} hari</p>
          </div>

          <div class="mt-6 flex gap-3">
            <a
              href={`/paket/${packageItem.id}`}
              class="inline-flex flex-1 items-center justify-center rounded-lg border-4 border-black bg-neo-blue px-5 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Lihat Detail
            </a>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
