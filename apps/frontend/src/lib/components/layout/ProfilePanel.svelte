<!--
Tujuan: Menyediakan panel profil seragam untuk update profil dan password pada semua role.
Caller: Halaman profil student, teacher, admin, dan superadmin.
Dependensi: Auth API dan tipe user frontend.
Main Functions: Menampilkan form profil, validasi inline, submit update profil, dan submit ganti password.
Side Effects: Melakukan HTTP call PATCH `/api/me` dan `/api/me/password`.
-->

<script lang="ts">
  import type { FrontendUser } from '$lib/domain/types/user.types'
  import { authApi } from '$lib/infrastructure/api/auth.api'
  import { authStore } from '$lib/application/stores/auth.store.svelte'

  let { user } = $props<{ user: FrontendUser }>()

  let profileForm = $state({
    name: '',
    phone: ''
  })
  let passwordForm = $state({
    currentPassword: '',
    newPassword: ''
  })
  let profileErrors = $state<Record<string, string>>({})
  let passwordErrors = $state<Record<string, string>>({})
  let profileMessage = $state<string | null>(null)
  let passwordMessage = $state<string | null>(null)

  $effect(() => {
    profileForm.name = user.name
    profileForm.phone = user.phone ?? ''
  })

  const validateProfile = () => {
    profileErrors = {}

    if (profileForm.name.trim().length < 2) {
      profileErrors.name = 'Nama minimal 2 karakter'
    }

    if (profileForm.phone.trim().length < 10) {
      profileErrors.phone = 'Nomor HP minimal 10 digit'
    }

    return Object.keys(profileErrors).length === 0
  }

  const validatePassword = () => {
    passwordErrors = {}

    if (passwordForm.currentPassword.length < 8) {
      passwordErrors.currentPassword = 'Password saat ini minimal 8 karakter'
    }

    if (passwordForm.newPassword.length < 8) {
      passwordErrors.newPassword = 'Password baru minimal 8 karakter'
    }

    return Object.keys(passwordErrors).length === 0
  }

  const submitProfile = async () => {
    profileMessage = null

    if (!validateProfile()) {
      return
    }

    const result = await authApi.updateProfile({
      name: profileForm.name,
      phone: profileForm.phone
    })

    authStore.hydrate(result)
    profileMessage = 'Profil berhasil diperbarui'
  }

  const submitPassword = async () => {
    passwordMessage = null

    if (!validatePassword()) {
      return
    }

    await authApi.updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })

    passwordForm = {
      currentPassword: '',
      newPassword: ''
    }
    passwordMessage = 'Password berhasil diperbarui'
  }
</script>

<div class="grid gap-6 xl:grid-cols-2">
  <section class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-md">
    <h2 class="text-xl font-extrabold uppercase text-black">Profil Saya</h2>
    <div class="mt-5 space-y-4">
      <label class="block">
        <span class="mb-2 block text-sm font-extrabold uppercase text-black">Nama</span>
        <input
          class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${profileErrors.name ? 'border-neo-red' : 'border-black'}`}
          bind:value={profileForm.name}
        />
        {#if profileErrors.name}
          <span class="mt-2 block text-sm font-bold text-neo-red">{profileErrors.name}</span>
        {/if}
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-extrabold uppercase text-black">Nomor HP</span>
        <input
          class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${profileErrors.phone ? 'border-neo-red' : 'border-black'}`}
          bind:value={profileForm.phone}
        />
        {#if profileErrors.phone}
          <span class="mt-2 block text-sm font-bold text-neo-red">{profileErrors.phone}</span>
        {/if}
      </label>

      <button class="rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none" onclick={submitProfile}>
        Simpan Profil
      </button>

      {#if profileMessage}
        <p class="text-sm font-bold text-neo-green">{profileMessage}</p>
      {/if}
    </div>
  </section>

  <section class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-md">
    <h2 class="text-xl font-extrabold uppercase text-black">Ganti Password</h2>
    <div class="mt-5 space-y-4">
      <label class="block">
        <span class="mb-2 block text-sm font-extrabold uppercase text-black">Password Saat Ini</span>
        <input
          type="password"
          class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${passwordErrors.currentPassword ? 'border-neo-red' : 'border-black'}`}
          bind:value={passwordForm.currentPassword}
        />
        {#if passwordErrors.currentPassword}
          <span class="mt-2 block text-sm font-bold text-neo-red">{passwordErrors.currentPassword}</span>
        {/if}
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-extrabold uppercase text-black">Password Baru</span>
        <input
          type="password"
          class={`w-full rounded-lg border-4 px-4 py-3 outline-none transition focus:border-neo-blue focus:shadow-solid-sm ${passwordErrors.newPassword ? 'border-neo-red' : 'border-black'}`}
          bind:value={passwordForm.newPassword}
        />
        {#if passwordErrors.newPassword}
          <span class="mt-2 block text-sm font-bold text-neo-red">{passwordErrors.newPassword}</span>
        {/if}
      </label>

      <button class="rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none" onclick={submitPassword}>
        Perbarui Password
      </button>

      {#if passwordMessage}
        <p class="text-sm font-bold text-neo-green">{passwordMessage}</p>
      {/if}
    </div>
  </section>
</div>
