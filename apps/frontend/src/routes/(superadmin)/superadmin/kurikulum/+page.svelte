<!--
Tujuan: Menyediakan halaman kelola kurikulum global (mata pelajaran dan modul) untuk super admin.
Caller: Route `/superadmin/kurikulum`.
Dependensi: Svelte 5 Runes, SvelteKit data, fetch API response helper, toast notification, dialog SweetAlert2, dan data guru.
Main Functions: CRUD mata pelajaran, assignment PIC guru, dan modul secara terstruktur per subject dengan feedback via toast dan konfirmasi dialog.
Side Effects: Melakukan HTTP call CRUD kurikulum, memicu reload data, menampilkan toast/dialog, dan menampilkan hint validasi inline pada form modal.
-->

<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { inlineValidationForm } from '$lib/actions/inline-validation-form'
  import { readApiData } from '$lib/infrastructure/api/response'
  import { dialog } from '$lib/infrastructure/dialog/dialog'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let { data } = $props()
  const teachers = $derived(data.teachers ?? [])

  // Search & Filter state
  let searchQuery = $state(page.url.searchParams.get('q') ?? '')
  let selectedStatusFilter = $state(page.url.searchParams.get('status') ?? '')
  const hasActiveFilters = $derived(Boolean(searchQuery || selectedStatusFilter))

  const statusFilterOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' }
  ]

  let filteredSubjects = $derived(
    data.subjects.filter((subj: any) => {
      const query = searchQuery.trim().toLowerCase()
      
      const matchesStatus = !selectedStatusFilter ||
        (selectedStatusFilter === 'active' && subj.isActive) ||
        (selectedStatusFilter === 'inactive' && !subj.isActive)

      if (!matchesStatus) return false

      const subjectMatchesSearch = !query ||
        subj.name.toLowerCase().includes(query) ||
        (subj.description && subj.description.toLowerCase().includes(query))

      const moduleMatchesSearch = subj.modules && subj.modules.some((mod: any) => 
        mod.title.toLowerCase().includes(query) ||
        (mod.description && mod.description.toLowerCase().includes(query))
      )

      return subjectMatchesSearch || moduleMatchesSearch
    }).map((subj: any) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return subj

      return {
        ...subj,
        modules: subj.modules.filter((mod: any) => 
          mod.title.toLowerCase().includes(query) ||
          (mod.description && mod.description.toLowerCase().includes(query))
        )
      }
    })
  )

  const syncFilters = async (url: URL) => {
    await goto(url, {
      replaceState: true,
      invalidateAll: false,
      noScroll: true
    })
  }

  const handleSearch = async (e: SubmitEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    const cleanSearch = searchQuery.trim()
    if (cleanSearch) url.searchParams.set('q', cleanSearch)
    else url.searchParams.delete('q')

    if (selectedStatusFilter) url.searchParams.set('status', selectedStatusFilter)
    else url.searchParams.delete('status')

    await syncFilters(url)
  }

  const handleResetFilters = async () => {
    searchQuery = ''
    selectedStatusFilter = ''

    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    url.searchParams.delete('status')
    await syncFilters(url)
  }

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
  // Common Form fields
  let name = $state('')
  let title = $state('')
  let description = $state('')
  let sortOrder = $state<number>(0)
  let isActive = $state(true)
  let selectedTeacherIds = $state<string[]>([])

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
    selectedTeacherIds = []
    isAddSubjModalOpen = true
  }

  const openEditSubject = (subj: any) => {
    selectedSubject = subj
    name = subj.name
    description = subj.description ?? ''
    sortOrder = subj.sortOrder ?? 0
    isActive = subj.isActive
    selectedTeacherIds = [...(subj.teacherIds ?? [])]
    isEditSubjModalOpen = true
  }

  const toggleTeacher = (teacherId: string) => {
    selectedTeacherIds = selectedTeacherIds.includes(teacherId)
      ? selectedTeacherIds.filter((id) => id !== teacherId)
      : [...selectedTeacherIds, teacherId]
  }

  const teacherNames = (teacherIds: string[] = []) => {
    const teacherMap = new Map(teachers.map((teacher: any) => [teacher.id, teacher.name]))
    return teacherIds.map((teacherId) => teacherMap.get(teacherId)).filter(Boolean).join(', ')
  }

  const handleCreateSubject = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder, isActive, teacherIds: selectedTeacherIds })
      })

      await readApiData(res, 'Gagal membuat mata pelajaran')

      isAddSubjModalOpen = false
      notify.success('Mata pelajaran berhasil dibuat.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
    } finally {
      isLoading = false
    }
  }

  const handleUpdateSubject = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects/${selectedSubject.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder, isActive, teacherIds: selectedTeacherIds })
      })

      await readApiData(res, 'Gagal memperbarui mata pelajaran')

      isEditSubjModalOpen = false
      notify.success('Mata pelajaran berhasil diperbarui.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
    } finally {
      isLoading = false
    }
  }

  const handleDeleteSubject = async (id: string) => {
    const confirmed = await dialog.confirm({
      title: 'Hapus Mata Pelajaran?',
      message: 'Apakah Anda yakin ingin menghapus mata pelajaran ini?',
      confirmText: 'Ya, hapus'
    })
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/subjects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      await readApiData(res, 'Gagal menghapus mata pelajaran')

      notify.success('Mata pelajaran berhasil dihapus.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
    }
  }

  // MODULE ACTIONS
  const openAddModule = (subjectId: string) => {
    parentSubjectIdForModule = subjectId
    title = ''
    description = ''
    sortOrder = 0
    isActive = true
    isAddModModalOpen = true
  }

  const openEditModule = (mod: any) => {
    selectedModule = mod
    title = mod.title
    description = mod.description ?? ''
    sortOrder = mod.sortOrder ?? 0
    isActive = mod.isActive
    isEditModModalOpen = true
  }

  const handleCreateModule = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subjectId: parentSubjectIdForModule, title, description, sortOrder, isActive })
      })

      await readApiData(res, 'Gagal membuat modul')

      isAddModModalOpen = false
      notify.success('Modul berhasil dibuat.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
    } finally {
      isLoading = false
    }
  }

  const handleUpdateModule = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules/${selectedModule.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, description, sortOrder, isActive })
      })

      await readApiData(res, 'Gagal memperbarui modul')

      isEditModModalOpen = false
      notify.success('Modul berhasil diperbarui.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
    } finally {
      isLoading = false
    }
  }

  const handleDeleteModule = async (id: string) => {
    const confirmed = await dialog.confirm({
      title: 'Hapus Modul?',
      message: 'Apakah Anda yakin ingin menghapus modul ini?',
      confirmText: 'Ya, hapus'
    })
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/modules/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      await readApiData(res, 'Gagal menghapus modul')

      notify.success('Modul berhasil dihapus.')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
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
          class="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Mapel
        </button>
      </div>
    </div>
  </div>

  <!-- Search & Filter Card -->
  <form onsubmit={handleSearch} class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
    <div class="flex flex-col gap-4 md:flex-row md:items-end">
      <!-- Search Input -->
      <div class="flex-1 space-y-2">
        <label for="search" class="block text-xs font-black uppercase tracking-wider text-black">
          Cari Kurikulum
        </label>
        <div class="relative">
          <input
            id="search"
            type="text"
            bind:value={searchQuery}
            placeholder="Cari mata pelajaran atau modul..."
            class="w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black placeholder-black/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      <!-- Status Filter -->
      <div class="w-full md:w-48 space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-black">
          Status
        </label>
        <Select
          options={statusFilterOptions}
          bind:value={selectedStatusFilter}
          class="w-full"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <button
          type="submit"
          class="rounded-xl border-[3px] border-black bg-neo-blue px-6 py-3 text-sm font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Cari
        </button>

        {#if hasActiveFilters}
          <button
            type="button"
            onclick={handleResetFilters}
            class="rounded-xl border-[3px] border-black bg-neo-red px-6 py-3 text-sm font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Reset
          </button>
        {/if}
      </div>
    </div>
  </form>

  <!-- Subjects Accordion List -->
  <div class="space-y-4">
    {#if filteredSubjects.length === 0}
      <div class="rounded-2xl border-4 border-black bg-white p-8 text-center text-ink/50 font-bold shadow-solid">
        {#if hasActiveFilters}
          Tidak ada data mata pelajaran atau modul yang cocok dengan filter pencarian.
        {:else}
          Tidak ada data mata pelajaran terdaftar.
        {/if}
      </div>
    {:else}
      {#each filteredSubjects as subj}
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
                <p class="mt-1 text-[11px] font-black uppercase text-ink/50">
                  PIC Guru: {subj.teacherIds?.length ? teacherNames(subj.teacherIds) : 'Semua guru'}
                </p>
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
                class="rounded-lg border-[3px] border-black bg-neo-yellow px-3 py-1.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Edit
              </button>
              <button
                type="button"
                onclick={() => handleDeleteSubject(subj.id)}
                class="rounded-lg border-[3px] border-black bg-neo-red px-3 py-1.5 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
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
                  class="rounded-xl border-[3px] border-black bg-neo-green px-4 py-2 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
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
                          class="rounded border-[3px] border-black bg-neo-yellow px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onclick={() => handleDeleteModule(mod.id)}
                          class="rounded border-[3px] border-black bg-neo-red px-3 py-1 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
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
      <form use:inlineValidationForm onsubmit={handleCreateSubject} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Nama Mata Pelajaran <span class="text-neo-red">*</span></label>
          <input
            type="text"
            required
            bind:value={name}
            data-required-message="Nama mata pelajaran wajib diisi."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Urutan Tampilan <span class="text-neo-red">*</span></label>
          <input
            type="number"
            required
            min="0"
            bind:value={sortOrder}
            data-required-message="Urutan tampilan wajib diisi."
            data-min-message="Urutan tampilan tidak boleh kurang dari 0."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
          <textarea
            bind:value={description}
            rows="3"
            data-validation-rule="Opsional, ringkas cakupan materi utama"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between gap-3">
            <label class="block text-xs font-black text-black uppercase tracking-wider">PIC Guru</label>
            <span class="text-[10px] font-black uppercase text-ink/50">Kosong = semua guru</span>
          </div>
          <div class="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-xl border-[3px] border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {#if teachers.length === 0}
              <p class="text-xs font-bold text-ink/50">Belum ada guru aktif.</p>
            {:else}
              {#each teachers as teacher}
                <label class="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-xs font-black uppercase text-black">
                  <input
                    type="checkbox"
                    checked={selectedTeacherIds.includes(teacher.id)}
                    onchange={() => toggleTeacher(teacher.id)}
                    class="h-4 w-4 rounded border-2 border-black accent-black"
                  />
                  <span>{teacher.name}</span>
                </label>
              {/each}
            {/if}
          </div>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isAddSubjModalOpen = false)}
            class="w-1/2 rounded-xl border-[3px] border-black bg-slate-100 px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-[3px] border-black bg-neo-green px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
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
      <form use:inlineValidationForm onsubmit={handleUpdateSubject} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Nama Mata Pelajaran <span class="text-neo-red">*</span></label>
          <input
            type="text"
            required
            bind:value={name}
            data-required-message="Nama mata pelajaran wajib diisi."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Urutan Tampilan <span class="text-neo-red">*</span></label>
          <input
            type="number"
            required
            min="0"
            bind:value={sortOrder}
            data-required-message="Urutan tampilan wajib diisi."
            data-min-message="Urutan tampilan tidak boleh kurang dari 0."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
          <textarea
            bind:value={description}
            rows="3"
            data-validation-rule="Opsional, ringkas cakupan materi utama"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between gap-3">
            <label class="block text-xs font-black text-black uppercase tracking-wider">PIC Guru</label>
            <span class="text-[10px] font-black uppercase text-ink/50">Kosong = semua guru</span>
          </div>
          <div class="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-xl border-[3px] border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {#if teachers.length === 0}
              <p class="text-xs font-bold text-ink/50">Belum ada guru aktif.</p>
            {:else}
              {#each teachers as teacher}
                <label class="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-xs font-black uppercase text-black">
                  <input
                    type="checkbox"
                    checked={selectedTeacherIds.includes(teacher.id)}
                    onchange={() => toggleTeacher(teacher.id)}
                    class="h-4 w-4 rounded border-2 border-black accent-black"
                  />
                  <span>{teacher.name}</span>
                </label>
              {/each}
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-subj-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
          <label for="checkbox-subj-active" class="text-sm font-black uppercase text-ink select-none cursor-pointer">Mapel Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditSubjModalOpen = false)}
            class="w-1/2 rounded-xl border-[3px] border-black bg-slate-100 px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-[3px] border-black bg-neo-green px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
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
      <form use:inlineValidationForm onsubmit={handleCreateModule} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Judul Modul <span class="text-neo-red">*</span></label>
          <input
            type="text"
            required
            bind:value={title}
            data-required-message="Judul modul wajib diisi."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Urutan Tampilan <span class="text-neo-red">*</span></label>
          <input
            type="number"
            required
            min="0"
            bind:value={sortOrder}
            data-required-message="Urutan tampilan wajib diisi."
            data-min-message="Urutan tampilan tidak boleh kurang dari 0."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
          <textarea
            bind:value={description}
            rows="3"
            data-validation-rule="Opsional, ringkas tujuan modul"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          ></textarea>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isAddModModalOpen = false)}
            class="w-1/2 rounded-xl border-[3px] border-black bg-slate-100 px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-[3px] border-black bg-neo-green px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
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
      <form use:inlineValidationForm onsubmit={handleUpdateModule} class="mt-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Judul Modul <span class="text-neo-red">*</span></label>
          <input
            type="text"
            required
            bind:value={title}
            data-required-message="Judul modul wajib diisi."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Urutan Tampilan <span class="text-neo-red">*</span></label>
          <input
            type="number"
            required
            min="0"
            bind:value={sortOrder}
            data-required-message="Urutan tampilan wajib diisi."
            data-min-message="Urutan tampilan tidak boleh kurang dari 0."
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
          <textarea
            bind:value={description}
            rows="3"
            data-validation-rule="Opsional, ringkas tujuan modul"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
          ></textarea>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-mod-active"
            bind:checked={isActive}
            class="h-5 w-5 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
          <label for="checkbox-mod-active" class="text-sm font-black uppercase text-ink select-none cursor-pointer">Modul Aktif</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditModModalOpen = false)}
            class="w-1/2 rounded-xl border-[3px] border-black bg-slate-100 px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="w-1/2 rounded-xl border-[3px] border-black bg-neo-green px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
