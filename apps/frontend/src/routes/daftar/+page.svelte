<!--
Tujuan: Menyediakan halaman pendaftaran murid fase 1 dengan daftar cabang aktif dan validasi inline.
Caller: Route publik `/daftar`.
Dependensi: Auth store dan Branch API.
Main Functions: Mengambil cabang aktif, memvalidasi form, dan mengirim registrasi user baru.
Side Effects: Melakukan HTTP call ke backend untuk ambil cabang dan kirim pendaftaran.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import type { FrontendBranch } from '$lib/domain/types/branch.types'
  import { branchApi } from '$lib/infrastructure/api/branch.api'

  let branches = $state<FrontendBranch[]>([])
  let form = $state({
    name: '',
    email: '',
    password: '',
    phone: '',
    branchId: ''
  })
  let errors = $state<Record<string, string>>({})
  let submitMessage = $state<string | null>(null)
  let submitError = $state<string | null>(null)

  onMount(async () => {
    branches = await branchApi.list()
    form.branchId = branches[0]?.id ?? ''
  })

  const validate = () => {
    errors = {}

    if (form.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter'
    }

    if (!form.email.includes('@')) {
      errors.email = 'Masukkan email yang valid'
    }

    if (form.password.length < 8) {
      errors.password = 'Password minimal 8 karakter'
    }

    if (form.phone.trim().length < 10) {
      errors.phone = 'Nomor HP minimal 10 digit'
    }

    if (!form.branchId) {
      errors.branchId = 'Pilih cabang terlebih dahulu'
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    submitMessage = null
    submitError = null

    if (!validate()) {
      return
    }

    try {
      await authStore.register(form)
      submitMessage = 'Pendaftaran berhasil. Silakan login dengan akun baru Anda.'
      setTimeout(() => {
        void goto('/login')
      }, 800)
    } catch (error) {
      submitError = error instanceof Error ? error.message : 'Pendaftaran gagal diproses'
    }
  }
</script>

<section class="mx-auto max-w-2xl rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
  <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-neo-blue">Daftar Murid Baru</p>
  <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">Buat akun belajar Anda</h1>
  <p class="mt-3 text-sm font-semibold leading-7 text-black">Lengkapi data berikut untuk bergabung dan mulai akses dashboard murid.</p>

  <div class="mt-8 grid gap-5 md:grid-cols-2">
    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Nama Lengkap</span>
      <input bind:value={form.name} class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.name ? 'border-neo-red' : 'border-black'}`} />
      {#if errors.name}<span class="mt-2 block text-sm font-bold text-neo-red">{errors.name}</span>{/if}
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Email</span>
      <input type="email" bind:value={form.email} class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.email ? 'border-neo-red' : 'border-black'}`} />
      {#if errors.email}<span class="mt-2 block text-sm font-bold text-neo-red">{errors.email}</span>{/if}
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Password</span>
      <input type="password" bind:value={form.password} class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.password ? 'border-neo-red' : 'border-black'}`} />
      {#if errors.password}<span class="mt-2 block text-sm font-bold text-neo-red">{errors.password}</span>{/if}
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Nomor HP</span>
      <input bind:value={form.phone} class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.phone ? 'border-neo-red' : 'border-black'}`} />
      {#if errors.phone}<span class="mt-2 block text-sm font-bold text-neo-red">{errors.phone}</span>{/if}
    </label>

    <label class="block md:col-span-2">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Cabang Terdekat</span>
      <select bind:value={form.branchId} class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.branchId ? 'border-neo-red' : 'border-black'}`}>
        {#each branches as branch}
          <option value={branch.id}>{branch.name} {branch.city ? `- ${branch.city}` : ''}</option>
        {/each}
      </select>
      {#if errors.branchId}<span class="mt-2 block text-sm font-bold text-neo-red">{errors.branchId}</span>{/if}
    </label>
  </div>

  <div class="mt-8 space-y-4">
    <button type="button" class="w-full rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none" onclick={handleSubmit} disabled={authStore.isLoading}>
      {authStore.isLoading ? 'Memproses...' : 'Daftar Sekarang'}
    </button>

    {#if submitMessage}
      <p class="text-sm font-bold text-neo-green">{submitMessage}</p>
    {/if}

    {#if submitError}
      <p class="text-sm font-bold text-neo-red">{submitError}</p>
    {/if}
  </div>
</section>
