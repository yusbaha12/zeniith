<!--
Tujuan: Menyediakan halaman hasil ujian murid fase 5 dengan ringkasan skor, rank, dan leaderboard realtime.
Caller: Route `/student/tryout/[examId]/hasil/[sessionId]`.
Dependensi: Exam API frontend, WebSocket client, kontrak WS shared, dan editor read-only.
Main Functions: Mengambil hasil ujian final lalu menampilkan skor, rank, leaderboard live, dan pembahasan per soal.
Side Effects: Melakukan HTTP call ke backend `/api/sessions/:id/result` dan subscribe event realtime leaderboard.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { CLIENT_EVENTS, SERVER_EVENTS, type LeaderboardUpdatePayload } from '@lms-bimbel/shared'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import type { FrontendExamResultPayload } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { wsClient } from '$lib/infrastructure/websocket/ws.client'

  let { data } = $props<{ data: { examId: string; sessionId: string } }>()

  let payload = $state<FrontendExamResultPayload | null>(null)
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)
  let detachLeaderboardListener: (() => void) | null = null

  onMount(async () => {
    try {
      payload = await examApi.getExamResult(data.sessionId)

      detachLeaderboardListener = wsClient.on(SERVER_EVENTS.LEADERBOARD_UPDATE, (incoming) => {
        const leaderboard = incoming as LeaderboardUpdatePayload

        if (!payload || leaderboard.examId !== payload.exam.id) {
          return
        }

        payload = {
          ...payload,
          leaderboard
        }
      })

      wsClient.send(CLIENT_EVENTS.LEADERBOARD_SUBSCRIBE, {
        examId: data.examId,
        sessionId: data.sessionId
      })
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Hasil ujian gagal dimuat'
    } finally {
      isLoading = false
    }
  })

  onDestroy(() => {
    wsClient.send(CLIENT_EVENTS.LEADERBOARD_UNSUBSCRIBE, {
      examId: data.examId,
      sessionId: data.sessionId
    })
    detachLeaderboardListener?.()
  })
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat hasil ujian...</section>
{:else if loadError}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">{loadError}</section>
{:else if payload}
  <section class="space-y-6">
    <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Hasil Ujian</p>
      <h1 class="mt-3 text-3xl font-extrabold uppercase text-black">{payload.exam.title}</h1>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <article class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
        <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Skor</p>
        <p class="mt-2 text-3xl font-extrabold uppercase text-black">{payload.result.score}/{payload.result.maxScore}</p>
      </article>
      <article class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
        <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Persentase</p>
        <p class="mt-2 text-3xl font-extrabold uppercase text-black">{payload.result.percentage}%</p>
      </article>
      <article class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
        <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Benar</p>
        <p class="mt-2 text-3xl font-extrabold uppercase text-neo-green">{payload.result.correctAnswers}</p>
      </article>
      <article class="rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
        <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black/70">Salah</p>
        <p class="mt-2 text-3xl font-extrabold uppercase text-neo-red">{payload.result.wrongAnswers}</p>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.36fr_0.64fr]">
      <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <p class="text-xs font-extrabold uppercase tracking-[0.24em] text-black/70">Peringkat Anda</p>
        <p class="mt-3 text-5xl font-extrabold uppercase text-black">
          {payload.leaderboard.currentSessionRank ? `#${payload.leaderboard.currentSessionRank}` : '—'}
        </p>
        <p class="mt-2 text-sm font-bold text-black/70">
          dari {payload.leaderboard.totalParticipants} peserta
        </p>
        <p class="mt-4 text-xs font-bold text-black/50">
          Sinkron live {new Date(payload.leaderboard.updatedAt).toLocaleTimeString('id-ID')}
        </p>
      </article>

      <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Leaderboard Live</p>
            <h2 class="mt-3 text-2xl font-extrabold uppercase text-black">Top 10 Ujian Ini</h2>
          </div>
          <p class="text-sm font-extrabold text-black/60">{payload.leaderboard.totalParticipants} peserta</p>
        </div>

        <div class="mt-5 space-y-3">
          {#each payload.leaderboard.entries as entry}
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
    </div>

    <div class="space-y-4">
      {#each payload.review as item, index}
        <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg transition-transform hover:-translate-y-1 hover:shadow-solid-md">
          <p class="inline-block rounded-md border-2 border-black bg-neo-red px-2 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-solid-sm">Review Soal {index + 1}</p>
          <div class="mt-4">
            <MaterialRichEditor content={item.contentJson} editable={false} />
          </div>
          {#if item.explanationJson}
            <div class="mt-5 rounded-xl border-4 border-black bg-neo-blue/10 p-5 shadow-solid-sm">
              <p class="text-sm font-extrabold uppercase tracking-[0.2em] text-black">Pembahasan</p>
              <div class="mt-3">
                <MaterialRichEditor content={item.explanationJson} editable={false} />
              </div>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}
