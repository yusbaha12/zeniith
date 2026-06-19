<!--
Tujuan: Menyediakan halaman verifikasi pembayaran admin cabang fase 2.
Caller: Route `/admin/pembayaran`.
Dependensi: Order API dan tipe order frontend.
Main Functions: Mengambil daftar order per status, menampilkan detail order terpilih, dan memproses approve/reject.
Side Effects: Melakukan HTTP call ke backend untuk list order dan patch verifikasi pembayaran.
-->

<script lang="ts">
  import type { AdminOrderStatusFilter, FrontendOrderItem, VerifyOrderAction } from '$lib/domain/types/order.types'
  import { orderApi } from '$lib/infrastructure/api/order.api'

  const tabs: AdminOrderStatusFilter[] = ['PENDING', 'PAID', 'REJECTED']

  let activeStatus = $state<AdminOrderStatusFilter>('PENDING')
  let orders = $state<FrontendOrderItem[]>([])
  let selectedOrder = $state<FrontendOrderItem | null>(null)
  let note = $state('')
  let isLoading = $state(true)
  let isSubmitting = $state(false)
  let loadError = $state<string | null>(null)
  let actionMessage = $state<string | null>(null)

  const loadOrders = async () => {
    isLoading = true
    loadError = null

    try {
      orders = await orderApi.listAdmin(activeStatus)
      selectedOrder = orders[0] ?? null
      note = selectedOrder?.verificationNote ?? ''
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar pembayaran gagal dimuat'
    } finally {
      isLoading = false
    }
  }

  const selectOrder = (order: FrontendOrderItem) => {
    selectedOrder = order
    note = order.verificationNote ?? ''
    actionMessage = null
  }

  const handleVerify = async (action: VerifyOrderAction) => {
    if (!selectedOrder) {
      return
    }

    isSubmitting = true
    actionMessage = null

    try {
      await orderApi.verify(selectedOrder.id, action, note.trim() || undefined)
      actionMessage = action === 'APPROVE'
        ? 'Pembayaran berhasil disetujui.'
        : 'Pembayaran berhasil ditolak.'
      await loadOrders()
    } catch (error) {
      actionMessage = error instanceof Error ? error.message : 'Verifikasi pembayaran gagal diproses'
    } finally {
      isSubmitting = false
    }
  }

  $effect(() => {
    void loadOrders()
  })
</script>

<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
  <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    <div class="flex flex-wrap gap-3">
      {#each tabs as tab}
        <button
          type="button"
          class={`rounded-lg px-4 py-3 text-sm font-extrabold uppercase transition-transform ${
            activeStatus === tab
              ? 'border-4 border-black bg-neo-yellow text-black shadow-solid-sm'
              : 'border-4 border-black bg-white text-black active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 hover:shadow-solid-sm'
          }`}
          onclick={() => {
            activeStatus = tab
            selectedOrder = null
            note = ''
            void loadOrders()
          }}
        >
          {tab}
        </button>
      {/each}
    </div>

    <div class="mt-6 space-y-4">
      {#if isLoading}
        <p class="text-sm font-bold text-black">Memuat daftar pembayaran...</p>
      {:else if loadError}
        <p class="text-sm font-extrabold text-neo-red uppercase">{loadError}</p>
      {:else if orders.length === 0}
        <div class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-5 text-sm font-bold text-black">
          Tidak ada order dengan status {activeStatus}.
        </div>
      {:else}
        {#each orders as order}
          <button
            type="button"
            class={`block w-full rounded-xl border-4 p-4 text-left transition-transform ${
              selectedOrder?.id === order.id
                ? 'border-black bg-neo-yellow shadow-solid-sm'
                : 'border-black bg-white hover:-translate-y-1 hover:shadow-solid-sm active:translate-x-1 active:translate-y-1 active:shadow-none'
            }`}
            onclick={() => selectOrder(order)}
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-extrabold uppercase text-black">{order.studentName ?? 'Murid'}</p>
                <p class="mt-1 text-sm font-bold text-black/70">{order.packageName} • {order.orderCode}</p>
              </div>
              <p class="text-sm font-extrabold text-black">Rp {order.amount.toLocaleString('id-ID')}</p>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </article>

  <aside class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    {#if selectedOrder}
      <p class="inline-block rounded-md border-2 border-black bg-neo-red px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-white shadow-solid-sm">Detail Pembayaran</p>
      <h1 class="mt-4 text-2xl font-extrabold uppercase text-black">{selectedOrder.packageName}</h1>
      <p class="mt-2 text-sm font-bold text-black/70">{selectedOrder.studentName} • {selectedOrder.studentEmail}</p>

      <div class="mt-6 grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
          <p class="font-extrabold uppercase text-black">Kode Order</p>
          <p class="mt-1 font-bold text-black">{selectedOrder.orderCode}</p>
        </div>
        <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
          <p class="font-extrabold uppercase text-black">Metode Bayar</p>
          <p class="mt-1 font-bold text-black">{selectedOrder.paymentMethod}</p>
        </div>
        <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
          <p class="font-extrabold uppercase text-black">Nominal</p>
          <p class="mt-1 font-bold text-black">Rp {selectedOrder.amount.toLocaleString('id-ID')}</p>
        </div>
        <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
          <p class="font-extrabold uppercase text-black">Dibuat</p>
          <p class="mt-1 font-bold text-black">{new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div class="mt-6 rounded-xl border-4 border-black bg-white p-4">
        <p class="text-sm font-extrabold uppercase text-black">Catatan Murid</p>
        <p class="mt-2 text-sm font-bold text-black/70">{selectedOrder.note ?? 'Tidak ada catatan tambahan.'}</p>
      </div>

      {#if selectedOrder.proofUrl}
        <a href={selectedOrder.proofUrl} target="_blank" rel="noreferrer" class="mt-5 inline-flex text-sm font-extrabold uppercase text-neo-blue underline transition hover:text-black">
          Preview bukti pembayaran
        </a>
      {/if}

      {#if activeStatus === 'PENDING'}
        <div class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-extrabold uppercase text-black">Catatan Verifikasi</span>
            <textarea bind:value={note} rows="4" class="w-full rounded-xl border-4 border-black px-4 py-3 font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm" placeholder="Tulis alasan approve/reject bila diperlukan"></textarea>
          </label>

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border-4 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              onclick={() => void handleVerify('APPROVE')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Setujui'}
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl border-4 border-black bg-neo-red px-5 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              onclick={() => void handleVerify('REJECT')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Tolak'}
            </button>
          </div>
        </div>
      {:else}
        <div class="mt-6 rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
          <p class="font-extrabold uppercase text-black">Catatan Verifikasi</p>
          <p class="mt-2 font-bold text-black/70">{selectedOrder.verificationNote ?? 'Tidak ada catatan verifikasi.'}</p>
        </div>
      {/if}

      {#if actionMessage}
        <p class={`mt-4 rounded-md border-2 border-black p-3 text-sm font-extrabold uppercase ${actionMessage.includes('berhasil') ? 'bg-neo-green text-black' : 'bg-neo-red text-white'}`}>
          {actionMessage}
        </p>
      {/if}
    {:else}
      <div class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-6 text-sm font-bold text-black">
        Pilih salah satu order di kiri untuk melihat detail pembayaran dan memproses verifikasi.
      </div>
    {/if}
  </aside>
</section>
