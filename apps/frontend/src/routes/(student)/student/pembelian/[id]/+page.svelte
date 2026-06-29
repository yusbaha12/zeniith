<!--
Tujuan: Menyediakan halaman detail order murid dengan status pembayaran realtime, instruksi bayar, dan integrasi Midtrans Snap untuk QRIS/Virtual Account.
Caller: Route `/student/pembelian/[id]`, di-redirect dari halaman checkout setelah order berhasil dibuat.
Dependensi: Order API (getStatus, snapToken), Midtrans Snap JS, notify service, dan tipe OrderDetailResult.
Main Functions: Load status order, tampilkan instruksi bayar sesuai metode, buka Snap popup untuk QRIS/VA, polling auto-refresh status.
Side Effects: HTTP call ke backend untuk status dan snap token. Load Midtrans Snap JS dari CDN. Auto-polling setiap 10 detik saat status PENDING.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'

  import type { OrderDetailResult } from '$lib/domain/types/order.types'
  import { orderApi } from '$lib/infrastructure/api/order.api'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let { data } = $props<{ data: { orderId: string } }>()

  let order = $state<OrderDetailResult | null>(null)
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)
  let isRequestingSnap = $state(false)
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const paymentMethodLabel: Record<string, string> = {
    BANK_TRANSFER: 'Transfer Bank',
    QRIS: 'QRIS',
    VIRTUAL_ACCOUNT: 'Virtual Account'
  }

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Menunggu Pembayaran', bg: 'bg-neo-yellow', text: 'text-black' },
    PAID: { label: 'Pembayaran Berhasil', bg: 'bg-neo-green', text: 'text-black' },
    REJECTED: { label: 'Pembayaran Ditolak', bg: 'bg-neo-red', text: 'text-white' },
    EXPIRED: { label: 'Order Kedaluwarsa', bg: 'bg-black/20', text: 'text-black' },
    REFUNDED: { label: 'Dikembalikan', bg: 'bg-neo-blue', text: 'text-white' }
  }

  const isGatewayOrder = $derived(
    order?.paymentMethod === 'QRIS' || order?.paymentMethod === 'VIRTUAL_ACCOUNT'
  )

  const loadOrder = async () => {
    try {
      order = await orderApi.getStatus(data.orderId)

      // Hentikan polling bila sudah tidak PENDING
      if (order.status !== 'PENDING' && pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null

        if (order.status === 'PAID') {
          notify.success('Pembayaran berhasil dikonfirmasi! Akses paket Anda sekarang sudah aktif.')
        }
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Status order gagal dimuat'
    } finally {
      isLoading = false
    }
  }

  const loadMidtransScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).snap) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
      // Untuk production: 'https://app.midtrans.com/snap/snap.js'
      script.setAttribute('data-client-key', '')
      script.onload = () => resolve()
      document.head.appendChild(script)
    })
  }

  const handleSnapPay = async () => {
    if (!order || isRequestingSnap) return
    isRequestingSnap = true

    try {
      // Ambil snap token dari backend
      const snapData = await orderApi.snapToken(order.id)

      // Set client key
      const existingScript = document.querySelector('script[src*="midtrans"]') as HTMLScriptElement | null

      if (existingScript) {
        existingScript.setAttribute('data-client-key', snapData.clientKey)
      } else {
        await loadMidtransScript()
      }

      const snap = (window as any).snap

      if (!snap) {
        notify.error('Midtrans Snap gagal dimuat. Coba refresh halaman.')
        return
      }

      snap.pay(snapData.snapToken, {
        onSuccess: () => {
          notify.success('Pembayaran berhasil! Menunggu konfirmasi...')
          void loadOrder()
          // Mulai polling untuk mendeteksi webhook dari Midtrans
          if (!pollInterval) {
            pollInterval = setInterval(() => void loadOrder(), 5000)
          }
        },
        onPending: () => {
          notify.info('Pembayaran menunggu konfirmasi dari bank/penyedia QRIS.')
          void loadOrder()
        },
        onError: () => {
          notify.error('Pembayaran gagal. Silakan coba lagi.')
        },
        onClose: () => {
          // User menutup popup tanpa bayar — biarkan di halaman
        }
      })
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Gagal memulai pembayaran Midtrans')
    } finally {
      isRequestingSnap = false
    }
  }

  onMount(async () => {
    await loadOrder()

    // Auto-polling saat PENDING untuk mendeteksi perubahan status (admin verify / webhook)
    if (order?.status === 'PENDING') {
      pollInterval = setInterval(() => void loadOrder(), 10000)
    }
  })

  onDestroy(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
    }
  })
</script>

<svelte:head>
  <title>Detail Order — LMS Bimbel</title>
</svelte:head>

{#if isLoading}
  <section class="rounded-2xl border-4 border-dashed border-black bg-neo-blue/10 p-10 text-sm font-bold text-black">
    Memuat detail order...
  </section>
{:else if loadError}
  <section class="rounded-2xl border-4 border-black bg-neo-red/20 p-10">
    <p class="text-sm font-extrabold uppercase text-black">{loadError}</p>
    <button
      type="button"
      class="mt-4 rounded-xl border-4 border-black bg-neo-blue px-5 py-2 text-sm font-extrabold text-white shadow-solid-sm transition-transform hover:-translate-y-1"
      onclick={() => void goto('/student/pembelian')}
    >
      Kembali ke Riwayat Pembelian
    </button>
  </section>
{:else if order}
  <div class="space-y-6">
    <!-- Header breadcrumb -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-xl border-4 border-black bg-white px-4 py-2 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
        onclick={() => void goto('/student/pembelian')}
      >
        ← Riwayat
      </button>
      <span class="text-sm font-bold text-black/60">/</span>
      <span class="text-sm font-bold text-black">{order.orderCode}</span>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <!-- Kiri: Info Order -->
      <article class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
        <!-- Status badge -->
        {@const statusCfg = statusConfig[order.status] ?? statusConfig.PENDING}
        <span class={`inline-block rounded-md border-2 border-black px-3 py-1 text-xs font-extrabold uppercase tracking-widest shadow-solid-sm ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>

        <h1 class="mt-4 text-3xl font-black uppercase tracking-tight text-black">{order.packageName}</h1>
        <p class="mt-1 text-sm font-bold text-black/60">{order.orderCode}</p>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
            <p class="font-extrabold uppercase text-black">Total Bayar</p>
            <p class="mt-1 text-2xl font-black text-black">Rp {order.amount.toLocaleString('id-ID')}</p>
          </div>
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
            <p class="font-extrabold uppercase text-black">Metode Bayar</p>
            <p class="mt-1 font-bold text-black">{paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}</p>
          </div>
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
            <p class="font-extrabold uppercase text-black">Dibuat</p>
            <p class="mt-1 font-bold text-black">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
          </div>
          {#if order.expiresAt}
            <div class="rounded-xl border-4 border-black bg-neo-yellow/30 p-4 text-sm">
              <p class="font-extrabold uppercase text-black">Kedaluwarsa</p>
              <p class="mt-1 font-bold text-black">{new Date(order.expiresAt).toLocaleString('id-ID')}</p>
            </div>
          {/if}
        </div>

        {#if order.note}
          <div class="mt-4 rounded-xl border-4 border-black bg-white p-4 text-sm">
            <p class="font-extrabold uppercase text-black">Catatan Anda</p>
            <p class="mt-1 font-bold text-black/70">{order.note}</p>
          </div>
        {/if}

        {#if order.verificationNote}
          <div class="mt-4 rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm">
            <p class="font-extrabold uppercase text-black">Catatan Verifikasi Admin</p>
            <p class="mt-1 font-bold text-black/70">{order.verificationNote}</p>
          </div>
        {/if}

        {#if order.proofUrl}
          <a
            href={order.proofUrl}
            target="_blank"
            rel="noreferrer"
            class="mt-4 inline-flex text-sm font-extrabold uppercase text-neo-blue underline transition hover:text-black"
          >
            Lihat bukti pembayaran →
          </a>
        {/if}

        <!-- Akses materi jika PAID -->
        {#if order.status === 'PAID'}
          <a
            href="/student/materi"
            class="mt-6 flex w-full items-center justify-center rounded-xl border-4 border-black bg-neo-green px-5 py-4 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            🎓 Mulai Belajar Sekarang
          </a>
        {/if}
      </article>

      <!-- Kanan: Instruksi Pembayaran -->
      <aside class="space-y-4">
        {#if order.status === 'PENDING'}
          {#if order.paymentMethod === 'BANK_TRANSFER'}
            <!-- Instruksi Transfer Bank -->
            <div class="rounded-2xl border-4 border-black bg-neo-yellow p-6 shadow-solid">
              <p class="text-xs font-black uppercase tracking-widest text-black">Instruksi Transfer Bank</p>
              <div class="mt-4 space-y-3 text-sm font-bold text-black">
                <div class="rounded-xl border-4 border-black bg-white p-4">
                  <p class="font-extrabold uppercase">Bank BCA</p>
                  <p class="mt-1 font-black text-xl tracking-widest">1234-5678-90</p>
                  <p class="mt-1 text-black/70">a.n. LMS Bimbel Indonesia</p>
                </div>
                <p class="rounded-xl border-2 border-black bg-black/5 px-4 py-3">
                  ⚡ Transfer tepat <strong>Rp {order.amount.toLocaleString('id-ID')}</strong> agar admin dapat memverifikasi dengan cepat.
                </p>
                <p class="text-xs font-bold text-black/60">
                  Lampirkan kode order <strong>{order.orderCode}</strong> pada berita transfer. Admin akan memverifikasi dalam 1×24 jam.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border-4 border-dashed border-black bg-neo-blue/10 p-5 text-sm font-bold text-black">
              <p class="font-extrabold uppercase">Sudah transfer?</p>
              <p class="mt-1 text-black/70">Halaman ini akan otomatis ter-update saat admin memverifikasi pembayaran Anda.</p>
            </div>

          {:else if isGatewayOrder}
            <!-- Instruksi QRIS / Virtual Account via Midtrans -->
            <div class="rounded-2xl border-4 border-black bg-neo-blue p-6 shadow-solid">
              <p class="text-xs font-black uppercase tracking-widest text-white">Bayar via Midtrans</p>
              <p class="mt-2 text-sm font-bold text-white/80">
                {order.paymentMethod === 'QRIS'
                  ? 'Scan QR Code atau pilih metode QRIS di aplikasi mobile banking / dompet digital Anda.'
                  : 'Dapatkan nomor Virtual Account dan transfer sesuai instruksi.'}
              </p>
              <p class="mt-3 text-2xl font-black text-white">Rp {order.amount.toLocaleString('id-ID')}</p>

              <button
                type="button"
                class="mt-5 w-full rounded-xl border-4 border-black bg-neo-yellow px-5 py-4 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
                onclick={() => void handleSnapPay()}
                disabled={isRequestingSnap}
              >
                {isRequestingSnap ? 'Membuka Midtrans...' : '⚡ Bayar Sekarang'}
              </button>
            </div>

            <div class="rounded-2xl border-4 border-dashed border-black bg-neo-blue/10 p-5 text-xs font-bold text-black/70">
              Setelah pembayaran selesai, status akan otomatis terupdate. Tidak perlu konfirmasi manual.
            </div>
          {/if}

          <!-- Auto-refresh indicator -->
          <div class="flex items-center gap-2 rounded-xl border-2 border-black/30 bg-white px-4 py-3 text-xs font-bold text-black/50">
            <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-neo-green"></span>
            Status diperbarui otomatis setiap 10 detik
          </div>
        {/if}
      </aside>
    </div>
  </div>
{/if}
