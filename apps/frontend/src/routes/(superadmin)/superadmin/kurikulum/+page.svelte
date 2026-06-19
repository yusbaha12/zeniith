<!--
Tujuan: Menyediakan halaman kelola kurikulum global (mata pelajaran dan modul) untuk super admin.
Caller: Route `/superadmin/kurikulum`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: CRUD mata pelajaran dan modul secara terstruktur per subject.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  // Subject Modal states
  let isAddSubjModalOpen = $state(false)
  let isEditSubjModalOpen = $state(false)
  let selectedSubject = $state<any>(null)

  // Module Modal states
  let isAddModModalOpen = $state(false)
  let isEditModModalOpen = $state(false)
  let selectedModule = $state<any>(null)
  let parentSubjectIdForModule = $state('')

  let isLoading = $state(false)
  let errorMsg = $state<string | null>(null)

  // Common Form fields
  let name = $state('')
  let title = $state('')
  let description = $state('')
  let sortOrder = $state<number>(0)
  let isActive = $state(true)

  // Accordion open state per Subject ID
  let openSubjectId = $state<string | null>(null)

  const toggleAccordion = (id: string) => {
    openSubjectId = openSubjectId === id ? null : id
  }

  // SUBJECT ACTIONS
  const openAddSubject = () => {
    name = ''
    description = ''
    sortOrder = 0
    isActive = true
    errorMsg = null
    isAddSubjModalOpen = true
  }

  const openEditSubject = (subj: any) => {
    selectedSubject = subj
    name = subj.name
    description = subj.description ?? ''
    sortOrder = subj.sortOrder ?? 0
    isActive = subj.isActive
    errorMsg = null
    isEditSubjModalOpen = true
  }

  const handleCreateSubject = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder, isActive })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal membuat mata pelajaran')

      isAddSubjModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleUpdateSubject = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects/${selectedSubject.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder, isActive })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal memperbarui mata pelajaran')

      isEditSubjModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal menghapus mata pelajaran')

      await invalidateAll()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // MODULE ACTIONS
  const openAddModule = (subjectId: string) => {
    parentSubjectIdForModule = subjectId
    title = ''
    description = ''
    sortOrder = 0
    isActive = true
    errorMsg = null
    isAddModModalOpen = true
  }

  const openEditModule = (mod: any) => {
    selectedModule = mod
    title = mod.title
    description = mod.description ?? ''
    sortOrder = mod.sortOrder ?? 0
    isActive = mod.isActive
    errorMsg = null
    isEditModModalOpen = true
  }

  const handleCreateModule = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectId: parentSubjectIdForModule, title, description, sortOrder, isActive })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal membuat modul')

      isAddModModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleUpdateModule = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules/${selectedModule.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, description, sortOrder, isActive })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal memperbarui modul')

      isEditModModalOpen = false
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ini?')) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Gagal menghapus modul')

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
    <div class="w-4 bg-neo-stripes-yellow border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Kurikulum
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Kurikulum</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Atur mata pelajaran global serta modul-modul materi di dalamnya.</p>
      </div>
      <div>
        <button
          type="button"
          onclick={openAddSubject}
          class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Mapel
        </button>
      </div>
    </div>
  </div>

  <!-- Subjects Accordion List -->
  <div class="space-y-4">
    {#if data.subjects.length === 0}
      <div class="rounded-2xl border-4 border-black bg-white p-8 text-center text-ink/50 font-bold shadow-solid">
        Tidak ada data mata pelajaran terdaftar.
      </div>
    {:else}
      {#each data.subjects as subj}
        <div class="overflow-hidden rounded-2xl border-4 border-black bg-white shadow-solid">
          <!-- Accordion Header -->
          <div class="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
            <button
              type="button"
              onclick={() => toggleAccordion(subj.id)}
              class="flex flex-1 items-center gap-4 text-left outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="3"
                stroke="currentColor"
                class="h-5 w-5 text-black transition-transform {openSubjectId === subj.id ? 'rotate-90' : ''}"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <div>
                <h3 class="text-lg font-black uppercase text-ink">{subj.name}</h3>
                <p class="text-xs font-bold text-ink/50">{subj.description || 'Tidak ada deskripsi'}</p>
              </div>
            </button>

            <!-- Actions for Subject -->
            <div class="flex items-center gap-3">
              <span
                class="rounded border border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-solid-sm {subj.isActive
                  ? 'bg-neo-green text-black'
                  : 'bg-neo-red text-white'}"
              >
                {subj.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                onclick={() => openEditSubject(subj)}
                class="rounded-lg border-2 border-black bg-neo-yellow px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                Edit
              </button>
              <button
                type="button"
                onclick={() => handleDeleteSubject(subj.id)}
                class="rounded-lg border-2 border-black bg-neo-red px-3 py-1.5 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                Hapus
              </button>
            </div>
          </div>

          <!-- Accordion Content (Modules List) -->
          {#if openSubjectId === subj.id}
            <div class="border-t-4 border-black bg-slate-50 p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-black uppercase text-black">Daftar Modul Belajar</h4>
                <button
                  type="button"
                  onclick={() => openAddModule(subj.id)}
                  class="rounded-lg border-2 border-black bg-neo-green px-4 py-2 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  + Tambah Modul
                </button>
              </div>

              {#if subj.modules.length === 0}
                <p class="text-xs font-bold text-ink/40 py-4">Belum ada modul di dalam mata pelajaran ini.</p>
              {:else}
                <div class="divide-y-2 divide-black/10">
                  {#each subj.modules as mod}
                    <div class="flex items-center justify-between py-3">
                      <div>
                        <p class="font-black text-ink text-sm">{mod.title}</p>
                        <p class="text-xs font-bold text-ink/50">{mod.description || 'Tidak ada deskripsi'}</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <span
                          class="rounded border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-solid-sm {mod.isActive
                            ? 'bg-neo-green text-black'
                            : 'bg-neo-red text-white'}"
                        >
                          {mod.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button
                          type="button"
                          onclick={() => openEditModule(mod)}
                          class="rounded border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onclick={() => handleDeleteModule(mod.id)}
                          class="rounded border-2 border-black bg-neo-red px-3 py-1 text-xs font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<!-- Modal: Add Subject -->
{#if isAddSubjModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Tambah Mata Pelajaran</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Buat mata pelajaran baru di kurikulum global.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreateSubject} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Mata Pelajaran</label>
          <input
            type="text"
            required
            bind:value={name}
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
            onclick={() => (isAddSubjModalOpen = false)}
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

<!-- Modal: Edit Subject -->
{#if isEditSubjModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Perbarui Mata Pelajaran</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Edit detail mata pelajaran.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdateSubject} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Nama Mata Pelajaran</label>
          <input
            type="text"
            required
            bind:value={name}
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
            id="checkbox-subj-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
          />
          <label for="checkbox-subj-active" class="text-sm font-extrabold uppercase text-ink">Mapel Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditSubjModalOpen = false)}
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

<!-- Modal: Add Module -->
{#if isAddModModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Tambah Modul Baru</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Tambahkan modul ke mata pelajaran ini.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleCreateModule} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Judul Modul</label>
          <input
            type="text"
            required
            bind:value={title}
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
            onclick={() => (isAddModModalOpen = false)}
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

<!-- Modal: Edit Module -->
{#if isEditModModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg">
      <h2 class="text-2xl font-black uppercase text-ink">Perbarui Modul</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Edit detail modul belajar.</p>

      {#if errorMsg}
        <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleUpdateModule} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase">Judul Modul</label>
          <input
            type="text"
            required
            bind:value={title}
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
            id="checkbox-mod-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
          />
          <label for="checkbox-mod-active" class="text-sm font-extrabold uppercase text-ink">Modul Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditModModalOpen = false)}
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
