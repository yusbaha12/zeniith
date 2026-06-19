<!--
Tujuan: Menyediakan halaman kelola murid cabang untuk admin cabang.
Caller: Route `/admin/murid`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: CRUD murid lokal cabang secara interaktif dengan modal dan reload state.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/state'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  // Search state
  let searchQuery = $state(page.url.searchParams.get('q') ?? '')

  // Modal states
  let isAddModalOpen = $state(false)
  let isEditModalOpen = $state(false)
  let selectedStudent = $state<any>(null)
  let isLoading = $state(false)
  let errorMsg = $state<string | null>(null)

  // Form states
  let name = $state('')
  let email = $state('')
  let password = $state('')
  let phone = $state('')
  let isActive = $state(true)

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (searchQuery) {
      url.searchParams.set('q', searchQuery)
    } else {
      url.searchParams.delete('q')
    }
    url.searchParams.set('page', '1')
    window.history.replaceState({}, '', url.toString())
    invalidateAll()
  }

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', newPage.toString())
    window.history.replaceState({}, '', url.toString())
    invalidateAll()
  }

  const openAddModal = () => {
    name = ''
    email = ''
    password = ''
    phone = ''
    errorMsg = null
    isAddModalOpen = true
  }

  const openEditModal = (student: any) => {
    selectedStudent = student
    name = student.name
    email = student.email
    password = ''
    phone = student.phone ?? ''
    isActive = student.isActive
    errorMsg = null
    isEditModalOpen = true
  }

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/admin/students`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menambahkan murid')
      }

      isAddModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleUpdate = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const body: any = { name, email, phone, isActive }
      if (password) body.password = password

      const res = await fetch(`${apiBaseUrl}/admin/students/${selectedStudent.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui murid')
      }

      isEditModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan murid ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/admin/students/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menonaktifkan murid')
      }

      await invalidateAll()
    } catch (err: any) {
      alert(err.message)
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="text-3xl font-extrabold uppercase tracking-tight text-black">Kelola Murid Cabang</h1>
      <p class="text-sm font-semibold text-black">Daftar seluruh murid yang terdaftar di cabang Anda.</p>
    </div>

    <div>
      <button
        type="button"
        onclick={openAddModal}
        class="inline-flex items-center gap-2 rounded-lg border-4 border-black bg-neo-yellow px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Tambah Murid
      </button>
    </div>
  </div>

  <!-- Search Filter -->
  <form onsubmit={handleSearch} class="flex gap-3">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Cari murid berdasarkan nama atau email..."
      class="w-full rounded-lg border-4 border-black bg-white px-4 py-3 text-sm font-bold text-black placeholder-black/50 outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
    />
    <button
      type="submit"
      class="rounded-lg border-4 border-black bg-neo-blue px-6 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      Cari
    </button>
  </form>

  <!-- Student Table -->
  <div class="overflow-x-auto rounded-xl border-4 border-black bg-white shadow-solid-lg">
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b-4 border-black bg-neo-yellow text-xs font-extrabold uppercase tracking-widest text-black">
          <th class="px-6 py-4">Nama</th>
          <th class="px-6 py-4">Email</th>
          <th class="px-6 py-4">No Telepon</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y-4 divide-black">
        {#if !data.students.items || data.students.items.length === 0}
          <tr>
            <td colspan="5" class="px-6 py-8 text-center font-bold text-black">
              Tidak ada data murid yang ditemukan.
            </td>
          </tr>
        {:else}
          {#each data.students.items as student}
            <tr class="hover:bg-neo-blue/10">
              <td class="px-6 py-4 font-extrabold uppercase text-black">{student.name}</td>
              <td class="px-6 py-4 font-bold text-black">{student.email}</td>
              <td class="px-6 py-4 font-bold text-black">{student.phone ?? '-'}</td>
              <td class="px-6 py-4">
                <span
                  class="rounded-md border-2 border-black px-2.5 py-0.5 text-xs font-extrabold uppercase {student.isActive
                    ? 'bg-neo-green text-black'
                    : 'bg-neo-red text-white'}"
                >
                  {student.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onclick={() => openEditModal(student)}
                    class="rounded-lg border-4 border-black bg-neo-yellow px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onclick={() => handleDelete(student.id)}
                    class="rounded-lg border-4 border-black bg-neo-red px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Nonaktifkan
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination Controls -->
  {#if data.students && data.students.totalPages > 1}
    <div class="flex items-center justify-between rounded-xl border-4 border-black bg-white px-6 py-4 shadow-solid-lg">
      <div class="text-xs font-bold text-black">
        Menampilkan halaman {data.students.page} dari {data.students.totalPages} ({data.students.total} murid)
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          disabled={data.students.page <= 1}
          onclick={() => handlePageChange(data.students.page - 1)}
          class="rounded-lg border-4 border-black bg-white px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm transition-transform disabled:opacity-50 disabled:pointer-events-none active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          disabled={data.students.page >= data.students.totalPages}
          onclick={() => handlePageChange(data.students.page + 1)}
          class="rounded-lg border-4 border-black bg-white px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm transition-transform disabled:opacity-50 disabled:pointer-events-none active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Modal: Add Student -->
{#if isAddModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-extrabold uppercase text-black">Daftarkan Murid Baru</h2>
      <p class="mt-1 text-xs font-bold text-black">Akun akan langsung aktif di cabang Anda.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-md border-2 border-black bg-neo-red p-3 text-xs font-bold text-white">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Nama Lengkap</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Email</label>
          <input
            type="email"
            required
            bind:value={email}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Password</label>
          <input
            type="password"
            required
            bind:value={password}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">No Telepon</label>
          <input
            type="tel"
            bind:value={phone}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isAddModalOpen = false)}
            class="w-1/2 rounded-lg border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-lg border-4 border-black bg-neo-yellow px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal: Edit Student -->
{#if isEditModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-extrabold uppercase text-black">Perbarui Murid</h2>
      <p class="mt-1 text-xs font-bold text-black">Edit detail profil dan status aktif murid.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-md border-2 border-black bg-neo-red p-3 text-xs font-bold text-white">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Nama Lengkap</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Email</label>
          <input
            type="email"
            required
            bind:value={email}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">Password Baru (Opsional)</label>
          <input
            type="password"
            bind:value={password}
            placeholder="Biarkan kosong jika tidak diganti"
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-extrabold uppercase text-black">No Telepon</label>
          <input
            type="tel"
            bind:value={phone}
            class="mt-1 w-full rounded-lg border-4 border-black px-4 py-3 text-sm font-bold outline-none transition focus:border-neo-blue focus:shadow-solid-sm"
          />
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-is-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-neo-blue"
          />
          <label for="checkbox-is-active" class="text-sm font-extrabold uppercase text-black">Akun Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditModalOpen = false)}
            class="w-1/2 rounded-lg border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-lg border-4 border-black bg-neo-yellow px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .text-mint-dark {
    color: #1b4d3e;
  }
</style>
