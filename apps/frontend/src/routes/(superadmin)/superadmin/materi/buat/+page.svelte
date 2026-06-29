<!--
Tujuan: Menyediakan halaman pembuatan materi global untuk Superadmin.
Caller: Route `/superadmin/materi/buat`.
Dependensi: Material API, MaterialRichEditor, Select, dan toast notification.
Main Functions: Mengumpulkan form materi, upload gambar editor, membuat materi baru, dan redirect ke daftar materi superadmin.
Side Effects: Melakukan HTTP call ke backend untuk list subject/module, upload image, create materi, toast, dan redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import Select from '$lib/components/ui/Select.svelte'
  import type { FrontendModule, FrontendSubject } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
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
    form.moduleId = modules[0]?.id ?? ''
  }

  onMount(async () => {
    subjects = await materialApi.listSubjects()
    form.subjectId = subjects[0]?.id ?? ''
  })

  $effect(() => {
    if (form.subjectId) {
      loadModules(form.subjectId)
    }
  })

  const uploadImage = async (file: File) => {
    const payload = new FormData()
    payload.set('file', file)
    return materialApi.uploadSuperadminImage(payload)
  }

  const handleSubmit = async () => {
    if (!form.moduleId || !form.title.trim()) {
      notify.error('Modul dan judul materi wajib diisi')
      return
    }

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

      await materialApi.createSuperadminMaterial(payload)
      notify.success('Materi berhasil dibuat.')
      await goto('/superadmin/materi')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Materi gagal dibuat')
    } finally {
      isSubmitting = false
    }
  }
</script>

<section class="space-y-6">
  <div class="flex overflow-hidden rounded-2xl border-4 border-black bg-white shadow-solid">
    <div class="w-4 flex-shrink-0 border-r-4 border-black bg-neo-stripes-blue"></div>

    <div class="flex-grow p-6">
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">Superadmin</span>
        <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">Buat Materi</span>
      </div>
      <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Susun Materi Baru</h1>
      <p class="mt-2 text-sm font-bold text-ink/60">Materi dibuat oleh Superadmin dan tersedia sesuai modul yang dipilih.</p>
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
        <Select options={moduleOptions} bind:value={form.moduleId} placeholder="Pilih Modul" searchable={true} class="mt-2" />
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
        <label class="block text-xs font-black uppercase tracking-wider text-black">Attachment PDF/Video</label>
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
        <label for="checkbox-is-published" class="cursor-pointer text-sm font-extrabold uppercase text-ink">Publish setelah disimpan</label>
      </div>

      <button type="button" class="w-full rounded-xl border-[3px] border-black bg-neo-green px-5 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:pointer-events-none disabled:opacity-50" onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Menyimpan...' : 'Simpan Materi'}
      </button>
    </aside>

    <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
      <MaterialRichEditor content={contentJson} onChange={(value) => (contentJson = value)} onUploadImage={uploadImage} />
    </div>
  </div>
</section>
