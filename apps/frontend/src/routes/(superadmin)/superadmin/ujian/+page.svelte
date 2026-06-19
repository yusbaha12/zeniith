<!--
Tujuan: Menyediakan halaman daftar ujian super admin untuk mengelola semua ujian nasional.
Caller: Route `/superadmin/ujian`.
Dependensi: Exam API frontend.
Main Functions: Mengambil daftar semua ujian nasional dan menyediakan navigasi ke halaman kelola soal.
Side Effects: Melakukan HTTP call ke backend `/api/superadmin/exams`.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import type { FrontendTeacherExamListItem } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import Select from '$lib/components/ui/Select.svelte'

  let exams = $state<FrontendTeacherExamListItem[]>([])
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

  onMount(async () => {
    try {
      exams = await examApi.superadminListExams()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar ujian gagal dimuat'
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
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Ujian & Soal
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Ujian & Soal</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Daftar semua Ujian Nasional & Try Out</p>
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
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat semua daftar ujian...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if exams.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Belum ada ujian/tryout yang terdaftar secara nasional.</div>
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
                <p class="mt-1 text-sm font-bold text-ink/70">{exam.subjectName ?? 'Umum'} • {exam.examType} • {exam.durationMinutes} menit</p>
                <p class="mt-1 text-xs font-bold text-ink/50">Diikuti oleh {exam.participantCount} peserta</p>
                {#if exam.description}
                  <p class="mt-2 text-sm font-semibold text-ink/70">{exam.description}</p>
                {/if}
              </div>
              <div class="flex gap-2">
                <a
                  href={`/superadmin/ujian/${exam.id}/edit`}
                  class="rounded-lg border-2 border-black bg-neo-yellow px-5 py-2.5 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Kelola Soal Ujian
                </a>
              </div>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  {/if}
</section>
