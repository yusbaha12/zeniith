<!--
Tujuan: Menyediakan halaman daftar ujian super admin untuk mengelola semua ujian nasional.
Caller: Route `/superadmin/ujian`.
Dependensi: Exam API frontend.
Main Functions: Mengambil daftar semua ujian nasional dan menyediakan navigasi ke halaman kelola soal.
Side Effects: Melakukan HTTP call ke backend `/api/superadmin/exams`.
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
      exams = await examApi.superadminListExams()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar ujian gagal dimuat'
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
            Administrasi Global
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Ujian & Soal
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Kelola Ujian & Soal</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Daftar semua Ujian Nasional & Try Out</p>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat semua daftar ujian...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if exams.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Belum ada ujian/tryout yang terdaftar secara nasional.</div>
  {:else}
    <div class="space-y-4">
      {#each exams as exam}
        <article class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-lg font-black text-ink uppercase tracking-tight">{exam.title}</p>
              <p class="mt-1 text-sm font-bold text-ink/70">{exam.subjectName ?? 'Umum'} • {exam.examType} • {exam.durationMinutes} menit</p>
              <p class="mt-1 text-xs font-bold text-ink/50">Diikuti oleh {exam.participantCount} peserta</p>
              {#if exam.description}
                <p class="mt-2 text-sm font-semibold text-ink/70">{exam.description}</p>
              {/if}
            </div>
            <div class="flex gap-2">
              <a
                href={`/superadmin/ujian/${exam.id}/edit`}
                class="rounded-lg border-2 border-black bg-neo-yellow px-5 py-2.5 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                Kelola Soal Ujian
              </a>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
