<!--
Tujuan: Menyediakan halaman kelola seluruh pengguna sistem (admin, guru, murid) untuk super admin.
Caller: Route `/superadmin/pengguna`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: CRUD pengguna global secara interaktif dengan modal dan reload state.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/state'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  // Search & Filter state
  let searchQuery = $state(page.url.searchParams.get('q') ?? '')
  let selectedRoleFilter = $state(page.url.searchParams.get('role') ?? '')
  let selectedBranchFilter = $state(page.url.searchParams.get('branchId') ?? '')

  // Modal states
  let isAddModalOpen = $state(false)
  let isEditModalOpen = $state(false)
  let selectedUser = $state<any>(null)
  let isLoading = $state(false)
  let errorMsg = $state<string | null>(null)

  // Form states
  let name = $state('')
  let email = $state('')
  let password = $state('')
  let phone = $state('')
  let role = $state<'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'TEACHER' | 'STUDENT'>('STUDENT')
  let branchId = $state<string>('')
  let isActive = $state(true)

  const handleSearch = (e: SubmitEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (searchQuery) url.searchParams.set('q', searchQuery)
    else url.searchParams.delete('q')

    if (selectedRoleFilter) url.searchParams.set('role', selectedRoleFilter)
    else url.searchParams.delete('role')

    if (selectedBranchFilter) url.searchParams.set('branchId', selectedBranchFilter)
    else url.searchParams.delete('branchId')

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
    role = 'STUDENT'
    branchId = data.branches[0]?.id ?? ''
    isActive = true
    errorMsg = null
    isAddModalOpen = true
  }

  const openEditModal = (userObj: any) => {
    selectedUser = userObj
    name = userObj.name
    email = userObj.email
    password = ''
    phone = userObj.phone ?? ''
    role = userObj.role
    branchId = userObj.branchId ?? ''
    isActive = userObj.isActive
    errorMsg = null
    isEditModalOpen = true
  }

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const body: any = {
        name,
        email,
        password,
        phone,
        role,
        branchId: role === 'SUPER_ADMIN' ? null : branchId
      }

      const res = await fetch(`${apiBaseUrl}/superadmin/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menambahkan pengguna')
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
      const body: any = {
        name,
        email,
        phone,
        role,
        branchId: role === 'SUPER_ADMIN' ? null : branchId,
        isActive
      }
      if (password) body.password = password

      const res = await fetch(`${apiBaseUrl}/superadmin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui pengguna')
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
    if (!confirm('Apakah Anda yakin ingin menonaktifkan pengguna ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/users/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menonaktifkan pengguna')
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
    <div class="w-4 bg-neo-stripes-pink border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-pink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Pengguna
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Pengguna</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Daftar seluruh akun super admin, admin cabang, guru, dan murid di sistem.</p>
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
          Tambah Pengguna
        </button>
      </div>
    </div>
  </div>

  <!-- Search & Filters -->
  <form onsubmit={handleSearch} class="grid gap-3 sm:grid-cols-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Cari nama/email..."
      class="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0 sm:col-span-2"
    />

    <select
      bind:value={selectedRoleFilter}
      class="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0"
    >
      <option value="">Semua Peran</option>
      <option value="SUPER_ADMIN">Super Admin</option>
      <option value="BRANCH_ADMIN">Admin Cabang</option>
      <option value="TEACHER">Guru</option>
      <option value="STUDENT">Murid</option>
    </select>

    <select
      bind:value={selectedBranchFilter}
      class="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0"
    >
      <option value="">Semua Cabang</option>
      {#each data.branches as branch}
        <option value={branch.id}>{branch.name} ({branch.code})</option>
      {/each}
    </select>

    <button
      type="submit"
      class="rounded-xl border-2 border-black bg-neo-yellow px-6 py-3 text-sm font-extrabold uppercase text-black shadow-solid hover:-translate-y-0.5 active:translate-y-0 transition-transform sm:col-span-4"
    >
      Cari & Filter
    </button>
  </form>

  <!-- Table -->
  <div class="overflow-x-auto rounded-2xl border-4 border-black bg-white shadow-solid">
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b-4 border-black bg-slate-100 text-xs font-black uppercase tracking-wider text-black">
          <th class="px-6 py-4">Nama</th>
          <th class="px-6 py-4">Email</th>
          <th class="px-6 py-4">Peran</th>
          <th class="px-6 py-4">Cabang</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y-2 divide-black/10">
        {#if !data.users.items || data.users.items.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-8 text-center text-ink/50 font-bold">
              Tidak ada data pengguna terdaftar.
            </td>
          </tr>
        {:else}
          {#each data.users.items as user}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-black text-ink">{user.name}</td>
              <td class="px-6 py-4 text-ink/75 font-semibold">{user.email}</td>
              <td class="px-6 py-4 font-black text-xs text-black/60 uppercase">{user.role}</td>
              <td class="px-6 py-4 text-ink/75 font-semibold">
                {#if user.role === 'SUPER_ADMIN'}
                  <span class="text-ink/40 font-mono">- Global -</span>
                {:else}
                  {data.branches.find((b: any) => b.id === user.branchId)?.name ?? 'Tidak Ada Cabang'}
                {/if}
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded border border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-solid-sm {user.isActive
                    ? 'bg-neo-green text-black'
                    : 'bg-neo-red text-white'}"
                >
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onclick={() => openEditModal(user)}
                    class="rounded-lg border-2 border-black bg-neo-yellow px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onclick={() => handleDelete(user.id)}
                    class="rounded-lg border-2 border-black bg-neo-red px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
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
  {#if data.users && data.users.totalPages > 1}
    <div class="flex items-center justify-between px-6 py-4 rounded-2xl border-4 border-black bg-white shadow-solid">
      <div class="text-xs font-extrabold uppercase tracking-wider text-black">
        Menampilkan halaman {data.users.page} dari {data.users.totalPages} ({data.users.total} pengguna)
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          disabled={data.users.page <= 1}
          onclick={() => handlePageChange(data.users.page - 1)}
          class="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          disabled={data.users.page >= data.users.totalPages}
          onclick={() => handlePageChange(data.users.page + 1)}
          class="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Modal: Add User -->
{#if isAddModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Tambah Pengguna Baru</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Daftarkan akun sistem baru.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Lengkap</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Email</label>
          <input
            type="email"
            required
            bind:value={email}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Password</label>
          <input
            type="password"
            required
            bind:value={password}
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
          <label class="block text-xs font-black text-black uppercase">Peran Sistem</label>
          <select
            bind:value={role}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BRANCH_ADMIN">Admin Cabang</option>
            <option value="TEACHER">Guru</option>
            <option value="STUDENT">Murid</option>
          </select>
        </div>

        {#if role !== 'SUPER_ADMIN'}
          <div>
            <label class="block text-xs font-black text-black uppercase">Tugaskan Cabang</label>
            <select
              bind:value={branchId}
              class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
            >
              {#each data.branches as branch}
                <option value={branch.id}>{branch.name} ({branch.code})</option>
              {/each}
            </select>
          </div>
        {/if}

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

<!-- Modal: Edit User -->
{#if isEditModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Perbarui Pengguna</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Edit detail profil, peran, & cabang pengguna.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Lengkap</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Email</label>
          <input
            type="email"
            required
            bind:value={email}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Password Baru (Opsional)</label>
          <input
            type="password"
            bind:value={password}
            placeholder="Biarkan kosong jika tidak diganti"
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
          <label class="block text-xs font-black text-black uppercase">Peran Sistem</label>
          <select
            bind:value={role}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BRANCH_ADMIN">Admin Cabang</option>
            <option value="TEACHER">Guru</option>
            <option value="STUDENT">Murid</option>
          </select>
        </div>

        {#if role !== 'SUPER_ADMIN'}
          <div>
            <label class="block text-xs font-black text-black uppercase">Tugaskan Cabang</label>
            <select
              bind:value={branchId}
              class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
            >
              {#each data.branches as branch}
                <option value={branch.id}>{branch.name} ({branch.code})</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-is-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
          />
          <label for="checkbox-is-active" class="text-sm font-extrabold uppercase text-ink">Akun Aktif</label>
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
