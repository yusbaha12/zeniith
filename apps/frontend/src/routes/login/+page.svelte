<!--
Tujuan: Menyediakan halaman login fase 1 dengan validasi inline dan redirect berdasarkan role.
Caller: Route publik `/login`.
Dependensi: Auth store, helper redirect role, dan toast notification.
Main Functions: Menangani input login, tampilkan error inline, arahkan user ke dashboard yang sesuai, dan kirim feedback via toast.
Side Effects: Melakukan login ke backend, memicu navigasi browser saat berhasil, dan menampilkan toast notification.
-->

<script lang="ts">
  import { goto } from '$app/navigation'

  import { authStore } from '$lib/application/stores/auth.store.svelte'
  import { getDashboardPathByRole } from '$lib/domain/types/user.types'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let form = $state({
    email: '',
    password: ''
  })
  let errors = $state<Record<string, string>>({})
  let showPassword = $state(false)
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
    if (!validate()) {
      return
    }

    try {
      const result = await authStore.login(form)
      notify.success('Login berhasil. Mengarahkan ke dashboard...')
      await goto(getDashboardPathByRole(result.user.role))
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Login gagal diproses')
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

    <div class="block">
      <span class="mb-2 block text-sm font-extrabold uppercase text-black">Password</span>
      <div class="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={form.password}
          class={`w-full rounded-lg border-4 pl-4 pr-12 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${errors.password ? 'border-neo-red' : 'border-black'}`}
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
        <span class="mt-2 block text-sm font-bold text-neo-red">{errors.password}</span>
      {/if}
    </div>

    <button
      type="button"
      class="w-full rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
      onclick={handleSubmit}
      disabled={authStore.isLoading}
    >
      {authStore.isLoading ? 'Memproses...' : 'Masuk'}
    </button>
    <p class="text-sm font-semibold text-black">
      Belum punya akun?
      <a href="/daftar" class="font-extrabold text-neo-blue underline">Daftar sekarang</a>
    </p>
  </div>
</section>
