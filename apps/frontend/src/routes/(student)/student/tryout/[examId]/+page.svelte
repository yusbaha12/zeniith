<!--
Tujuan: Menyediakan halaman detail dan aturan try out murid fase 4.
Caller: Route `/student/tryout/[examId]`.
Dependensi: Exam API frontend.
Main Functions: Memuat detail ujian lalu memulai sesi ketika murid siap masuk ruang ujian.
Side Effects: Melakukan HTTP call ke backend detail ujian dan start session.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendExamDetail } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'

  let { data } = $props<{ data: { examId: string } }>()

  let exam = $state<FrontendExamDetail | null>(null)
  let isLoading = $state(true)
  let actionError = $state<string | null>(null)
  let isStarting = $state(false)

  onMount(async () => {
    try {
      exam = await examApi.getExamDetail(data.examId)
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Detail try out gagal dimuat'
    } finally {
      isLoading = false
    }
  })

  const startExam = async () => {
    isStarting = true
    actionError = null
    try {
      const payload = await examApi.startExam(data.examId)
      await goto(`/student/tryout/${data.examId}/ruang/${payload.session.id}`)
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Gagal memulai ujian'
    } finally {
      isStarting = false
    }
  }
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat detail try out...</section>
{:else if exam}
  <section class="space-y-6">
    <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">{exam.examType}</p>
      <h1 class="mt-3 text-3xl font-extrabold uppercase text-black">{exam.title}</h1>
      {#if exam.description}
        <p class="mt-4 text-sm font-bold leading-7 text-black/70">{exam.description}</p>
      {/if}
    </div>

    <div class="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <p class="text-sm font-extrabold uppercase tracking-[0.22em] text-black/70">Info Ujian</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-black/70">Durasi</p>
            <p class="mt-2 text-lg font-extrabold uppercase text-black">{exam.durationMinutes} menit</p>
          </div>
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-black/70">Jumlah Soal</p>
            <p class="mt-2 text-lg font-extrabold uppercase text-black">{exam.totalQuestions}</p>
          </div>
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-black/70">Mulai</p>
            <p class="mt-2 text-sm font-extrabold text-black">{new Date(exam.startsAt).toLocaleString('id-ID')}</p>
          </div>
          <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-black/70">Selesai</p>
            <p class="mt-2 text-sm font-extrabold text-black">{new Date(exam.endsAt).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <p class="text-sm font-extrabold uppercase tracking-[0.22em] text-black/70">Aturan Ujian</p>
        <ul class="mt-4 list-disc space-y-3 pl-5 text-sm font-bold leading-7 text-black/75">
          <li>Pastikan koneksi internet stabil selama ujian berlangsung.</li>
          <li>Jawaban tersimpan per soal, namun tetap gunakan tombol submit saat selesai.</li>
          <li>Timer berjalan berdasarkan waktu server; jika habis, ujian akan disubmit otomatis.</li>
          <li>Jangan menutup tab selama ujian berlangsung.</li>
        </ul>
        {#if exam.instructions}
          <div class="mt-5 rounded-xl border-4 border-black bg-neo-blue/10 p-4 text-sm font-bold leading-7 text-black/75 shadow-solid-sm">{exam.instructions}</div>
        {/if}
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="rounded-xl border-4 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50" onclick={startExam} disabled={isStarting}>
        {isStarting ? 'Memulai...' : 'Mulai Ujian'}
      </button>
      <a href="/student/tryout" class="rounded-xl border-4 border-black bg-white px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none">Kembali</a>
    </div>

    {#if actionError}
      <div class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-5 text-sm font-extrabold uppercase text-neo-red">{actionError}</div>
    {/if}
  </section>
{/if}

