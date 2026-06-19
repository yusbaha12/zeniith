<!--
Tujuan: Menyediakan halaman detail paket fase 2 dengan fitur dan CTA checkout.
Caller: Route publik `/paket/[id]`.
Dependensi: Package API dan tipe package detail frontend.
Main Functions: Mengambil satu paket beserta fitur-fiturnya lalu menampilkan CTA pembelian.
Side Effects: Melakukan HTTP call ke backend untuk detail paket.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type { FrontendPackageDetail } from '$lib/domain/types/package.types'
  import { packageApi } from '$lib/infrastructure/api/package.api'

  let { data } = $props<{ data: { packageId: string } }>()

  let packageItem = $state<FrontendPackageDetail | null>(null)
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  onMount(async () => {
    try {
      packageItem = await packageApi.detail(data.packageId)
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Detail paket gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">
    Memuat detail paket...
  </section>
{:else if loadError}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">
    {loadError}
  </section>
{:else if packageItem}
  <section class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
    <article class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">{packageItem.type}</p>
      <h1 class="mt-4 text-4xl font-extrabold uppercase text-black">{packageItem.name}</h1>
      <p class="mt-4 text-sm font-bold leading-8 text-black/70">{packageItem.description}</p>

      <div class="mt-8 grid gap-4">
        {#each packageItem.features as feature}
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4">
            <h2 class="text-base font-extrabold uppercase text-black">{feature.title}</h2>
            {#if feature.description}
               <p class="mt-2 text-sm font-bold text-black/70">{feature.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </article>

    <aside class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <p class="text-sm font-extrabold uppercase text-black">Harga Paket</p>
      <p class="mt-3 text-4xl font-extrabold text-black">{packageItem.priceLabel}</p>
      <p class="mt-3 text-sm font-bold leading-7 text-black/70">Akses belajar aktif selama {packageItem.durationDays} hari setelah pembayaran diverifikasi admin cabang.</p>

      <div class="mt-8 space-y-3 text-sm font-bold text-black/70">
        <p>• Checkout aman dengan bukti transfer manual</p>
        <p>• Status pembayaran bisa dipantau di dashboard murid</p>
        <p>• Akses materi dibuka otomatis saat pembayaran disetujui</p>
      </div>

      <a
        href={`/paket/${packageItem.id}/checkout`}
        class="mt-8 inline-flex w-full items-center justify-center rounded-xl border-4 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Beli Paket Ini
      </a>
    </aside>
  </section>
{/if}
