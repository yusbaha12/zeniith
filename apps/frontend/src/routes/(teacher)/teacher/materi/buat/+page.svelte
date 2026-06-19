<!--
Tujuan: Menyediakan halaman pembuatan materi guru fase 3 dengan editor Tiptap.
Caller: Route `/teacher/materi/buat`.
Dependensi: Material API, subject/module API, komponen MaterialRichEditor, dan toast notification.
Main Functions: Mengumpulkan form materi, upload gambar editor bila perlu, membuat materi baru, dan mengirim feedback via toast.
Side Effects: Melakukan HTTP call ke backend untuk list subject/module, upload image, create materi, menampilkan toast, dan memicu redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import type { FrontendModule, FrontendSubject } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
  let contentJson = $state<Record<string, unknown> | null>(null)
  let isSubmitting = $state(false)
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
  let attachmentFile = $state<File | null>(null)

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
    form.moduleId = modules[0]?.id ?? ''
  }

  onMount(async () => {
    subjects = await materialApi.listSubjects()
    form.subjectId = subjects[0]?.id ?? ''
  })

  // Load modules reactively when subjectId changes
  $effect(() => {
    if (form.subjectId) {
      loadModules(form.subjectId)
    }
  })

  const uploadImage = async (file: File) => {
    const payload = new FormData()
    payload.set('file', file)
    return materialApi.uploadTeacherImage(payload)
  }

  const handleSubmit = async () => {
    isSubmitting = true

    try {
      const payload = new FormData()
      payload.set('moduleId', form.moduleId)
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

      await materialApi.createTeacherMaterial(payload)
      notify.success('Materi berhasil dibuat.')
      await goto('/teacher/materi')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Materi gagal dibuat')
    } finally {
      isSubmitting = false
    }
  }
</script>

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
              Buat Materi
            </span>
          </div>
          <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Susun materi baru untuk murid</h1>
          <p class="mt-2 text-sm font-bold text-ink/60">Buat materi baru yang akan dipelajari oleh murid bimbel.</p>
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
        <label class="block text-xs font-black text-black uppercase tracking-wider">Attachment PDF/Video</label>
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
        <label for="checkbox-is-published" class="text-sm font-extrabold uppercase text-ink cursor-pointer">Publish setelah disimpan</label>
      </div>

      <div class="pt-4">
        <button
          type="button"
          class="w-full rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Materi'}
        </button>
      </div>
    </aside>

    <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
      <MaterialRichEditor content={contentJson} onChange={(value) => (contentJson = value)} onUploadImage={uploadImage} />
    </div>
  </div>
</section>
