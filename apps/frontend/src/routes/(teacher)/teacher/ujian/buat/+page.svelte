<!--
Tujuan: Menyediakan halaman pembuatan metadata ujian guru fase 4.
Caller: Route `/teacher/ujian/buat`.
Dependensi: Exam API frontend, Material API subject list, navigation helper, dan toast notification.
Main Functions: Mengumpulkan metadata ujian, membuat exam baru sebelum guru menambah soal, dan mengirim feedback via toast.
Side Effects: Melakukan HTTP call ke backend `/api/teacher/exams`, menampilkan toast, dan memicu redirect.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendSubject } from '$lib/domain/types/material.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import Select from '$lib/components/ui/Select.svelte'

  let subjects = $state<FrontendSubject[]>([])
  let loadError = $state<string | null>(null)
  let isSubmitting = $state(false)
  let form = $state({
    subjectId: '',
    title: '',
    description: '',
    instructions: '',
    examType: 'TRYOUT',
    durationMinutes: 45,
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isPublished: true
  })

  // Derived subject options for the Select component
  let subjectOptions = $derived(
    subjects.map(s => ({ value: s.id, label: s.name }))
  )

  const examTypeOptions = [
    { value: 'TRYOUT', label: 'Try Out' },
    { value: 'LATIHAN', label: 'Latihan' },
    { value: 'MID_EXAM', label: 'Mid Exam' },
    { value: 'FINAL_EXAM', label: 'Final Exam' }
  ]

  onMount(async () => {
    subjects = await materialApi.listSubjects()
    form.subjectId = subjects[0]?.id ?? ''
  })

  const handleSubmit = async () => {
    isSubmitting = true
    loadError = null

    try {
      const exam = await examApi.createTeacherExam({
        subjectId: form.subjectId || null,
        title: form.title,
        description: form.description || null,
        instructions: form.instructions || null,
        examType: form.examType as 'TRYOUT' | 'LATIHAN' | 'MID_EXAM' | 'FINAL_EXAM',
        durationMinutes: Number(form.durationMinutes),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isPublished: form.isPublished
      })

      notify.success('Metadata ujian berhasil dibuat. Lanjut ke editor soal...')
      await goto(`/teacher/ujian/${exam.id}/edit`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ujian gagal dibuat'
      loadError = message
      notify.error(message)
    } finally {
      isSubmitting = false
    }
  }
</script>

<section class="space-y-6">
  <div class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <span class="inline-block rounded-lg border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-solid-sm mb-2">
          Panel Guru
        </span>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Susun metadata ujian baru</h1>
        <p class="mt-2 text-sm font-bold text-ink/60">Buat Ujian Baru</p>
      </div>
    </div>

    <div class="mt-6 border-t-2 border-black/10 pt-4">
      <a href="/teacher/ujian" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">
        &larr; Kembali ke Daftar Ujian
      </a>
    </div>
  </div>

  <div class="rounded-2xl border-4 border-black bg-white p-8 shadow-solid space-y-6">
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
      <label class="block text-xs font-black text-black uppercase tracking-wider">Judul Ujian</label>
      <input
        bind:value={form.title}
        class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
        placeholder="Contoh: Try Out Akbar CPNS 2026"
      />
    </div>

    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Deskripsi</label>
      <textarea
        bind:value={form.description}
        rows="4"
        class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
        placeholder="Deskripsi singkat mengenai pelaksanaan ujian..."
      ></textarea>
    </div>

    <div>
      <label class="block text-xs font-black text-black uppercase tracking-wider">Instruksi</label>
      <textarea
        bind:value={form.instructions}
        rows="5"
        class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
        placeholder="Instruksi pengerjaan ujian untuk murid..."
      ></textarea>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div>
        <label class="block text-xs font-black text-black uppercase tracking-wider">Tipe Ujian</label>
        <Select
          options={examTypeOptions}
          bind:value={form.examType}
          placeholder="Pilih Tipe Ujian"
          searchable={false}
          class="mt-2"
        />
      </div>

      <div>
        <label class="block text-xs font-black text-black uppercase tracking-wider">Durasi (menit)</label>
        <input
          type="number"
          bind:value={form.durationMinutes}
          class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
        />
      </div>

      <div>
        <label class="block text-xs font-black text-black uppercase tracking-wider">Waktu Mulai</label>
        <input
          type="datetime-local"
          bind:value={form.startsAt}
          class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
        />
      </div>

      <div>
        <label class="block text-xs font-black text-black uppercase tracking-wider">Waktu Selesai</label>
        <input
          type="datetime-local"
          bind:value={form.endsAt}
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
      <label for="checkbox-is-published" class="text-sm font-extrabold uppercase text-ink cursor-pointer">Publish setelah dibuat</label>
    </div>

    <div class="pt-4">
      <button
        type="button"
        class="rounded-xl border-[3px] border-black bg-neo-green px-6 py-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:pointer-events-none"
        onclick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Menyimpan...' : 'Buat Ujian & Lanjutkan'}
      </button>
    </div>

    {#if loadError}
      <div class="mt-4 rounded-xl border-2 border-black bg-neo-red/20 p-3 text-xs font-bold text-black">
        {loadError}
      </div>
    {/if}
  </div>
</section>
