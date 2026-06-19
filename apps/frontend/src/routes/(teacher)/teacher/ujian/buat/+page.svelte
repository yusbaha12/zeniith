<!--
Tujuan: Menyediakan halaman pembuatan metadata ujian guru fase 4.
Caller: Route `/teacher/ujian/buat`.
Dependensi: Exam API frontend, Material API subject list, dan navigation helper.
Main Functions: Mengumpulkan metadata ujian lalu membuat exam baru sebelum guru menambah soal.
Side Effects: Melakukan HTTP call ke backend `/api/teacher/exams`.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendSubject } from '$lib/domain/types/material.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { materialApi } from '$lib/infrastructure/api/material.api'

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

      await goto(`/teacher/ujian/${exam.id}/edit`)
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Ujian gagal dibuat'
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

  <div class="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur-xl space-y-5">
    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-ink">Mata Pelajaran</span>
      <select bind:value={form.subjectId} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none">
        {#each subjects as subject}
          <option value={subject.id}>{subject.name}</option>
        {/each}
      </select>
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-ink">Judul Ujian</span>
      <input bind:value={form.title} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none" />
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-ink">Deskripsi</span>
      <textarea bind:value={form.description} rows="4" class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none"></textarea>
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-ink">Instruksi</span>
      <textarea bind:value={form.instructions} rows="5" class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none"></textarea>
    </label>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block">
        <span class="mb-2 block text-sm font-semibold text-ink">Tipe Ujian</span>
        <select bind:value={form.examType} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none">
          <option value="TRYOUT">Try Out</option>
          <option value="LATIHAN">Latihan</option>
          <option value="MID_EXAM">Mid Exam</option>
          <option value="FINAL_EXAM">Final Exam</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-2 block text-sm font-semibold text-ink">Durasi (menit)</span>
        <input type="number" bind:value={form.durationMinutes} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none" />
      </label>
      <label class="block">
        <span class="mb-2 block text-sm font-semibold text-ink">Mulai</span>
        <input type="datetime-local" bind:value={form.startsAt} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none" />
      </label>
      <label class="block">
        <span class="mb-2 block text-sm font-semibold text-ink">Selesai</span>
        <input type="datetime-local" bind:value={form.endsAt} class="w-full rounded-2xl border border-lavender/30 px-4 py-3 outline-none" />
      </label>
    </div>

    <label class="flex items-center gap-3 text-sm font-semibold text-ink">
      <input type="checkbox" bind:checked={form.isPublished} />
      Publish setelah dibuat
    </label>

    <button type="button" class="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white" onclick={handleSubmit} disabled={isSubmitting}>
      {isSubmitting ? 'Menyimpan...' : 'Buat Ujian'}
    </button>

    {#if loadError}
      <p class="text-sm font-medium text-red-600">{loadError}</p>
    {/if}
  </div>
</section>

