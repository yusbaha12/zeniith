<!--
Tujuan: Menyediakan halaman daftar ujian guru fase 4.
Caller: Route `/teacher/ujian`.
Dependensi: Exam API frontend.
Main Functions: Mengambil daftar ujian guru dan menyediakan CTA buat atau edit ujian.
Side Effects: Melakukan HTTP call ke backend `/api/teacher/exams`.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type { FrontendTeacherExamListItem } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'

  let exams = $state<FrontendTeacherExamListItem[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  onMount(async () => {
    try {
      exams = await examApi.listTeacherExams()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar ujian guru gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<section class="space-y-6">
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Panel Guru
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Ujian
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Ujian Milik Anda</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Kelola dan pantau seluruh ujian aktif</p>
      </div>
      <div>
        <a href="/teacher/ujian/buat" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">
          Buat Ujian &rarr;
        </a>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat daftar ujian...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if exams.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Belum ada ujian yang Anda buat.</div>
  {:else}
    <div class="space-y-4">
      {#each exams as exam}
        <article class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-lg font-black text-ink uppercase tracking-tight">{exam.title}</p>
              <p class="mt-1 text-sm font-bold text-ink/70">{exam.subjectName ?? 'Umum'} • {exam.examType} • {exam.durationMinutes} menit</p>
              {#if exam.description}
                <p class="mt-2 text-sm font-semibold text-ink/75">{exam.description}</p>
              {/if}
            </div>
            <div class="flex gap-2">
              <a href={`/teacher/ujian/${exam.id}/monitor`} class="rounded-lg border-2 border-black bg-neo-blue px-4 py-2 text-sm font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">Monitor</a>
              <a href={`/teacher/ujian/${exam.id}/edit`} class="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">Edit</a>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

