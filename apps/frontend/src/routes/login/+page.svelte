<!--
Tujuan: Menyediakan halaman login fase 1 dengan validasi inline dan redirect berdasarkan role.
Caller: Route publik `/login`.
Dependensi: Auth store dan helper redirect role.
Main Functions: Menangani input login, tampilkan error inline, dan arahkan user ke dashboard yang sesuai.
Side Effects: Melakukan login ke backend dan memicu navigasi browser saat berhasil.
-->

<script lang="ts">
  import { goto } from '$app/navigation'

  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import { getDashboardPathByRole } from '$lib/domain/types/user.types'

  let form = $state({
    email: '',
    password: ''
  })
  let errors = $state<Record<string, string>>({})
  let submitError = $state<string | null>(null)

  const validate = () => {
    errors = {}

    if (!form.email.includes('@')) {
      errors.email = 'Masukkan email yang valid'
    }

    if (form.password.length < 8) {
      errors.password = 'Password minimal 8 karakter'
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    submitError = null

    if (!validate()) {
      return
    }

    try {
      const result = await authStore.login(form)
      await goto(getDashboardPathByRole(result.user.role))
    } catch (error) {
      submitError = error instanceof Error ? error.message : 'Login gagal diproses'
    }
  }
</script>

<section class="mx-auto max-w-xl rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
  <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-neo-blue">Masuk</p>
  <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">Masuk ke akun LMS Bimbel</h1>
  <p class="mt-3 text-sm font-semibold leading-7 text-black">Gunakan email dan password akun Anda untuk melanjutkan belajar atau mengelola kelas.</p>

  <div class="mt-8 space-y-5">
    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Email</span>
      <input
        type="email"
        bind:value={form.email}
        class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.email ? 'border-neo-red' : 'border-black'}`}
      />
      {#if errors.email}
        <span class="mt-2 block text-sm text-red-600">{errors.email}</span>
      {/if}
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Password</span>
      <input
        type="password"
        bind:value={form.password}
        class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.password ? 'border-neo-red' : 'border-black'}`}
      />
      {#if errors.password}
        <span class="mt-2 block text-sm font-bold text-neo-red">{errors.password}</span>
      {/if}
    </label>

    <button
      type="button"
      class="w-full rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
      onclick={handleSubmit}
      disabled={authStore.isLoading}
    >
      {authStore.isLoading ? 'Memproses...' : 'Masuk'}
    </button>

    {#if submitError}
      <p class="text-sm font-bold text-neo-red">{submitError}</p>
    {/if}

    <p class="text-sm font-semibold text-black">
      Belum punya akun?
      <a href="/daftar" class="font-extrabold text-neo-blue underline">Daftar sekarang</a>
    </p>
  </div>
</section>
