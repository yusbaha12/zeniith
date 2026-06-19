<!--
Tujuan: Menyediakan halaman checkout paket fase 2 untuk murid dengan upload bukti transfer.
Caller: Route `/paket/[id]/checkout`.
Dependensi: Package API, Order API, dan auth guard student.
Main Functions: Menampilkan ringkasan paket, memvalidasi form checkout, lalu membuat order multipart ke backend.
Side Effects: Melakukan HTTP call ke backend untuk detail paket dan pembuatan order.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendPackageDetail } from '$lib/domain/types/package.types'
  import { orderApi } from '$lib/infrastructure/api/order.api'
  import { packageApi } from '$lib/infrastructure/api/package.api'

  let { data } = $props<{ data: { packageId: string } }>()

  let packageItem = $state<FrontendPackageDetail | null>(null)
  let isLoading = $state(true)
  let submitLoading = $state(false)
  let loadError = $state<string | null>(null)
  let submitError = $state<string | null>(null)
  let submitMessage = $state<string | null>(null)
  let errors = $state<Record<string, string>>({})
  let selectedFile = $state<File | null>(null)
  let form = $state({
    paymentMethod: 'BANK_TRANSFER',
    note: ''
  })

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
    submitError = null
    submitMessage = null

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
      submitMessage = `Order ${result.orderCode} berhasil dibuat. Menunggu verifikasi admin cabang.`

      setTimeout(() => {
        void goto('/student/pembelian')
      }, 900)
    } catch (error) {
      submitError = error instanceof Error ? error.message : 'Checkout gagal diproses'
    } finally {
      submitLoading = false
    }
  }
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">
    Menyiapkan checkout paket...
  </section>
{:else if loadError}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">
    {loadError}
  </section>
{:else if packageItem}
  <section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
    <article class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Checkout Paket</p>
      <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">{packageItem.name}</h1>
      <p class="mt-3 text-sm font-bold leading-7 text-black/70">{packageItem.description}</p>

      <div class="mt-8 rounded-xl border-4 border-black bg-neo-blue/10 p-5">
        <p class="text-sm font-extrabold uppercase text-black/70">Ringkasan Pembelian</p>
        <p class="mt-3 text-3xl font-extrabold text-black">{packageItem.priceLabel}</p>
        <p class="mt-2 text-sm font-bold text-black/70">Akses aktif selama {packageItem.durationDays} hari setelah pembayaran disetujui.</p>
      </div>

      <div class="mt-8 space-y-3">
        {#each packageItem.features as feature}
          <div class="rounded-xl border-4 border-black bg-white p-4">
            <p class="text-sm font-extrabold uppercase text-black">{feature.title}</p>
            {#if feature.description}
              <p class="mt-1 text-sm font-bold text-black/70">{feature.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </article>

    <aside class="rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <div class="space-y-5">
        <label class="block">
          <span class="mb-2 block text-sm font-extrabold uppercase text-black">Metode Pembayaran</span>
          <select bind:value={form.paymentMethod} class={`w-full rounded-xl border-4 px-4 py-3 font-bold text-black outline-none transition focus:shadow-solid-sm focus:border-neo-blue ${errors.paymentMethod ? 'border-neo-red' : 'border-black'}`}>
            <option value="BANK_TRANSFER">Transfer Bank</option>
            <option value="QRIS">QRIS</option>
            <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
          </select>
          {#if errors.paymentMethod}<span class="mt-2 block text-sm font-extrabold text-neo-red">{errors.paymentMethod}</span>{/if}
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-extrabold uppercase text-black">Bukti Pembayaran</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            class={`w-full rounded-xl border-4 bg-white px-4 py-3 font-bold text-black outline-none transition focus:shadow-solid-sm focus:border-neo-blue ${errors.proofFile ? 'border-neo-red' : 'border-black'}`}
            onchange={(event) => {
              const target = event.currentTarget as HTMLInputElement
              selectedFile = target.files?.[0] ?? null
            }}
          />
          <span class="mt-2 block text-xs font-bold text-black/60">Unggah JPG, PNG, WEBP, atau PDF. Maksimal 50 MB.</span>
          {#if errors.proofFile}<span class="mt-2 block text-sm font-extrabold text-neo-red">{errors.proofFile}</span>{/if}
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-extrabold uppercase text-black">Catatan Pembayaran</span>
          <textarea bind:value={form.note} rows="4" class="w-full rounded-xl border-4 border-black px-4 py-3 font-bold text-black outline-none transition focus:shadow-solid-sm focus:border-neo-blue" placeholder="Contoh: transfer dari rekening orang tua a.n. Budi Santoso"></textarea>
        </label>

        <button
          type="button"
          class="w-full rounded-xl border-4 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          onclick={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? 'Memproses order...' : 'Buat Order Pembelian'}
        </button>

        {#if submitMessage}
          <p class="mt-4 rounded-md border-2 border-black bg-neo-green p-3 text-sm font-extrabold uppercase text-black">{submitMessage}</p>
        {/if}

        {#if submitError}
          <p class="mt-4 rounded-md border-2 border-black bg-neo-red p-3 text-sm font-extrabold uppercase text-white">{submitError}</p>
        {/if}
      </div>
    </aside>
  </section>
{/if}
