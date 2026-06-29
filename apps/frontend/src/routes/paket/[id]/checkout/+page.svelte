<!--
Tujuan: Menyediakan halaman checkout paket fase 2 untuk murid — mendukung upload bukti (transfer bank) dan redirect ke detail order untuk pembayaran otomatis Midtrans (QRIS/VA).
Caller: Route `/paket/[id]/checkout`.
Dependensi: Package API, Order API, auth guard student, dan toast notification.
Main Functions: Menampilkan ringkasan paket, memvalidasi form checkout, membuat order multipart, redirect ke halaman detail order untuk proses pembayaran lanjutan.
Side Effects: Melakukan HTTP call ke backend untuk detail paket dan pembuatan order, menampilkan toast, dan memicu redirect ke /student/pembelian/[id].
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendPackageDetail } from '$lib/domain/types/package.types'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import { orderApi } from '$lib/infrastructure/api/order.api'
  import { packageApi } from '$lib/infrastructure/api/package.api'
  import Select from '$lib/components/ui/Select.svelte'

  let { data } = $props<{ data: { packageId: string } }>()

  let packageItem = $state<FrontendPackageDetail | null>(null)
  let isLoading = $state(true)
  let submitLoading = $state(false)
  let loadError = $state<string | null>(null)
  let errors = $state<Record<string, string>>({})
  let selectedFile = $state<File | null>(null)
  let form = $state({
    paymentMethod: 'BANK_TRANSFER',
    note: ''
  })

  const paymentMethodOptions = [
    { value: 'BANK_TRANSFER', label: 'Transfer Bank' },
    { value: 'QRIS', label: 'QRIS' },
    { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account' }
  ]

  onMount(async () => {
    try {
      packageItem = await packageApi.detail(data.packageId)
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Paket gagal dimuat'
    } finally {
      isLoading = false
    }
  })

  const validate = () => {
    errors = {}

    if (!packageItem) {
      errors.package = 'Paket belum siap diproses'
    }

    if (!form.paymentMethod) {
      errors.paymentMethod = 'Pilih metode pembayaran terlebih dahulu'
    }

    if (form.paymentMethod === 'BANK_TRANSFER' && !selectedFile) {
      errors.proofFile = 'Bukti transfer wajib diunggah untuk transfer bank'
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !packageItem) {
      return
    }

    submitLoading = true

    try {
      const payload = new FormData()
      payload.set('packageId', packageItem.id)
      payload.set('paymentMethod', form.paymentMethod)

      if (form.note.trim()) {
        payload.set('note', form.note.trim())
      }

      if (selectedFile) {
        payload.set('proofFile', selectedFile)
      }

      const result = await orderApi.create(payload)

      const isGatewayOrder = form.paymentMethod === 'QRIS' || form.paymentMethod === 'VIRTUAL_ACCOUNT'

      if (isGatewayOrder) {
        notify.success(`Order ${result.orderCode} berhasil dibuat. Silakan selesaikan pembayaran.`)
      } else {
        notify.success(`Order ${result.orderCode} berhasil dibuat. Menunggu verifikasi admin cabang.`)
      }

      // Redirect ke halaman detail order agar murid bisa bayar / cek status
      setTimeout(() => {
        void goto(`/student/pembelian/${result.id}`)
      }, 600)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Checkout gagal diproses')
    } finally {
      submitLoading = false
    }
  }
</script>

{#if isLoading}
  <section class="rounded-2xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">
    Menyiapkan checkout paket...
  </section>
{:else if loadError}
  <section class="rounded-2xl border-4 border-black bg-neo-red/20 p-8 text-sm font-extrabold uppercase text-black">
    {loadError}
  </section>
{:else if packageItem}
  <section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
    <article class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
      <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
        Checkout Paket
      </span>
      <h1 class="mt-4 text-3xl font-black uppercase tracking-tight text-black">{packageItem.name}</h1>
      <p class="mt-2 text-sm font-bold leading-7 text-black/60">{packageItem.description}</p>

      <div class="mt-6 rounded-xl border-4 border-black bg-neo-blue/10 p-5">
        <p class="text-xs font-black uppercase tracking-wider text-black/70">Ringkasan Pembelian</p>
        <p class="mt-3 text-3xl font-black text-black">{packageItem.priceLabel}</p>
        <p class="mt-2 text-sm font-bold text-black/70">Akses aktif selama {packageItem.durationDays} hari setelah pembayaran disetujui.</p>
      </div>

      <div class="mt-6 space-y-4">
        {#each packageItem.features as feature}
          <div class="rounded-xl border-2 border-black bg-white p-4">
            <p class="text-sm font-black uppercase tracking-tight text-black">{feature.title}</p>
            {#if feature.description}
              <p class="mt-1 text-sm font-bold text-black/60">{feature.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </article>

    <aside class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
      <div class="space-y-6">
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Metode Pembayaran</label>
          <Select
            options={paymentMethodOptions}
            bind:value={form.paymentMethod}
            placeholder="Pilih Metode Pembayaran"
            searchable={false}
            error={!!errors.paymentMethod}
            class="mt-2"
          />
          {#if errors.paymentMethod}
            <span class="mt-2 block text-xs font-bold text-neo-red">{errors.paymentMethod}</span>
          {/if}
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Bukti Pembayaran</label>
          {#if form.paymentMethod === 'BANK_TRANSFER'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              class={`mt-2 w-full rounded-xl border-[3px] bg-white px-4 py-3 text-sm font-black text-black outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.proofFile ? 'border-neo-red' : 'border-black'}`}
              onchange={(event) => {
                const target = event.currentTarget as HTMLInputElement
                selectedFile = target.files?.[0] ?? null
              }}
            />
            <span class="mt-2 block text-xs font-bold text-black/40">Unggah JPG, PNG, WEBP, atau PDF. Maksimal 50 MB.</span>
            {#if errors.proofFile}
              <span class="mt-2 block text-xs font-bold text-neo-red">{errors.proofFile}</span>
            {/if}
          {:else}
            <div class="mt-2 rounded-xl border-2 border-dashed border-black bg-neo-blue/10 px-4 py-5 text-center text-xs font-bold text-black/60">
              Pembayaran {form.paymentMethod === 'QRIS' ? 'QRIS' : 'Virtual Account'} diproses otomatis via Midtrans.<br />
              Tidak perlu upload bukti pembayaran.
            </div>
          {/if}
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Catatan Pembayaran</label>
          <textarea
            bind:value={form.note}
            rows="4"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            placeholder="Contoh: transfer dari rekening orang tua a.n. Budi Santoso"
          ></textarea>
        </div>

        <div class="pt-4">
          <button
            type="button"
            class="w-full rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none"
            onclick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Memproses order...' : 'Buat Order Pembelian'}
          </button>
        </div>
      </div>
    </aside>
  </section>
{/if}
