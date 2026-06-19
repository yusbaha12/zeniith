<!--
Tujuan: Menyediakan halaman daftar try out murid fase 4.
Caller: Route `/student/tryout`.
Dependensi: Exam API frontend.
Main Functions: Mengambil daftar ujian, menampilkan status jadwal, dan menyediakan CTA ke detail atau ruang ujian.
Side Effects: Melakukan HTTP call ke backend `/api/exams`.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { FrontendExamListItem } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'

  let exams = $state<FrontendExamListItem[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  onMount(async () => {
    try {
      exams = await examApi.listExams()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar try out gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<section class="space-y-6">
  <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Try Out</p>
    <h1 class="mt-3 text-3xl font-extrabold uppercase text-black">Daftar ujian yang bisa Anda ikuti</h1>
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat daftar try out...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">{loadError}</div>
  {:else if exams.length === 0}
    <div class="rounded-xl border-4 border-dashed border-black bg-white p-8 text-sm font-bold text-black">Belum ada try out yang tersedia.</div>
  {:else}
    <div class="grid gap-4 xl:grid-cols-2">
      {#each exams as exam}
        <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg transition-transform hover:-translate-y-1 hover:shadow-solid-md">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">{exam.examType}</p>
              <h2 class="mt-3 text-xl font-extrabold uppercase text-black">{exam.title}</h2>
              <p class="mt-2 text-sm font-bold text-black/70">{exam.subjectName ?? 'Umum'} • {exam.durationMinutes} menit</p>
            </div>
            <span class={`rounded-md border-2 border-black px-3 py-1 text-xs font-extrabold uppercase shadow-solid-sm ${exam.statusLabel === 'BERLANGSUNG' ? 'bg-neo-green text-black' : exam.statusLabel === 'AKAN_DATANG' ? 'bg-neo-yellow text-black' : 'bg-white text-black'}`}>
              {exam.statusLabel}
            </span>
          </div>

          {#if exam.description}
            <p class="mt-4 text-sm font-bold leading-7 text-black/70">{exam.description}</p>
          {/if}

          <div class="mt-5 grid gap-3 md:grid-cols-3">
            <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
              <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-black/70">Soal</p>
              <p class="mt-2 text-lg font-extrabold uppercase text-black">{exam.totalQuestions}</p>
            </div>
            <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
              <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-black/70">Skor</p>
              <p class="mt-2 text-lg font-extrabold uppercase text-black">{exam.totalScore}</p>
            </div>
            <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
              <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-black/70">Hasil Terakhir</p>
              <p class="mt-2 text-lg font-extrabold uppercase text-black">{exam.latestResultPercentage ?? '-'}{exam.latestResultPercentage !== null ? '%' : ''}</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <a href={`/student/tryout/${exam.id}`} class="rounded-xl border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none">Lihat Detail</a>
            {#if exam.activeSessionId}
              <button type="button" class="rounded-xl border-4 border-black bg-neo-green px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none" onclick={() => goto(`/student/tryout/${exam.id}/ruang/${exam.activeSessionId}`)}>Lanjutkan Ujian</button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

