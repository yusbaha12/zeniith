<!--
Tujuan: Menyediakan halaman daftar ujian guru dengan CRUD metadata ujian (Edit Info).
Caller: Route `/teacher/ujian`.
Dependensi: Exam API, Material API frontend.
Main Functions: Mengambil daftar ujian guru, mengedit metadata ujian guru, dan menyediakan CTA buat atau kelola soal ujian.
Side Effects: Melakukan HTTP call ke backend `/api/teacher/exams`.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import type { FrontendTeacherExamListItem } from '$lib/domain/types/exam.types'
  import type { FrontendSubject } from '$lib/domain/types/material.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let exams = $state<FrontendTeacherExamListItem[]>([])
  let subjects = $state<FrontendSubject[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  // Search & Filter state
  let searchQuery = $state(page.url.searchParams.get('q') ?? '')
  let selectedTypeFilter = $state(page.url.searchParams.get('type') ?? '')
  let selectedSubjectFilter = $state(page.url.searchParams.get('subject') ?? '')

  const hasActiveFilters = $derived(Boolean(searchQuery || selectedTypeFilter || selectedSubjectFilter))

  const examTypeOptions = $derived([
    { value: '', label: 'Semua Tipe' },
    ...Array.from(new Set(exams.map(e => e.examType)))
      .filter(Boolean)
      .map(type => ({ value: type as string, label: type as string }))
  ])

  const subjectOptions = $derived([
    { value: '', label: 'Semua Mapel' },
    ...Array.from(new Set(exams.map(e => e.subjectName)))
      .filter(Boolean)
      .map(subj => ({ value: subj as string, label: subj as string }))
  ])

  const filteredExams = $derived(
    exams.filter(exam => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = !query ||
        exam.title.toLowerCase().includes(query) ||
        (exam.description && exam.description.toLowerCase().includes(query))

      const matchesType = !selectedTypeFilter || exam.examType === selectedTypeFilter
      const matchesSubject = !selectedSubjectFilter || exam.subjectName === selectedSubjectFilter

      return matchesSearch && matchesType && matchesSubject
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

    if (selectedTypeFilter) url.searchParams.set('type', selectedTypeFilter)
    else url.searchParams.delete('type')

    if (selectedSubjectFilter) url.searchParams.set('subject', selectedSubjectFilter)
    else url.searchParams.delete('subject')

    await syncFilters(url)
  }

  const handleResetFilters = async () => {
    searchQuery = ''
    selectedTypeFilter = ''
    selectedSubjectFilter = ''

    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    url.searchParams.delete('type')
    url.searchParams.delete('subject')
    await syncFilters(url)
  }

  // Modal & Form States
  let isEditModalOpen = $state(false)
  let isSubmitting = $state(false)
  let selectedExam = $state<any>(null)

  let title = $state('')
  let description = $state('')
  let instructions = $state('')
  let examType = $state<'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM'>('TRYOUT')
  let durationMinutes = $state(90)
  let startsAt = $state('')
  let endsAt = $state('')
  let subjectId = $state<string>('')
  let isPublished = $state(false)

  const formSubjectOptions = $derived([
    { value: '', label: 'Pilih Mata Pelajaran' },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ])

  const formExamTypeOptions = [
    { value: 'TRYOUT', label: 'Tryout' },
    { value: 'LATIHAN', label: 'Latihan' },
    { value: 'MID_EXAM', label: 'Ujian Tengah Semester' },
    { value: 'FINAL_EXAM', label: 'Ujian Akhir Semester' }
  ]

  function formatDatetimeLocal(dateVal: string | Date | undefined | null): string {
    if (!dateVal) return ''
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${date}T${hours}:${minutes}`
  }

  const openEditModal = (exam: any) => {
    selectedExam = exam
    title = exam.title
    description = exam.description ?? ''
    instructions = exam.instructions ?? ''
    examType = exam.examType
    durationMinutes = exam.durationMinutes
    startsAt = formatDatetimeLocal(exam.startsAt)
    endsAt = formatDatetimeLocal(exam.endsAt)
    subjectId = exam.subjectId ?? ''
    isPublished = exam.isPublished ?? false
    isEditModalOpen = true
  }

  const handleUpdate = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!subjectId) {
      notify.error('Mata pelajaran wajib dipilih')
      return
    }
    isSubmitting = true
    try {
      await examApi.updateTeacherExam(selectedExam.id, {
        subjectId: subjectId || null,
        title,
        description: description || null,
        instructions: instructions || null,
        examType,
        durationMinutes,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isPublished
      })
      notify.success('Ujian berhasil diperbarui')
      isEditModalOpen = false
      exams = await examApi.listTeacherExams()
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui ujian')
    } finally {
      isSubmitting = false
    }
  }

  onMount(async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        examApi.listTeacherExams(),
        materialApi.listSubjects()
      ])
      exams = examsData
      subjects = subjectsData
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar ujian guru gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<section class="space-y-6">
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Panel Guru
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Ujian
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Ujian Milik Anda</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Kelola dan pantau seluruh ujian aktif</p>
      </div>
      <div>
        <a href="/teacher/ujian/buat" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">
          Buat Ujian &rarr;
        </a>
      </div>
    </div>
  </div>

  <!-- Search & Filter Card -->
  {#if !isLoading && !loadError && exams.length > 0}
    <form onsubmit={handleSearch} class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <!-- Search Input -->
        <div class="flex-grow space-y-2">
          <label for="search" class="block text-xs font-black uppercase tracking-wider text-black">
            Cari Ujian
          </label>
          <div class="relative">
            <input
              id="search"
              type="text"
              bind:value={searchQuery}
              placeholder="Cari judul atau deskripsi ujian..."
              class="w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black placeholder-black/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
        </div>

        <!-- Type Filter -->
        <div class="w-full md:w-48 space-y-2">
          <label class="block text-xs font-black uppercase tracking-wider text-black">
            Tipe Ujian
          </label>
          <Select
            options={examTypeOptions}
            bind:value={selectedTypeFilter}
            class="w-full"
          />
        </div>

        <!-- Subject Filter -->
        <div class="w-full md:w-48 space-y-2">
          <label class="block text-xs font-black uppercase tracking-wider text-black">
            Mata Pelajaran
          </label>
          <Select
            options={subjectOptions}
            bind:value={selectedSubjectFilter}
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
  {/if}

  {#if isLoading}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat daftar ujian...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if exams.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Belum ada ujian yang Anda buat.</div>
  {:else}
    <div class="space-y-4">
      {#if filteredExams.length === 0}
        <div class="rounded-xl border-4 border-black bg-white p-8 text-center text-sm font-bold text-ink/50 shadow-solid">
          Tidak ada data ujian yang cocok dengan filter pencarian.
        </div>
      {:else}
        {#each filteredExams as exam}
          <article class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-lg font-black text-ink uppercase tracking-tight">{exam.title}</p>
                <p class="mt-1 text-sm font-bold text-ink/70">
                  {exam.subjectName ?? 'Umum'} • {exam.examType} • {exam.durationMinutes} menit
                  {#if exam.isPublished}
                    • <span class="bg-neo-green text-black px-1.5 py-0.5 rounded border border-black text-xs font-black uppercase">Aktif</span>
                  {:else}
                    • <span class="bg-neo-red text-white px-1.5 py-0.5 rounded border border-black text-xs font-black uppercase">Draf</span>
                  {/if}
                </p>
                {#if exam.description}
                  <p class="mt-2 text-sm font-semibold text-ink/75">{exam.description}</p>
                {/if}
              </div>
              <div class="flex flex-wrap gap-2 lg:flex-row lg:items-center">
                <a href={`/teacher/ujian/${exam.id}/monitor`} class="rounded-lg border-2 border-black bg-neo-blue px-4 py-2.5 text-sm font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">Monitor</a>
                <a href={`/teacher/ujian/${exam.id}/edit`} class="rounded-lg border-2 border-black bg-white px-4 py-2.5 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">Kelola Soal</a>
                <button
                  onclick={() => openEditModal(exam)}
                  class="rounded-lg border-2 border-black bg-neo-yellow px-4 py-2.5 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Edit Info
                </button>
              </div>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  {/if}
</section>

<!-- Modal: Edit Ujian (Guru) -->
{#if isEditModalOpen}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="w-full max-w-2xl rounded-2xl border-4 border-black bg-white p-8 shadow-solid-lg my-8">
      <h2 class="text-2xl font-black uppercase text-ink">Edit Detail Ujian</h2>
      <p class="mt-1 text-xs font-bold text-ink/50">Ubah informasi jadwal, durasi, dan metadata ujian milik Anda.</p>
      
      <form onsubmit={handleUpdate} class="mt-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="col-span-1 md:col-span-2">
            <label class="block text-xs font-black text-black uppercase tracking-wider">Judul Ujian <span class="text-neo-red">*</span></label>
            <input
              type="text"
              required
              bind:value={title}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Mata Pelajaran <span class="text-neo-red">*</span></label>
            <Select
              options={formSubjectOptions}
              bind:value={subjectId}
              class="w-full mt-2"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Tipe Ujian <span class="text-neo-red">*</span></label>
            <Select
              options={formExamTypeOptions}
              bind:value={examType}
              class="w-full mt-2"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Durasi (Menit) <span class="text-neo-red">*</span></label>
            <input
              type="number"
              required
              min="1"
              max="600"
              bind:value={durationMinutes}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Jadwal Mulai <span class="text-neo-red">*</span></label>
            <input
              type="datetime-local"
              required
              bind:value={startsAt}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Jadwal Selesai <span class="text-neo-red">*</span></label>
            <input
              type="datetime-local"
              required
              bind:value={endsAt}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div class="col-span-1 md:col-span-2">
            <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
            <textarea
              bind:value={description}
              rows="2"
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            ></textarea>
          </div>

          <div class="col-span-1 md:col-span-2">
            <label class="block text-xs font-black text-black uppercase tracking-wider">Instruksi Pengerjaan</label>
            <textarea
              bind:value={instructions}
              rows="2"
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-2">
          <input
            type="checkbox"
            id="checkbox-is-published-edit-teacher"
            bind:checked={isPublished}
            class="h-5 w-5 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          />
          <label for="checkbox-is-published-edit-teacher" class="text-sm font-black uppercase text-ink select-none cursor-pointer">Publikasikan Ujian</label>
        </div>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            onclick={() => (isEditModalOpen = false)}
            class="w-1/2 rounded-xl border-[3px] border-black bg-slate-100 px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="w-1/2 rounded-xl border-[3px] border-black bg-neo-green px-4 py-3 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
