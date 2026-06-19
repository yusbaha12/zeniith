<!--
Tujuan: Menyediakan halaman leaderboard murid fase 5 untuk melihat ranking ujian secara realtime.
Caller: Route `/student/leaderboard`.
Dependensi: Exam API frontend, WebSocket client, kontrak WS shared, dan tipe ujian frontend.
Main Functions: Memuat daftar ujian, memilih ujian aktif/selesai, mengambil snapshot leaderboard, lalu sinkron live tanpa refresh.
Side Effects: Melakukan HTTP call ke backend `/api/exams` dan `/api/exams/:id/leaderboard`, serta subscribe event realtime `/ws`.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { CLIENT_EVENTS, SERVER_EVENTS, type LeaderboardUpdatePayload } from '@lms-bimbel/shared'

  import type { FrontendExamListItem, FrontendLeaderboardSnapshot } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { wsClient } from '$lib/infrastructure/websocket/ws.client'

  let exams = $state<FrontendExamListItem[]>([])
  let selectedExamId = $state<string | null>(null)
  let leaderboard = $state<FrontendLeaderboardSnapshot | null>(null)
  let isLoading = $state(true)
  let isLeaderboardLoading = $state(false)
  let loadError = $state<string | null>(null)
  let detachLeaderboardListener: (() => void) | null = null

  const selectExam = async (examId: string) => {
    if (selectedExamId === examId) {
      return
    }

    if (selectedExamId) {
      wsClient.send(CLIENT_EVENTS.LEADERBOARD_UNSUBSCRIBE, {
        examId: selectedExamId,
        sessionId: leaderboard?.currentSessionId ?? null
      })
    }

    selectedExamId = examId
    isLeaderboardLoading = true

    try {
      leaderboard = await examApi.getExamLeaderboard(examId)
      wsClient.send(CLIENT_EVENTS.LEADERBOARD_SUBSCRIBE, {
        examId,
        sessionId: leaderboard.currentSessionId
      })
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Leaderboard gagal dimuat'
    } finally {
      isLeaderboardLoading = false
    }
  }

  onMount(async () => {
    try {
      exams = await examApi.listExams()
      const preferredExam = exams.find((exam) => exam.latestResultPercentage !== null) ?? exams[0] ?? null

      detachLeaderboardListener = wsClient.on(SERVER_EVENTS.LEADERBOARD_UPDATE, (incoming) => {
        const payload = incoming as LeaderboardUpdatePayload

        if (payload.examId !== selectedExamId) {
          return
        }

        leaderboard = payload
      })

      if (preferredExam) {
        await selectExam(preferredExam.id)
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Data leaderboard gagal dimuat'
    } finally {
      isLoading = false
    }
  })

  onDestroy(() => {
    if (selectedExamId) {
      wsClient.send(CLIENT_EVENTS.LEADERBOARD_UNSUBSCRIBE, {
        examId: selectedExamId,
        sessionId: leaderboard?.currentSessionId ?? null
      })
    }

    detachLeaderboardListener?.()
  })
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat leaderboard...</section>
{:else if loadError}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">{loadError}</section>
{:else}
  <section class="space-y-6">
    <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Fase 5 · Real-Time</p>
      <h1 class="mt-3 text-3xl font-extrabold uppercase text-black">Leaderboard Try Out</h1>
      <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-black/70">
        Pantau ranking ujian terbaru tanpa refresh. Pilih ujian di bawah untuk melihat top 10 dan posisi Anda saat ini.
      </p>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
      <aside class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <p class="text-sm font-extrabold uppercase tracking-[0.22em] text-black/50">Pilih Ujian</p>
        <div class="mt-4 space-y-3">
          {#each exams as exam}
            <button
              type="button"
              class={`w-full rounded-xl border-4 px-4 py-4 text-left transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 hover:shadow-solid-sm ${selectedExamId === exam.id ? 'border-black bg-neo-blue/20 text-black' : 'border-black bg-white text-black'}`}
              onclick={() => void selectExam(exam.id)}
            >
              <p class="text-sm font-extrabold uppercase text-black">{exam.title}</p>
              <p class="mt-1 text-xs font-bold text-black/60">{exam.subjectName ?? 'Umum'} · {exam.statusLabel}</p>
              {#if exam.latestResultPercentage !== null}
                <p class="mt-3 inline-block rounded-md border-2 border-black bg-neo-green px-2 py-1 text-xs font-extrabold uppercase text-black shadow-solid-sm">Nilai terakhir Anda: {exam.latestResultPercentage}%</p>
              {/if}
            </button>
          {/each}
        </div>
      </aside>

      <div class="space-y-4">
        {#if isLeaderboardLoading}
          <div class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat snapshot leaderboard...</div>
        {:else if leaderboard}
          <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Snapshot Live</p>
                <h2 class="mt-3 text-2xl font-extrabold uppercase text-black">Top 10 Peserta</h2>
              </div>
              <div class="text-sm font-extrabold text-black/60">
                <p>{leaderboard.totalParticipants} peserta</p>
                <p class="mt-1">Update {new Date(leaderboard.updatedAt).toLocaleTimeString('id-ID')}</p>
              </div>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
                <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Peringkat Anda</p>
                <p class="mt-2 text-3xl font-extrabold uppercase text-black">
                  {leaderboard.currentSessionRank ? `#${leaderboard.currentSessionRank}` : 'Belum ikut'}
                </p>
              </div>
              <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
                <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Mode Sinkron</p>
                <p class="mt-2 text-3xl font-extrabold uppercase text-black">Live</p>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              {#each leaderboard.entries as entry}
                <div class={`flex items-center justify-between rounded-xl border-4 border-black px-4 py-4 shadow-solid-sm ${entry.rank <= 3 ? 'bg-neo-yellow/20' : 'bg-white'}`}>
                  <div>
                    <p class="text-sm font-extrabold uppercase text-black">#{entry.rank} · {entry.name}</p>
                    <p class="mt-1 text-xs font-bold text-black/60">{entry.branchName}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-extrabold uppercase text-black">{entry.percentage}%</p>
                    <p class="text-xs font-bold text-black/60">{entry.score} poin · {entry.durationSeconds} dtk</p>
                  </div>
                </div>
              {/each}
            </div>
          </article>
        {/if}
      </div>
    </div>
  </section>
{/if}
