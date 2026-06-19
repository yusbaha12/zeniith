<!--
Tujuan: Menyediakan halaman riwayat pembelian murid fase 2.
Caller: Route `/student/pembelian`.
Dependensi: Order API, tipe order frontend, dan tipe subscription frontend.
Main Functions: Mengambil order milik murid, menampilkan status pembayaran, dan menunjukkan paket aktif saat ini.
Side Effects: Melakukan HTTP call ke backend untuk riwayat order dan langganan aktif.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type { FrontendOrderItem } from '$lib/domain/types/order.types'
  import type { ActiveSubscription } from '$lib/domain/types/subscription.types'
  import { orderApi } from '$lib/infrastructure/api/order.api'

  let orders = $state<FrontendOrderItem[]>([])
  let activeSubscription = $state<ActiveSubscription | null>(null)
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  onMount(async () => {
    try {
      const [ordersResult, subscriptionResult] = await Promise.all([
        orderApi.listMine(),
        orderApi.activeSubscription()
      ])

      orders = ordersResult
      activeSubscription = subscriptionResult
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Riwayat pembelian gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<div class="space-y-6">
  <section class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Langganan Aktif</p>

    {#if activeSubscription}
      <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">{activeSubscription.packageName}</h1>
      <p class="mt-3 text-sm font-bold leading-7 text-black/70">
        Paket aktif hingga {new Date(activeSubscription.endsAt).toLocaleDateString('id-ID')} • sisa {activeSubscription.remainingDays} hari.
      </p>
    {:else}
      <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">Belum ada paket aktif</h1>
      <p class="mt-3 text-sm font-bold leading-7 text-black/70">Pilih paket belajar lalu tunggu verifikasi pembayaran agar akses materi terbuka.</p>
      <a href="/paket" class="mt-5 inline-flex rounded-xl border-4 border-black bg-neo-blue px-5 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none">Lihat Paket</a>
    {/if}
  </section>

  <section class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="inline-block rounded-md border-2 border-black bg-neo-red px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-white shadow-solid-sm">Riwayat Order</p>
        <h2 class="mt-3 text-2xl font-extrabold uppercase text-black">Semua pembelian paket Anda</h2>
      </div>
      <a href="/paket" class="rounded-xl border-4 border-black bg-neo-green px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none">Beli Paket Lagi</a>
    </div>

    {#if isLoading}
      <div class="mt-6 text-sm font-bold text-black/70">Memuat riwayat order...</div>
    {:else if loadError}
      <div class="mt-6 text-sm font-extrabold uppercase text-neo-red">{loadError}</div>
    {:else if orders.length === 0}
      <div class="mt-6 rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-5 text-sm font-bold text-black/70">
        Belum ada order. Anda bisa mulai dari halaman paket belajar.
      </div>
    {:else}
      <div class="mt-6 space-y-4">
        {#each orders as order}
          <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-sm font-extrabold uppercase text-black">{order.packageName}</p>
                <p class="mt-1 text-sm font-bold text-black/70">{order.orderCode} • {order.packageType}</p>
                <p class="mt-2 text-sm font-bold text-black/70">Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}</p>
              </div>

              <div class="text-left lg:text-right">
                <p class="text-lg font-extrabold text-black">Rp {order.amount.toLocaleString('id-ID')}</p>
                <p class={`mt-1 inline-flex rounded-md border-2 border-black px-3 py-1 text-xs font-extrabold uppercase shadow-solid-sm ${
                  order.status === 'PAID'
                    ? 'bg-neo-green text-black'
                    : order.status === 'REJECTED'
                      ? 'bg-neo-red text-white'
                      : 'bg-neo-yellow text-black'
                }`}>
                  {order.status}
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm font-bold text-black">
                <p class="font-extrabold uppercase text-black">Metode Bayar</p>
                <p class="mt-1">{order.paymentMethod}</p>
              </div>

              <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm font-bold text-black">
                <p class="font-extrabold uppercase text-black">Catatan Admin</p>
                <p class="mt-1">{order.verificationNote ?? 'Belum ada catatan verifikasi.'}</p>
              </div>
            </div>

            {#if order.proofUrl}
              <a href={order.proofUrl} target="_blank" rel="noreferrer" class="mt-4 inline-flex text-sm font-extrabold uppercase text-neo-blue underline transition hover:text-black">
                Lihat bukti pembayaran
              </a>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>
