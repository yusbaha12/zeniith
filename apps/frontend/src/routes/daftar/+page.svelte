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
      <input
        type="password"
        bind:value={form.password}
        class={`mt-2 w-full rounded-xl border-[3px] px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5 ${errors.password ? 'border-neo-red' : 'border-black'}`}
        placeholder="Minimal 8 karakter"
      />
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
