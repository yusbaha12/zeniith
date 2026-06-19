<!--
Tujuan: Menyediakan halaman edit materi guru fase 3 dengan editor Tiptap.
Caller: Route `/teacher/materi/[id]/edit`.
Dependensi: Material API, subject/module API, komponen MaterialRichEditor, dan toast notification.
Main Functions: Memuat detail materi, mengubah konten/form metadata, menyimpan pembaruan materi, dan mengirim feedback via toast.
Side Effects: Melakukan HTTP call ke backend untuk detail materi, list modul, upload image, update materi, menampilkan toast, dan memicu redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import type { FrontendModule, FrontendSubject, TeacherMaterialDetail } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let { data } = $props<{ data: { materialId: string } }>()

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
  let material = $state<TeacherMaterialDetail | null>(null)
  let contentJson = $state<Record<string, unknown> | null>(null)
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

  // Derived options for Select components
  let subjectOptions = $derived(
    subjects.map(s => ({ value: s.id, label: s.name }))
  )

  let moduleOptions = $derived(
    modules.map(m => ({ value: m.id, label: m.title }))
  )

  const materialTypeOptions = [
    { value: 'TEXT', label: 'Teks' },
    { value: 'EXERCISE', label: 'Latihan' },
    { value: 'PDF', label: 'PDF' },
    { value: 'VIDEO', label: 'Video' }
  ]

  const loadModules = async (subjectId: string) => {
    modules = await materialApi.listModules(subjectId)
  }

  let isInitialLoad = $state(true)

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
    
    // Allow reactivity to change modules on subsequent changes
    isInitialLoad = false
  })

  $effect(() => {
    if (form.subjectId && !isInitialLoad) {
      loadModules(form.subjectId).then(() => {
        form.moduleId = modules[0]?.id ?? ''
      })
    }
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
      notify.success('Materi berhasil diperbarui.')
      await goto('/teacher/materi')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Materi gagal diperbarui')
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
        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Mata Pelajaran</label>
          <Select
            options={subjectOptions}
            bind:value={form.subjectId}
            placeholder="Pilih Mata Pelajaran"
            searchable={true}
            class="mt-2"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Modul</label>
          <Select
            options={moduleOptions}
            bind:value={form.moduleId}
            placeholder="Pilih Modul"
            searchable={true}
            disabled={true}
            class="mt-2"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Judul</label>
          <input
            bind:value={form.title}
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            placeholder="Masukkan judul materi..."
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Ringkasan</label>
          <textarea
            bind:value={form.summary}
            rows="4"
            class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            placeholder="Ringkasan singkat materi..."
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Tipe Materi</label>
          <Select
            options={materialTypeOptions}
            bind:value={form.materialType}
            placeholder="Pilih Tipe Materi"
            searchable={false}
            class="mt-2"
          />
        </div>

        <div>
          <label class="block text-xs font-black text-black uppercase tracking-wider">Attachment baru (opsional)</label>
          <input
            type="file"
            accept="application/pdf,video/mp4,video/webm"
            class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            onchange={(event) => {
              const target = event.currentTarget as HTMLInputElement
              attachmentFile = target.files?.[0] ?? null
            }}
          />
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Durasi (menit)</label>
            <input
              bind:value={form.estimatedDurationMinutes}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            />
          </div>
          <div>
            <label class="block text-xs font-black text-black uppercase tracking-wider">Urutan</label>
            <input
              bind:value={form.sortOrder}
              class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="checkbox-is-published"
            bind:checked={form.isPublished}
            class="h-5 w-5 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
          />
          <label for="checkbox-is-published" class="text-sm font-extrabold uppercase text-ink cursor-pointer">Publish materi</label>
        </div>

        <div class="pt-4">
          <button
            type="button"
            class="w-full rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            onclick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </aside>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
        <MaterialRichEditor content={contentJson} editable={true} onChange={(value) => (contentJson = value)} onUploadImage={uploadImage} />
      </div>
    </div>
  </section>
{/if}
