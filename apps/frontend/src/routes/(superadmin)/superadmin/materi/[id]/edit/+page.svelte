<!--
Tujuan: Menyediakan halaman edit materi global untuk Superadmin.
Caller: Route `/superadmin/materi/[id]/edit`.
Dependensi: Material API, MaterialRichEditor, Select, dan toast notification.
Main Functions: Memuat detail materi, mengubah metadata/konten, upload gambar editor, menyimpan update, dan redirect ke daftar.
Side Effects: Melakukan HTTP call untuk detail materi, list subject/module, upload image, update materi, toast, dan redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import Select from '$lib/components/ui/Select.svelte'
  import type { FrontendModule, FrontendSubject, TeacherMaterialDetail } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let { data } = $props<{ data: { materialId: string } }>()

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
  let material = $state<TeacherMaterialDetail | null>(null)
  let contentJson = $state<Record<string, unknown> | null>(null)
  let isSubmitting = $state(false)
  let attachmentFile = $state<File | null>(null)
  let isInitialLoad = $state(true)
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

  const subjectOptions = $derived(subjects.map((subject) => ({ value: subject.id, label: subject.name })))
  const moduleOptions = $derived(modules.map((moduleItem) => ({ value: moduleItem.id, label: moduleItem.title })))
  const materialTypeOptions = [
    { value: 'TEXT', label: 'Teks' },
    { value: 'EXERCISE', label: 'Latihan' },
    { value: 'PDF', label: 'PDF' },
    { value: 'VIDEO', label: 'Video' }
  ]

  const loadModules = async (subjectId: string) => {
    modules = await materialApi.listModules(subjectId)
  }

  onMount(async () => {
    const [subjectsResult, materialResult] = await Promise.all([
      materialApi.listSubjects(),
      materialApi.getSuperadminMaterialDetail(data.materialId)
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
    return materialApi.uploadSuperadminImage(payload)
  }

  const handleSubmit = async () => {
    if (!material) return

    if (!form.moduleId || !form.title.trim()) {
      notify.error('Modul dan judul materi wajib diisi')
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

      await materialApi.updateSuperadminMaterial(material.id, payload)
      notify.success('Materi berhasil diperbarui.')
      await goto('/superadmin/materi')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Materi gagal diperbarui')
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if material}
  <section class="space-y-6">
    <div class="flex overflow-hidden rounded-2xl border-4 border-black bg-white shadow-solid">
      <div class="w-4 flex-shrink-0 border-r-4 border-black bg-neo-stripes-blue"></div>

      <div class="flex-grow p-6">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">Superadmin</span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">Edit Materi</span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">{material.title}</h1>
        <p class="mt-2 text-sm font-bold text-ink/60">Perbarui konten materi lintas mapel dan status publikasi.</p>
        <div class="mt-6 border-t-2 border-black/10 pt-4">
          <a href="/superadmin/materi" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-0.5 active:translate-y-0">&larr; Kembali ke Daftar Materi</a>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside class="space-y-5 rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Mata Pelajaran</label>
          <Select options={subjectOptions} bind:value={form.subjectId} placeholder="Pilih Mata Pelajaran" searchable={true} class="mt-2" />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Modul</label>
          <Select options={moduleOptions} bind:value={form.moduleId} placeholder="Pilih Modul" searchable={true} disabled={true} class="mt-2" />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Judul</label>
          <input bind:value={form.title} class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" placeholder="Masukkan judul materi..." />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Ringkasan</label>
          <textarea bind:value={form.summary} rows="4" class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" placeholder="Ringkasan singkat materi..."></textarea>
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Tipe Materi</label>
          <Select options={materialTypeOptions} bind:value={form.materialType} placeholder="Pilih Tipe Materi" searchable={false} class="mt-2" />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-black">Attachment baru (opsional)</label>
          <input type="file" accept="application/pdf,video/mp4,video/webm" class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" onchange={(event) => {
            const target = event.currentTarget as HTMLInputElement
            attachmentFile = target.files?.[0] ?? null
          }} />
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider text-black">Durasi (menit)</label>
            <input bind:value={form.estimatedDurationMinutes} class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
          </div>
          <div>
            <label class="block text-xs font-black uppercase tracking-wider text-black">Urutan</label>
            <input bind:value={form.sortOrder} class="mt-2 w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[1px] focus:-translate-y-[1px] focus:bg-neo-yellow/5 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input type="checkbox" id="checkbox-is-published" bind:checked={form.isPublished} class="h-5 w-5 cursor-pointer rounded border-2 border-black accent-black focus:ring-0" />
          <label for="checkbox-is-published" class="cursor-pointer text-sm font-extrabold uppercase text-ink">Publish materi</label>
        </div>

        <button type="button" class="w-full rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50" onclick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </aside>

      <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
        <MaterialRichEditor content={contentJson} editable={true} onChange={(value) => (contentJson = value)} onUploadImage={uploadImage} />
      </div>
    </div>
  </section>
{/if}
