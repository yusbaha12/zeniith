<!--
Tujuan: Menyediakan halaman pendaftaran murid fase 1 dengan daftar cabang aktif dan validasi inline.
Caller: Route publik `/daftar`.
Dependensi: Auth store, Branch API, dan toast notification.
Main Functions: Mengambil cabang aktif, memvalidasi form, mengirim registrasi user baru, dan kirim feedback via toast.
Side Effects: Melakukan HTTP call ke backend untuk ambil cabang dan kirim pendaftaran, menampilkan toast, dan memicu redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import type { FrontendBranch } from '$lib/domain/types/branch.types'
  import { branchApi } from '$lib/infrastructure/api/branch.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let branches = $state<FrontendBranch[]>([])
  let form = $state({
    name: '',
    email: '',
    password: '',
    phone: '',
    branchId: ''
  })
  let errors = $state<Record<string, string>>({})
  let showPassword = $state(false)
  let branchOptions = $derived(
    branches.map(b => ({
      value: b.id,
      label: `${b.name}${b.city ? ` - ${b.city}` : ''}`
    }))
  )

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
    if (!validate()) {
      return
    }

    try {
      await authStore.register(form)
      notify.success('Pendaftaran berhasil. Silakan login dengan akun baru Anda.')
      setTimeout(() => {
        void goto('/login')
      }, 800)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Pendaftaran gagal diproses')
    }
  }
</script>

<section class="mx-auto max-w-2xl rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
  <div class="flex flex-wrap items-center gap-2 mb-2">
    <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
      Daftar Murid Baru
    </span>
  </div>
  <h1 class="text-3xl font-black uppercase tracking-tight text-black">Buat akun belajar Anda</h1>
  <p class="mt-2 text-sm font-bold text-black/60">Lengkapi data berikut untuk bergabung dan mulai akses dashboard murid.</p>

  <div class="mt-8 grid gap-6 md:grid-cols-2">
    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Nama Lengkap</label>
      <input
        bind:value={form.name}
        class={`mt-2 w-full rounded-xl border-[3px] px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.name ? 'border-neo-red' : 'border-black'}`}
        placeholder="Nama lengkap Anda..."
      />
      {#if errors.name}
        <span class="mt-2 block text-xs font-bold text-neo-red">{errors.name}</span>
      {/if}
    </div>

    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Email</label>
      <input
        type="email"
        bind:value={form.email}
        class={`mt-2 w-full rounded-xl border-[3px] px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.email ? 'border-neo-red' : 'border-black'}`}
        placeholder="email@example.com"
      />
      {#if errors.email}
        <span class="mt-2 block text-xs font-bold text-neo-red">{errors.email}</span>
      {/if}
    </div>

    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Password</label>
      <div class="relative mt-2">
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={form.password}
          class={`w-full rounded-xl border-[3px] pl-4 pr-12 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.password ? 'border-neo-red' : 'border-black'}`}
          placeholder="Minimal 8 karakter"
        />
        <button
          type="button"
          onclick={() => (showPassword = !showPassword)}
          class="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 hover:text-black focus:outline-none"
          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {#if showPassword}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          {/if}
        </button>
      </div>
      {#if errors.password}
        <span class="mt-2 block text-xs font-bold text-neo-red">{errors.password}</span>
      {/if}
    </div>

    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Nomor HP</label>
      <input
        bind:value={form.phone}
        class={`mt-2 w-full rounded-xl border-[3px] px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.phone ? 'border-neo-red' : 'border-black'}`}
        placeholder="0812xxxxxxxx"
      />
      {#if errors.phone}
        <span class="mt-2 block text-xs font-bold text-neo-red">{errors.phone}</span>
      {/if}
    </div>

    <div class="md:col-span-2">
      <label class="block text-xs font-black text-black uppercase tracking-wider">Cabang Terdekat</label>
      <Select
        options={branchOptions}
        bind:value={form.branchId}
        placeholder="Pilih Cabang"
        searchable={true}
        error={!!errors.branchId}
        class="mt-2"
      />
      {#if errors.branchId}
        <span class="mt-2 block text-xs font-bold text-neo-red">{errors.branchId}</span>
      {/if}
    </div>
  </div>

  <div class="mt-8 space-y-4">
    <button
      type="button"
      class="w-full rounded-xl border-[3px] border-black bg-neo-yellow px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none"
      onclick={handleSubmit}
      disabled={authStore.isLoading}
    >
      {authStore.isLoading ? 'Memproses...' : 'Daftar Sekarang'}
    </button>
  </div>
</section>
