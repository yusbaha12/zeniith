<!--
Tujuan: Menyediakan halaman edit materi guru fase 3 dengan editor Tiptap.
Caller: Route `/teacher/materi/[id]/edit`.
Dependensi: Material API, subject/module API, dan komponen MaterialRichEditor.
Main Functions: Memuat detail materi, mengubah konten/form metadata, lalu menyimpan pembaruan materi.
Side Effects: Melakukan HTTP call ke backend untuk detail materi, list modul, upload image, dan update materi.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import type { FrontendModule, FrontendSubject, TeacherMaterialDetail } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'

  let { data } = $props<{ data: { materialId: string } }>()

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
  let material = $state<TeacherMaterialDetail | null>(null)
  let contentJson = $state<Record<string, unknown> | null>(null)
  let submitError = $state<string | null>(null)
  let isSubmitting = $state(false)
  let attachmentFile = $state<File | null>(null)
  let form = $state({
    subjectId: '',
    moduleId: '',
    title: '',
    summary: '',
    materialType: 'TEXT',
    estimatedDurationMinutes: '15',
    sortOrder: '0',
    isPublished: true
  })

  const loadModules = async (subjectId: string) => {
    modules = await materialApi.listModules(subjectId)
  }

  onMount(async () => {
    const [subjectsResult, materialResult] = await Promise.all([
      materialApi.listSubjects(),
      materialApi.getTeacherMaterialDetail(data.materialId)
    ])

    subjects = subjectsResult
    material = materialResult
    form.subjectId = material.subjectId
    await loadModules(form.subjectId)
    form.moduleId = material.moduleId
    form.title = material.title
    form.summary = material.summary ?? ''
    form.materialType = material.materialType
    form.estimatedDurationMinutes = String(material.estimatedDurationMinutes ?? 15)
    form.sortOrder = String(material.sortOrder)
    form.isPublished = material.isPublished
    contentJson = material.contentJson
  })

  const uploadImage = async (file: File) => {
    const payload = new FormData()
    payload.set('file', file)
    return materialApi.uploadTeacherImage(payload)
  }

  const handleSubmit = async () => {
    if (!material) {
      return
    }

    submitError = null
    isSubmitting = true

    try {
      const payload = new FormData()
      payload.set('title', form.title)
      payload.set('summary', form.summary)
      payload.set('materialType', form.materialType)
      payload.set('contentJson', JSON.stringify(contentJson))
      payload.set('estimatedDurationMinutes', form.estimatedDurationMinutes)
      payload.set('sortOrder', form.sortOrder)
      payload.set('isPublished', String(form.isPublished))

      if (attachmentFile) {
        payload.set('attachmentFile', attachmentFile)
      }

      await materialApi.updateTeacherMaterial(material.id, payload)
      await goto('/teacher/materi')
    } catch (error) {
      submitError = error instanceof Error ? error.message : 'Materi gagal diperbarui'
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if material}
  <section class="space-y-6">
    <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
      <!-- Accent bar representing the active section -->
      <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
      
      <div class="flex-grow p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
                Panel Guru
              </span>
              <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
                Edit Materi
              </span>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tight text-ink">{material.title}</h1>
            <p class="mt-2 text-sm font-bold text-ink/60">Perbarui konten materi, tipe materi, estimasi durasi, dan publikasi.</p>
          </div>
        </div>

        <div class="mt-6 border-t-2 border-black/10 pt-4">
          <a href="/teacher/materi" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">
            &larr; Kembali ke Daftar Materi
          </a>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside class="space-y-5 rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Mata Pelajaran</span>
          <select bind:value={form.subjectId} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" onchange={async () => await loadModules(form.subjectId)}>
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Modul</span>
          <select bind:value={form.moduleId} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" disabled>
            {#each modules as moduleItem}
              <option value={moduleItem.id}>{moduleItem.title}</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Judul</span>
          <input bind:value={form.title} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" placeholder="Masukkan judul materi..." />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Ringkasan</span>
          <textarea bind:value={form.summary} rows="4" class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" placeholder="Ringkasan singkat materi..."></textarea>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Tipe Materi</span>
          <select bind:value={form.materialType} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0">
            <option value="TEXT">Teks</option>
            <option value="EXERCISE">Latihan</option>
            <option value="PDF">PDF</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black uppercase text-ink">Attachment baru (opsional)</span>
          <input type="file" accept="application/pdf,video/mp4,video/webm" class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" onchange={(event) => {
            const target = event.currentTarget as HTMLInputElement
            attachmentFile = target.files?.[0] ?? null
          }} />
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-black uppercase text-ink">Durasi (menit)</span>
            <input bind:value={form.estimatedDurationMinutes} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black uppercase text-ink">Urutan</span>
            <input bind:value={form.sortOrder} class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-neo-yellow/5 focus:ring-0" />
          </label>
        </div>

        <label class="flex items-center gap-3 text-sm font-bold text-ink cursor-pointer">
          <input type="checkbox" bind:checked={form.isPublished} class="h-4 w-4 rounded border-2 border-black text-neo-blue focus:ring-0" />
          Publish materi
        </label>

        <button type="button" class="w-full rounded-xl border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid hover:-translate-y-0.5 active:translate-y-0 transition-transform" onclick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>

        {#if submitError}
          <p class="text-sm font-bold text-neo-red">{submitError}</p>
        {/if}
      </aside>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
        <MaterialRichEditor content={contentJson} editable={true} onChange={(value) => (contentJson = value)} onUploadImage={uploadImage} />
      </div>
    </div>
  </section>
{/if}
