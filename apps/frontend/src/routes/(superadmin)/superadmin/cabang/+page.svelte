<!--
Tujuan: Menyediakan halaman kelola seluruh cabang untuk super admin.
Caller: Route `/superadmin/cabang`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: CRUD cabang se-nasional secara interaktif dengan modal dan reload state.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  // Modal states
  let isAddModalOpen = $state(false)
  let isEditModalOpen = $state(false)
  let selectedBranch = $state<any>(null)
  let isLoading = $state(false)
  let errorMsg = $state<string | null>(null)

  // Form states
  let name = $state('')
  let code = $state('')
  let address = $state('')
  let city = $state('')
  let phone = $state('')
  let isActive = $state(true)

  const openAddModal = () => {
    name = ''
    code = ''
    address = ''
    city = ''
    phone = ''
    isActive = true
    errorMsg = null
    isAddModalOpen = true
  }

  const openEditModal = (branch: any) => {
    selectedBranch = branch
    name = branch.name
    code = branch.code
    address = branch.address ?? ''
    city = branch.city ?? ''
    phone = branch.phone ?? ''
    isActive = branch.isActive
    errorMsg = null
    isEditModalOpen = true
  }

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/branches`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name, code, address, city, phone, isActive })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menambahkan cabang')
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
      const res = await fetch(`${apiBaseUrl}/superadmin/branches/${selectedBranch.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name, code, address, city, phone, isActive })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui cabang')
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
    if (!confirm('Apakah Anda yakin ingin menghapus cabang ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/branches/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus cabang')
      }

      await invalidateAll()
    } catch (err: any) {
      alert(err.message)
    }
  }
</script>

<div class="space-y-6">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Cabang
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Cabang</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Daftar seluruh unit operasional bimbingan belajar se-nasional.</p>
      </div>
      <div>
        <button
          type="button"
          onclick={openAddModal}
          class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Cabang
        </button>
      </div>
    </div>
  </div>

  <!-- Branch Table -->
  <div class="overflow-x-auto rounded-2xl border-4 border-black bg-white shadow-solid">
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b-4 border-black bg-slate-100 text-xs font-black uppercase tracking-wider text-black">
          <th class="px-6 py-4">Kode</th>
          <th class="px-6 py-4">Nama Cabang</th>
          <th class="px-6 py-4">Kota</th>
          <th class="px-6 py-4">No Telepon</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y-2 divide-black/10">
        {#if data.branches.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-8 text-center text-ink/50 font-bold">
              Tidak ada data cabang terdaftar.
            </td>
          </tr>
        {:else}
          {#each data.branches as branch}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-mono font-black text-ink">{branch.code}</td>
              <td class="px-6 py-4 font-black text-ink">{branch.name}</td>
              <td class="px-6 py-4 text-ink/75 font-bold">{branch.city ?? '-'}</td>
              <td class="px-6 py-4 text-ink/75 font-bold">{branch.phone ?? '-'}</td>
              <td class="px-6 py-4">
                <span
                  class="rounded border border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-solid-sm {branch.isActive
                    ? 'bg-neo-green text-black'
                    : 'bg-neo-red text-white'}"
                >
                  {branch.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onclick={() => openEditModal(branch)}
                    class="rounded-lg border-2 border-black bg-neo-yellow px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onclick={() => handleDelete(branch.id)}
                    class="rounded-lg border-2 border-black bg-neo-red px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal: Add Branch -->
{#if isAddModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Tambah Cabang Baru</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Buat cabang bimbel baru secara global.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Cabang</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Kode Cabang</label>
          <input
            type="text"
            required
            bind:value={code}
            placeholder="Contoh: BDG01, JKT02"
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Kota</label>
          <input
            type="text"
            bind:value={city}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">No Telepon</label>
          <input
            type="tel"
            bind:value={phone}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Alamat Lengkap</label>
          <textarea
            bind:value={address}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          ></textarea>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isAddModalOpen = false)}
            class="w-1/2 rounded-xl border-2 border-black bg-slate-100 px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-2 border-black bg-neo-green px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal: Edit Branch -->
{#if isEditModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Perbarui Cabang</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Ubah detail data dan status operasional cabang.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Cabang</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Kode Cabang</label>
          <input
            type="text"
            required
            bind:value={code}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Kota</label>
          <input
            type="text"
            bind:value={city}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">No Telepon</label>
          <input
            type="tel"
            bind:value={phone}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Alamat Lengkap</label>
          <textarea
            bind:value={address}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          ></textarea>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-is-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
          />
          <label for="checkbox-is-active" class="text-sm font-extrabold uppercase text-ink">Cabang Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditModalOpen = false)}
            class="w-1/2 rounded-xl border-2 border-black bg-slate-100 px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-2 border-black bg-neo-green px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
