<!--
Tujuan: Menyediakan halaman kelola paket belajar (reguler, intensif, premium) untuk super admin.
Caller: Route `/superadmin/paket`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: CRUD paket secara interaktif dengan modal dan reload state.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  // Modal states
  let isAddModalOpen = $state(false)
  let isEditModalOpen = $state(false)
  let selectedPackage = $state<any>(null)
  let isLoading = $state(false)
  let errorMsg = $state<string | null>(null)

  // Feature Modal states
  let isFeatureModalOpen = $state(false)
  let packageFeaturesList = $state<any[]>([])
  let isFeatureLoading = $state(false)
  let featureErrorMsg = $state<string | null>(null)

  // Feature Form states
  let editingFeatureId = $state<string | null>(null)
  let featureTitle = $state('')
  let featureDescription = $state('')
  let featureSortOrder = $state<number>(0)

  // Curriculum Modal states
  let isCurriculumModalOpen = $state(false)
  let allSubjectsList = $state<{ id: string; name: string; description?: string | null }[]>([])
  let mappedSubjectIds = $state<Set<string>>(new Set())
  let isCurriculumLoading = $state(false)
  let curriculumErrorMsg = $state<string | null>(null)
  let curriculumSuccessMsg = $state<string | null>(null)

  // Form states
  let name = $state('')
  let type = $state<'REGULER' | 'INTENSIF' | 'PREMIUM'>('REGULER')
  let description = $state('')
  let price = $state<number>(100000)
  let durationDays = $state<number>(30)
  let isActive = $state(true)
  let sortOrder = $state<number>(0)

  const openAddModal = () => {
    name = ''
    type = 'REGULER'
    description = ''
    price = 100000
    durationDays = 30
    isActive = true
    sortOrder = 0
    errorMsg = null
    isAddModalOpen = true
  }

  const openEditModal = (pkg: any) => {
    selectedPackage = pkg
    name = pkg.name
    type = pkg.type
    description = pkg.description ?? ''
    price = pkg.price?.amount ?? pkg.price ?? 0
    durationDays = pkg.durationDays
    isActive = pkg.isActive
    sortOrder = pkg.sortOrder ?? 0
    errorMsg = null
    isEditModalOpen = true
  }

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/packages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name, type, description, price, durationDays, isActive, sortOrder })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menambahkan paket')
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
      const res = await fetch(`${apiBaseUrl}/superadmin/packages/${selectedPackage.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name, type, description, price, durationDays, isActive, sortOrder })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui paket')
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
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/packages/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus paket')
      }

      await invalidateAll()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const loadFeatures = async (packageId: string) => {
    isFeatureLoading = true
    featureErrorMsg = null
    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/packages/${packageId}/features`)
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memuat fitur paket')
      }
      packageFeaturesList = (result.data || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    } catch (err: any) {
      featureErrorMsg = err.message
    } finally {
      isFeatureLoading = false
    }
  }

  const openFeatureModal = async (pkg: any) => {
    selectedPackage = pkg
    editingFeatureId = null
    featureTitle = ''
    featureDescription = ''
    featureSortOrder = 0
    isFeatureModalOpen = true
    await loadFeatures(pkg.id)
  }

  const startEditFeature = (feature: any) => {
    editingFeatureId = feature.id
    featureTitle = feature.title
    featureDescription = feature.description ?? ''
    featureSortOrder = feature.sortOrder
  }

  const cancelEditFeature = () => {
    editingFeatureId = null
    featureTitle = ''
    featureDescription = ''
    featureSortOrder = 0
  }

  const handleSubmitFeature = async (e: SubmitEvent) => {
    e.preventDefault()
    isFeatureLoading = true
    featureErrorMsg = null

    try {
      let res;
      if (editingFeatureId) {
        res = await fetch(`${apiBaseUrl}/superadmin/packages/features/${editingFeatureId}`, {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            title: featureTitle,
            description: featureDescription || null,
            sortOrder: featureSortOrder
          })
        })
      } else {
        res = await fetch(`${apiBaseUrl}/superadmin/packages/${selectedPackage.id}/features`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            title: featureTitle,
            description: featureDescription || null,
            sortOrder: featureSortOrder
          })
        })
      }

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan fitur paket')
      }

      // Reset form & reload list
      editingFeatureId = null
      featureTitle = ''
      featureDescription = ''
      featureSortOrder = 0
      await loadFeatures(selectedPackage.id)
    } catch (err: any) {
      featureErrorMsg = err.message
    } finally {
      isFeatureLoading = false
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fitur ini?')) return
    isFeatureLoading = true
    featureErrorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/packages/features/${featureId}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus fitur paket')
      }

      await loadFeatures(selectedPackage.id)
    } catch (err: any) {
      featureErrorMsg = err.message
    } finally {
      isFeatureLoading = false
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const openCurriculumModal = async (pkg: any) => {
    selectedPackage = pkg
    curriculumErrorMsg = null
    curriculumSuccessMsg = null
    isCurriculumModalOpen = true
    isCurriculumLoading = true

    try {
      // Load all subjects and mapped subjects in parallel
      const [subjectsRes, mappedRes] = await Promise.all([
        fetch(`${apiBaseUrl}/superadmin/subjects`),
        fetch(`${apiBaseUrl}/superadmin/packages/${pkg.id}/subjects`)
      ])
      const subjectsData = await subjectsRes.json()
      const mappedData = await mappedRes.json()

      allSubjectsList = (subjectsData.data || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      mappedSubjectIds = new Set(mappedData.data || [])
    } catch (err: any) {
      curriculumErrorMsg = 'Gagal memuat data kurikulum'
    } finally {
      isCurriculumLoading = false
    }
  }

  const toggleSubject = (subjectId: string) => {
    const next = new Set(mappedSubjectIds)
    if (next.has(subjectId)) {
      next.delete(subjectId)
    } else {
      next.add(subjectId)
    }
    mappedSubjectIds = next
  }

  const handleSaveCurriculum = async () => {
    isCurriculumLoading = true
    curriculumErrorMsg = null
    curriculumSuccessMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/packages/${selectedPackage.id}/subjects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectIds: [...mappedSubjectIds] })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan kurikulum paket')
      }

      curriculumSuccessMsg = 'Kurikulum paket berhasil disimpan!'
      setTimeout(() => { curriculumSuccessMsg = null }, 3000)
    } catch (err: any) {
      curriculumErrorMsg = err.message
    } finally {
      isCurriculumLoading = false
    }
  }
</script>


<div class="space-y-6">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-green border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-green px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Paket Belajar
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Paket Belajar</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Atur paket langganan dan harga akses ruang belajar siswa.</p>
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
          Tambah Paket
        </button>
      </div>
    </div>
  </div>

  <!-- Package Table -->
  <div class="overflow-x-auto rounded-2xl border-4 border-black bg-white shadow-solid">
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b-4 border-black bg-slate-100 text-xs font-black uppercase tracking-wider text-black">
          <th class="px-6 py-4">Urutan</th>
          <th class="px-6 py-4">Nama Paket</th>
          <th class="px-6 py-4">Tipe</th>
          <th class="px-6 py-4">Harga</th>
          <th class="px-6 py-4">Durasi</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y-2 divide-black/10">
        {#if data.packages.length === 0}
          <tr>
            <td colspan="7" class="px-6 py-8 text-center text-ink/50 font-bold">
              Tidak ada data paket terdaftar.
            </td>
          </tr>
        {:else}
          {#each data.packages as pkg}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-ink/50">{pkg.sortOrder}</td>
              <td class="px-6 py-4 font-black text-ink">{pkg.name}</td>
              <td class="px-6 py-4">
                <span class="rounded border-2 border-black bg-neo-cyan/15 px-2.5 py-0.5 text-xs font-black text-black">{pkg.type}</span>
              </td>
              <td class="px-6 py-4 font-extrabold text-ink">
                {formatRupiah(pkg.price?.amount ?? pkg.price ?? 0)}
              </td>
              <td class="px-6 py-4 text-ink/75 font-bold">{pkg.durationDays} Hari</td>
              <td class="px-6 py-4">
                <span
                  class="rounded border border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-solid-sm {pkg.isActive
                    ? 'bg-neo-green text-black'
                    : 'bg-neo-red text-white'}"
                >
                  {pkg.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    onclick={() => openFeatureModal(pkg)}
                    class="rounded-lg border-2 border-black bg-neo-blue px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Fitur
                  </button>
                  <button
                    type="button"
                    onclick={() => openCurriculumModal(pkg)}
                    class="rounded-lg border-2 border-black bg-neo-purple px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Kurikulum
                  </button>
                  <button
                    type="button"
                    onclick={() => openEditModal(pkg)}
                    class="rounded-lg border-2 border-black bg-neo-yellow px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onclick={() => handleDelete(pkg.id)}
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

<!-- Modal: Add Package -->
{#if isAddModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Tambah Paket Baru</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Buat paket akses belajar baru.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Paket</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Tipe Paket</label>
          <select
            bind:value={type}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          >
            <option value="REGULER">Reguler</option>
            <option value="INTENSIF">Intensif</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Harga (Rupiah)</label>
          <input
            type="number"
            required
            bind:value={price}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Durasi Akses (Hari)</label>
          <input
            type="number"
            required
            bind:value={durationDays}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Urutan Tampilan</label>
          <input
            type="number"
            required
            bind:value={sortOrder}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Deskripsi</label>
          <textarea
            bind:value={description}
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

<!-- Modal: Edit Package -->
{#if isEditModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Perbarui Paket</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Edit detail paket belajar.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdate} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Paket</label>
          <input
            type="text"
            required
            bind:value={name}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Tipe Paket</label>
          <select
            bind:value={type}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          >
            <option value="REGULER">Reguler</option>
            <option value="INTENSIF">Intensif</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Harga (Rupiah)</label>
          <input
            type="number"
            required
            bind:value={price}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Durasi Akses (Hari)</label>
          <input
            type="number"
            required
            bind:value={durationDays}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Urutan Tampilan</label>
          <input
            type="number"
            required
            bind:value={sortOrder}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase">Deskripsi</label>
          <textarea
            bind:value={description}
            class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
          ></textarea>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-is-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0"
          />
          <label for="checkbox-is-active" class="text-sm font-extrabold uppercase text-ink">Paket Aktif</label>
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

<!-- Modal: Kelola Fitur Paket -->
{#if isFeatureModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="w-full max-w-4xl rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
      
      <!-- Left Column: Form to Add/Edit Feature -->
      <div class="w-full md:w-5/12 flex flex-col justify-between">
        <div>
          <h2 class="text-2xl font-black uppercase text-ink">
            {editingFeatureId ? 'Edit Fitur' : 'Tambah Fitur'}
          </h2>
          <p class="mt-1 text-xs font-bold text-ink/50">
            {editingFeatureId ? 'Ubah rincian fitur paket.' : 'Masukkan rincian baru yang akan didapat siswa.'}
          </p>

          {#if featureErrorMsg}
            <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
              {featureErrorMsg}
            </div>
          {/if}

          <form onsubmit={handleSubmitFeature} class="mt-6 space-y-4">
            <div>
              <label class="block text-xs font-black text-black uppercase">Nama Fitur / Benefit</label>
              <input
                type="text"
                required
                placeholder="Contoh: Akses 20+ Tryout Akbar"
                bind:value={featureTitle}
                class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
              />
            </div>

            <div>
              <label class="block text-xs font-black text-black uppercase">Deskripsi Singkat (Opsional)</label>
              <textarea
                placeholder="Contoh: Pembahasan soal video & pdf lengkap"
                bind:value={featureDescription}
                class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
                rows="3"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-black text-black uppercase">Urutan Tampilan</label>
              <input
                type="number"
                required
                bind:value={featureSortOrder}
                class="mt-1 w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
              />
            </div>

            <div class="pt-4 flex gap-2">
              {#if editingFeatureId}
                <button
                  type="button"
                  onclick={cancelEditFeature}
                  class="w-1/2 rounded-xl border-2 border-black bg-slate-100 px-4 py-3 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Batal
                </button>
              {/if}
              <button
                type="submit"
                disabled={isFeatureLoading}
                class="{editingFeatureId ? 'w-1/2' : 'w-full'} rounded-xl border-2 border-black bg-neo-green px-4 py-3 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50"
              >
                {isFeatureLoading ? 'Menyimpan...' : (editingFeatureId ? 'Simpan' : 'Tambah Fitur')}
              </button>
            </div>
          </form>
        </div>

        <div class="mt-8 border-t-4 border-black pt-4">
          <button
            type="button"
            onclick={() => (isFeatureModalOpen = false)}
            class="w-full rounded-xl border-2 border-black bg-neo-yellow px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
          >
            Tutup Kelola Fitur
          </button>
        </div>
      </div>

      <!-- Right Column: List of Existing Features -->
      <div class="w-full md:w-7/12 border-t-4 md:border-t-0 md:border-l-4 border-black pt-8 md:pt-0 md:pl-8 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-black uppercase text-ink">Fitur Saat Ini</h3>
            <p class="text-xs font-bold text-ink/50">Daftar benefit pada paket {selectedPackage?.name}</p>
          </div>
          <span class="rounded-lg border-2 border-black bg-slate-100 px-3 py-1 font-mono text-xs font-extrabold">
            {packageFeaturesList.length} Item
          </span>
        </div>

        <div class="flex-grow overflow-y-auto max-h-[50vh] pr-2 space-y-4">
          {#if packageFeaturesList.length === 0}
            <div class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-black/20 rounded-xl bg-slate-50 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-black/35 mb-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408.097.007c.077.005.155.007.234.007a3.486 3.486 0 0 0 2.562-1.078M9.75 16.122l-.53.53a1.5 1.5 0 0 1-2.122-2.122l.53-.53" />
              </svg>
              <p class="text-sm font-bold text-ink/40">Belum ada rincian fitur.</p>
              <p class="text-xs font-bold text-ink/30 px-4">Gunakan form di samping untuk mulai menambahkan benefit paket.</p>
            </div>
          {:else}
            {#each packageFeaturesList as feat (feat.id)}
              <div class="rounded-xl border-2 border-black bg-white p-4 shadow-solid-sm flex items-start justify-between gap-4">
                <div class="flex-grow space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="inline-block rounded bg-slate-100 border border-black px-1.5 py-0.5 font-mono text-[10px] font-black text-black">
                      #{feat.sortOrder}
                    </span>
                    <h4 class="font-extrabold text-sm text-ink">{feat.title}</h4>
                  </div>
                  {#if feat.description}
                    <p class="text-xs text-ink/60 font-medium pl-8">{feat.description}</p>
                  {/if}
                </div>
                <div class="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onclick={() => startEditFeature(feat)}
                    class="rounded-md border border-black bg-neo-yellow px-2 py-1 text-[10px] font-black uppercase text-black hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onclick={() => handleDeleteFeature(feat.id)}
                    class="rounded-md border border-black bg-neo-red px-2 py-1 text-[10px] font-black uppercase text-white hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

    </div>
  </div>
{/if}

<!-- Modal: Kelola Kurikulum Paket -->
{#if isCurriculumModalOpen && selectedPackage}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="w-full max-w-lg rounded-2xl border-4 border-black bg-white shadow-solid-lg flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex-shrink-0 p-6 border-b-4 border-black">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-black uppercase text-ink">Kelola Kurikulum</h2>
            <p class="mt-1 text-xs font-bold text-ink/50">
              Pilih mata pelajaran yang termasuk dalam <span class="text-neo-purple font-black">{selectedPackage.name}</span>
            </p>
          </div>
          <button
            type="button"
            onclick={() => { isCurriculumModalOpen = false }}
            class="rounded-lg border-2 border-black bg-neo-red px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex-shrink-0"
          >
            ✕ Tutup
          </button>
        </div>

        {#if curriculumErrorMsg}
          <div class="mt-3 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
            {curriculumErrorMsg}
          </div>
        {/if}
        {#if curriculumSuccessMsg}
          <div class="mt-3 rounded-xl border-2 border-black bg-neo-green/30 p-3 text-xs font-bold text-black">
            ✓ {curriculumSuccessMsg}
          </div>
        {/if}
      </div>

      <!-- Subject Checklist -->
      <div class="flex-grow overflow-y-auto p-6">
        {#if isCurriculumLoading}
          <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-neo-purple"></div>
            <span class="ml-3 font-bold text-ink/60 text-sm">Memuat data kurikulum...</span>
          </div>
        {:else if allSubjectsList.length === 0}
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <span class="text-4xl">📚</span>
            <p class="text-sm font-bold text-ink/40 text-center">Belum ada mata pelajaran yang dibuat.<br>Buat terlebih dahulu di menu Kurikulum.</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each allSubjectsList as subject}
              {@const isChecked = mappedSubjectIds.has(subject.id)}
              <button
                type="button"
                onclick={() => toggleSubject(subject.id)}
                class="w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 {isChecked
                  ? 'border-black bg-neo-purple/10 shadow-solid-sm'
                  : 'border-black/30 bg-white hover:border-black'}"
              >
                <!-- Custom Checkbox -->
                <div class="flex-shrink-0 h-6 w-6 rounded-md border-2 border-black flex items-center justify-center transition-colors {isChecked ? 'bg-neo-purple' : 'bg-white'}">
                  {#if isChecked}
                    <span class="text-white text-sm font-black leading-none">✓</span>
                  {/if}
                </div>

                <!-- Subject Label -->
                <div class="flex-grow min-w-0">
                  <p class="font-extrabold text-sm text-ink truncate">{subject.name}</p>
                  {#if subject.description}
                    <p class="text-xs text-ink/50 font-medium truncate mt-0.5">{subject.description}</p>
                  {/if}
                </div>

                <!-- Active Badge -->
                {#if isChecked}
                  <span class="flex-shrink-0 rounded-md border border-black bg-neo-purple px-2 py-0.5 text-[10px] font-black uppercase text-white">Termasuk</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer Save Button -->
      {#if !isCurriculumLoading && allSubjectsList.length > 0}
        <div class="flex-shrink-0 p-6 border-t-4 border-black bg-gray-50 rounded-b-2xl">
          <div class="flex items-center justify-between gap-4">
            <p class="text-xs font-bold text-ink/50">
              {mappedSubjectIds.size} dari {allSubjectsList.length} mata pelajaran dipilih
            </p>
            <button
              type="button"
              onclick={handleSaveCurriculum}
              disabled={isCurriculumLoading}
              class="rounded-lg border-2 border-black bg-neo-purple px-5 py-2 text-sm font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50"
            >
              {isCurriculumLoading ? 'Menyimpan...' : '💾 Simpan Kurikulum'}
            </button>
          </div>
        </div>
      {/if}

    </div>
  </div>
{/if}
