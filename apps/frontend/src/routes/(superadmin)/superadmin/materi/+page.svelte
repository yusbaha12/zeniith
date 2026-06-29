<!--
Tujuan: Menyediakan halaman kelola materi global untuk Superadmin.
Caller: Route `/superadmin/materi`.
Dependensi: Material API, dialog konfirmasi, toast notification, dan komponen Select.
Main Functions: Mengambil daftar materi dengan filter backend, menampilkan ringkasan, navigasi buat/edit, dan hapus materi dengan konfirmasi.
Side Effects: Melakukan HTTP call ke backend `/api/superadmin/materials`, menampilkan dialog/toast, dan navigasi client-side.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import Select from '$lib/components/ui/Select.svelte'
  import type { FrontendSubject, TeacherMaterialListItem } from '$lib/domain/types/material.types'
  import { dialog } from '$lib/infrastructure/dialog/dialog'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let materials = $state<TeacherMaterialListItem[]>([])
  let subjects = $state<FrontendSubject[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)
  let searchQuery = $state('')
  let selectedSubjectId = $state('')
  let selectedStatus = $state('')

  const subjectOptions = $derived([
    { value: '', label: 'Semua Mapel' },
    ...subjects.map((subject) => ({ value: subject.id, label: subject.name }))
  ])

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ]

  const publishedCount = $derived(materials.filter((material) => material.isPublished).length)
  const draftCount = $derived(materials.length - publishedCount)

  const loadMaterials = async () => {
    isLoading = true
    loadError = null

    try {
      materials = await materialApi.listSuperadminMaterials({
        q: searchQuery.trim() || undefined,
        subjectId: selectedSubjectId || undefined,
        isPublished: selectedStatus === 'published' ? true : selectedStatus === 'draft' ? false : undefined
      })
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar materi gagal dimuat'
    } finally {
      isLoading = false
    }
  }

  onMount(async () => {
    try {
      const [subjectResult] = await Promise.all([
        materialApi.listSubjects(),
        loadMaterials()
      ])
      subjects = subjectResult
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Data materi gagal dimuat'
      isLoading = false
    }
  })

  const resetFilters = () => {
    searchQuery = ''
    selectedSubjectId = ''
    selectedStatus = ''
    void loadMaterials()
  }

  const removeMaterial = async (material: TeacherMaterialListItem) => {
    const confirmed = await dialog.confirm({
      title: 'Hapus materi?',
      message: `Materi "${material.title}" akan dihapus dari sistem.`,
      confirmText: 'Ya, hapus',
      cancelText: 'Batal'
    })

    if (!confirmed) return

    try {
      await materialApi.deleteSuperadminMaterial(material.id)
      notify.success('Materi berhasil dihapus.')
      await loadMaterials()
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Materi gagal dihapus')
    }
  }
</script>

<section class="space-y-6">
  <div class="flex overflow-hidden rounded-2xl border-4 border-black bg-white shadow-solid">
    <div class="w-4 flex-shrink-0 border-r-4 border-black bg-neo-stripes-blue"></div>

    <div class="flex-grow p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
              Superadmin
            </span>
            <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
              Materi Global
            </span>
          </div>
          <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Materi</h1>
          <p class="mt-1 text-sm font-bold text-ink/60">Pantau, buat, edit, dan hapus materi lintas mapel dari satu panel.</p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          onclick={() => goto('/superadmin/materi/buat')}
        >
          Buat Materi &rarr;
        </button>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border-2 border-black bg-white p-3 shadow-solid-sm">
          <p class="text-[10px] font-black uppercase tracking-wider text-ink/50">Total</p>
          <p class="text-2xl font-black text-ink">{materials.length}</p>
        </div>
        <div class="rounded-xl border-2 border-black bg-neo-green/20 p-3 shadow-solid-sm">
          <p class="text-[10px] font-black uppercase tracking-wider text-ink/50">Published</p>
          <p class="text-2xl font-black text-ink">{publishedCount}</p>
        </div>
        <div class="rounded-xl border-2 border-black bg-neo-yellow/30 p-3 shadow-solid-sm">
          <p class="text-[10px] font-black uppercase tracking-wider text-ink/50">Draft</p>
          <p class="text-2xl font-black text-ink">{draftCount}</p>
        </div>
      </div>
    </div>
  </div>

  <form class="rounded-2xl border-4 border-black bg-white p-5 shadow-solid" onsubmit={(event) => {
    event.preventDefault()
    void loadMaterials()
  }}>
    <div class="grid gap-4 lg:grid-cols-[1fr_260px_220px_auto] lg:items-end">
      <div>
        <label class="block text-xs font-black uppercase tracking-wider text-black">Cari Materi</label>
        <input
          bind:value={searchQuery}
          class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          placeholder="Judul, mapel, modul, ringkasan..."
        />
      </div>
      <div>
        <label class="block text-xs font-black uppercase tracking-wider text-black">Mapel</label>
        <Select options={subjectOptions} bind:value={selectedSubjectId} searchable={true} class="mt-2" />
      </div>
      <div>
        <label class="block text-xs font-black uppercase tracking-wider text-black">Status</label>
        <Select options={statusOptions} bind:value={selectedStatus} searchable={false} class="mt-2" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="rounded-xl border-[3px] border-black bg-neo-yellow px-5 py-3 text-sm font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0">Terapkan</button>
        <button type="button" class="rounded-xl border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0" onclick={resetFilters}>Reset</button>
      </div>
    </div>
  </form>

  {#if isLoading}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat daftar materi...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if materials.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Tidak ada materi yang cocok dengan filter saat ini.</div>
  {:else}
    <div class="space-y-4">
      {#each materials as material}
        <article class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-lg font-black uppercase tracking-tight text-ink">{material.title}</p>
                <span class={`rounded-md border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-solid-sm ${material.isPublished ? 'bg-neo-green text-black' : 'bg-neo-yellow text-black'}`}>
                  {material.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p class="mt-1 text-sm font-bold text-ink/70">{material.subjectName} • {material.moduleTitle}</p>
              {#if material.summary}
                <p class="mt-2 text-sm font-semibold text-ink/75">{material.summary}</p>
              {/if}
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-0.5 active:translate-y-0" onclick={() => goto(`/superadmin/materi/${material.id}/edit`)}>Edit</button>
              <button type="button" class="rounded-lg border-2 border-black bg-neo-red px-4 py-2 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform hover:-translate-y-0.5 active:translate-y-0" onclick={() => void removeMaterial(material)}>Hapus</button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
