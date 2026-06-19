<!--
Tujuan: Menyediakan ruang ujian murid fase 5 dengan timer sinkron server, navigasi soal, submit jawaban, dan submit akhir.
Caller: Route `/student/tryout/[examId]/ruang/[sessionId]`.
Dependensi: Exam API frontend, WebSocket client, kontrak WS shared, dan komponen editor read-only.
Main Functions: Memuat snapshot sesi, menyimpan jawaban per soal, sinkron timer dari server, dan final submit ujian.
Side Effects: Melakukan HTTP call ke backend snapshot sesi/submit dan subscribe event realtime `/ws`.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onDestroy, onMount } from 'svelte'
  import { CLIENT_EVENTS, SERVER_EVENTS, type ExamTickPayload } from '@lms-bimbel/shared'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import { math } from '$lib/actions/math'
  import type { FrontendExamAnswerSnapshot, FrontendSessionSnapshot } from '$lib/domain/types/exam.types'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { wsClient } from '$lib/infrastructure/websocket/ws.client'

  let { data } = $props<{ data: { examId: string; sessionId: string } }>()

  let snapshot = $state<FrontendSessionSnapshot | null>(null)
  let answers = $state<Record<string, FrontendExamAnswerSnapshot>>({})
  let currentIndex = $state(0)
  let timeLeftSeconds = $state(0)
  let isLoading = $state(true)
  let isSubmitting = $state(false)
  let loadError = $state<string | null>(null)
  let timerHandle: ReturnType<typeof setInterval> | null = null
  let detachTickListener: (() => void) | null = null
  let detachEndedListener: (() => void) | null = null
  let detachWarningListener: (() => void) | null = null
  let detachTerminatedListener: (() => void) | null = null

  // Proctoring State Variables
  let warningMessage = $state<string | null>(null)
  let showWarningModal = $state(false)
  let warningCount = $state(0)
  let isTerminated = $state(false)
  let terminationMessage = $state<string | null>(null)
  let isZenDark = $state(false)

  const currentQuestion = $derived(snapshot?.questions[currentIndex] ?? null)

  // Proctoring Event Handlers
  const blockEvent = (e: Event) => {
    e.preventDefault()
    let eventType: 'RIGHT_CLICK' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' = 'RIGHT_CLICK'
    if (e.type === 'contextmenu') eventType = 'RIGHT_CLICK'
    else if (e.type === 'copy') eventType = 'COPY_ATTEMPT'
    else if (e.type === 'paste') eventType = 'PASTE_ATTEMPT'
    
    wsClient.send(CLIENT_EVENTS.PROCTOR_EVENT, {
      sessionId: data.sessionId,
      eventType,
      metadata: { url: window.location.href }
    })
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const isDevTools = 
      e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
      (e.ctrlKey && e.key === 'u')
    
    const isCopyPaste = e.ctrlKey && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())

    if (isDevTools || isCopyPaste) {
      e.preventDefault()
      wsClient.send(CLIENT_EVENTS.PROCTOR_EVENT, {
        sessionId: data.sessionId,
        eventType: 'KEYBOARD_SHORTCUT',
        metadata: { key: e.key, code: e.code }
      })
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      wsClient.send(CLIENT_EVENTS.PROCTOR_EVENT, {
        sessionId: data.sessionId,
        eventType: 'TAB_SWITCH',
        metadata: { url: window.location.href }
      })
    }
  }

  const handleWindowBlur = () => {
    wsClient.send(CLIENT_EVENTS.PROCTOR_EVENT, {
      sessionId: data.sessionId,
      eventType: 'WINDOW_BLUR',
      metadata: { url: window.location.href }
    })
  }

  const extractPlainText = (content: Record<string, unknown> | null | undefined): string => {
    if (!content) {
      return ''
    }

    const walk = (node: any): string[] => {
      if (!node) {
        return []
      }

      const own = typeof node.text === 'string' ? [node.text] : []
      const children = Array.isArray(node.content) ? node.content.flatMap(walk) : []
      return [...own, ...children]
    }

    return walk(content).join(' ').trim()
  }

  const syncTimer = (expiresAt: string) => {
    const refresh = () => {
      timeLeftSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))

      if (timeLeftSeconds <= 0 && snapshot?.session.status === 'ACTIVE' && !isSubmitting) {
        void finishExam(true)
      }
    }

    refresh()
    timerHandle = setInterval(refresh, 1000)
  }

  const loadSnapshot = async () => {
    isLoading = true
    loadError = null

    try {
      snapshot = await examApi.getSessionSnapshot(data.sessionId)
      answers = Object.fromEntries(snapshot.answers.map((answer) => [answer.questionId, answer]))
      
      // Update warning count based on loaded session snapshot
      warningCount = snapshot.session.warningCount

      if (snapshot.session.status === 'ACTIVE') {
        syncTimer(snapshot.session.expiresAt)
      } else if (snapshot.session.status === 'TERMINATED') {
        isTerminated = true
        terminationMessage = 'Sesi ujian Anda dihentikan karena terdeteksi pelanggaran proctoring.'
        setTimeout(() => {
          goto(`/student/tryout/${data.examId}/hasil/${data.sessionId}`)
        }, 3000)
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Ruang ujian gagal dimuat'
    } finally {
      isLoading = false
    }
  }


  onMount(async () => {
    await loadSnapshot()

    detachTickListener = wsClient.on(SERVER_EVENTS.EXAM_TICK, (payload) => {
      const tick = payload as ExamTickPayload

      if (tick.sessionId !== data.sessionId) {
        return
      }

      timeLeftSeconds = tick.timeLeft

      if (tick.timeLeft <= 0 && snapshot?.session.status === 'ACTIVE' && !isSubmitting) {
        void finishExam(true)
      }
    })

    detachEndedListener = wsClient.on(SERVER_EVENTS.EXAM_ENDED, (payload) => {
      const ended = payload as ExamTickPayload

      if (ended.sessionId !== data.sessionId) {
        return
      }

      if (!isSubmitting) {
        void finishExam(true)
      }
    })

    // Listen to proctor warnings
    detachWarningListener = wsClient.on(SERVER_EVENTS.EXAM_WARNING, (payload: any) => {
      warningMessage = payload.message
      warningCount = payload.warningCount
      showWarningModal = true
    })

    // Listen to proctor termination
    detachTerminatedListener = wsClient.on(SERVER_EVENTS.PROCTOR_TERMINATED, (payload: any) => {
      isTerminated = true
      terminationMessage = payload.message
      if (timerHandle) {
        clearInterval(timerHandle)
      }
      setTimeout(() => {
        goto(`/student/tryout/${data.examId}/hasil/${data.sessionId}`)
      }, 5000)
    })

    // Register browser-side proctoring detectors
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('contextmenu', blockEvent)
    document.addEventListener('copy', blockEvent)
    document.addEventListener('paste', blockEvent)
    window.addEventListener('keydown', handleKeydown)

    wsClient.send(CLIENT_EVENTS.EXAM_JOIN, {
      sessionId: data.sessionId
    })
  })

  onDestroy(() => {
    if (timerHandle) {
      clearInterval(timerHandle)
    }

    // Unregister browser-side proctoring detectors
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('copy', blockEvent)
      document.removeEventListener('paste', blockEvent)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('contextmenu', blockEvent)
      window.removeEventListener('keydown', handleKeydown)
    }

    wsClient.send(CLIENT_EVENTS.EXAM_LEAVE, {
      sessionId: data.sessionId
    })
    detachTickListener?.()
    detachEndedListener?.()
    detachWarningListener?.()
    detachTerminatedListener?.()
  })

  const submitAnswer = async (questionId: string, selectedOptionId: string | null, answerText: string | null = null, isMarkedDoubt = false) => {
    answers[questionId] = {
      questionId,
      selectedOptionId,
      answerText,
      isMarkedDoubt
    }

    await examApi.submitAnswer(data.sessionId, {
      questionId,
      selectedOptionId,
      answerText,
      isMarkedDoubt,
      idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${questionId}-${Date.now()}`
    })
  }

  const toggleDoubt = async (questionId: string) => {
    const current = answers[questionId]
    await submitAnswer(
      questionId,
      current?.selectedOptionId ?? null,
      current?.answerText ?? null,
      !current?.isMarkedDoubt
    )
  }

  const finishExam = async (auto = false) => {
    if (isSubmitting) {
      return
    }

    isSubmitting = true
    try {
      await examApi.submitExam(data.sessionId)
    } catch {
      if (!auto) {
        throw new Error('Submit ujian gagal diproses')
      }
    } finally {
      await goto(`/student/tryout/${data.examId}/hasil/${data.sessionId}`)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat ruang ujian...</section>
{:else if loadError}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">{loadError}</section>
{:else if snapshot}
  <section class={isZenDark ? 'dark fixed inset-0 z-[990] overflow-y-auto bg-slate-950 p-6 lg:p-12 space-y-6 transition-all duration-300 text-slate-100' : 'space-y-6 transition-all duration-300'}>
    <div class={isZenDark ? 'max-w-6xl mx-auto space-y-6' : 'space-y-6'}>
      <div class="flex flex-col gap-4 rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg lg:flex-row lg:items-center lg:justify-between dark:bg-slate-900 dark:border-white">
        <div>
          <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm dark:bg-yellow-400 dark:text-black">Zen Mode Ujian</p>
          <h1 class="mt-3 text-2xl font-extrabold uppercase text-black dark:text-white">{snapshot.exam.title}</h1>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <button
            type="button"
            class={`flex items-center gap-2 rounded-xl border-4 px-4 py-2.5 text-sm font-extrabold uppercase shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
              isZenDark 
                ? 'border-white bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:text-yellow-300' 
                : 'border-black bg-neo-blue/10 text-black hover:bg-neo-blue/20'
            }`}
            onclick={() => (isZenDark = !isZenDark)}
          >
            {#if isZenDark}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M9.75 12h.008v.008H9.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM12 5.25a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM3.75 12h2.25m13.5 0h2.25M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591" />
              </svg>
              <span>Mode Terang</span>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
              <span>Mode Gelap</span>
            {/if}
          </button>
          
          <div class="rounded-xl border-4 border-black bg-neo-red px-5 py-3 text-center text-white shadow-solid-sm dark:border-white dark:bg-slate-800">
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-white/90">Sisa Waktu</p>
            <p class="mt-1 text-2xl font-extrabold uppercase text-white">{formatTime(timeLeftSeconds)}</p>
          </div>
        </div>
      </div>

      {#if snapshot.session.status !== 'ACTIVE'}
        <div class="rounded-xl border-4 border-black bg-neo-yellow p-6 text-sm font-extrabold uppercase text-black dark:bg-amber-950 dark:border-amber-500 dark:text-amber-400 shadow-solid-sm">
          Sesi ini sudah tidak aktif. Anda akan diarahkan ke halaman hasil.
          <div class="mt-4">
            <a href={`/student/tryout/${data.examId}/hasil/${data.sessionId}`} class="rounded-xl border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 dark:bg-slate-800 dark:border-white dark:text-white">Lihat Hasil</a>
          </div>
        </div>
      {:else}
        <div class="grid gap-6 xl:grid-cols-[0.26fr_0.74fr]">
          <aside class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-lg dark:bg-slate-900 dark:border-white">
            <p class="text-sm font-extrabold uppercase tracking-[0.22em] text-black/70 dark:text-slate-400">Navigasi Soal</p>
            <div class="mt-4 grid grid-cols-5 gap-3">
              {#each snapshot.questions as question, index}
                <button
                  type="button"
                  class={`rounded-xl border-4 px-3 py-3 text-sm font-extrabold shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none ${
                    index === currentIndex 
                      ? 'border-black bg-neo-green text-black dark:border-white dark:bg-white dark:text-black' 
                      : answers[question.id]?.selectedOptionId || answers[question.id]?.answerText 
                        ? 'border-black bg-neo-blue/20 text-black dark:border-white dark:bg-slate-700 dark:text-white' 
                        : 'border-black bg-white text-black dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  onclick={() => (currentIndex = index)}
                >
                  {index + 1}
                </button>
              {/each}
            </div>
          </aside>

          <div class="space-y-5">
            {#if currentQuestion}
              <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg dark:bg-slate-900 dark:border-white">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="inline-block rounded-md border-2 border-black bg-neo-red px-2 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-solid-sm dark:bg-rose-600">Soal {currentIndex + 1}</p>
                    <p class="mt-2 text-sm font-bold text-black/70 dark:text-slate-400">Bobot {currentQuestion.score} poin</p>
                  </div>
                  <button 
                    type="button" 
                    class={`rounded-xl border-4 px-4 py-2 text-sm font-extrabold uppercase shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none ${
                      answers[currentQuestion.id]?.isMarkedDoubt 
                        ? 'border-black bg-neo-yellow text-black dark:border-amber-500 dark:bg-amber-600 dark:text-white' 
                        : 'border-black bg-white text-black dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`} 
                    onclick={() => void toggleDoubt(currentQuestion.id)}
                  >
                    {answers[currentQuestion.id]?.isMarkedDoubt ? 'Ditandai Ragu' : 'Tandai Ragu'}
                  </button>
                </div>

                <div class="mt-5">
                  <MaterialRichEditor content={currentQuestion.contentJson} editable={false} />
                </div>

                <div class="mt-6 space-y-3">
                  {#each currentQuestion.options as option}
                    <button
                      type="button"
                      class={`flex w-full items-start gap-3 rounded-xl border-4 px-4 py-4 text-left text-sm font-bold transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-solid-sm ${
                        answers[currentQuestion.id]?.selectedOptionId === option.id 
                          ? 'border-black bg-neo-green text-black dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-white' 
                          : 'border-black bg-white text-black dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                      onclick={() => void submitAnswer(currentQuestion.id, option.id)}
                    >
                      <span class="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border-2 border-black bg-white font-extrabold uppercase text-black shadow-solid-sm dark:bg-slate-700 dark:text-slate-200">{option.optionKey}</span>
                      <span use:math={option.contentJson} class="leading-7 dark:text-slate-200"></span>
                    </button>
                  {/each}
                </div>
              </article>
            {/if}

            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex gap-3">
                <button type="button" class="rounded-xl border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white" onclick={() => (currentIndex = Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>Sebelumnya</button>
                <button type="button" class="rounded-xl border-4 border-black bg-white px-4 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white" onclick={() => (currentIndex = Math.min((snapshot?.questions.length ?? 1) - 1, currentIndex + 1))} disabled={currentIndex === (snapshot?.questions.length ?? 1) - 1}>Berikutnya</button>
              </div>
              <button type="button" class="rounded-xl border-4 border-black bg-neo-red px-5 py-3 text-sm font-extrabold uppercase text-white shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 dark:border-white dark:bg-rose-600" onclick={() => void finishExam()} disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Submit Ujian'}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}

{#if showWarningModal}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
    <div class="w-full max-w-md rounded-xl border-4 border-black bg-white p-8 text-center shadow-solid-lg animate-in fade-in zoom-in-95 duration-200">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border-4 border-black bg-neo-yellow text-3xl shadow-solid-sm">
        ⚠️
      </div>
      <h3 class="mt-5 text-xl font-extrabold uppercase text-black">Pelanggaran Proctoring</h3>
      <p class="mt-3 text-sm font-bold leading-relaxed text-black/70">
        {warningMessage || 'Sistem mendeteksi aktivitas mencurigakan.'}
      </p>
      <div class="mt-5 inline-block rounded-xl border-4 border-black bg-neo-blue/10 px-5 py-3 shadow-solid-sm">
        <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-black">
          Peringatan: {warningCount} / 5
        </p>
      </div>
      <button
        type="button"
        class="mt-6 w-full rounded-xl border-4 border-black bg-neo-green py-3.5 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 hover:-translate-y-1"
        onclick={() => showWarningModal = false}
      >
        Saya Mengerti & Kembali Ujian
      </button>
    </div>
  </div>
{/if}

{#if isTerminated}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-lg">
    <div class="w-full max-w-lg rounded-xl border-4 border-black bg-white p-10 text-center shadow-solid-lg animate-in fade-in zoom-in-95 duration-300">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-xl border-4 border-black bg-neo-red text-4xl shadow-solid-sm">
        🛑
      </div>
      <h3 class="mt-6 text-2xl font-extrabold uppercase text-black">Ujian Dihentikan Paksa</h3>
      <p class="mt-3 text-sm font-bold leading-relaxed text-black/75">
        {terminationMessage || 'Sesi ujian Anda telah dinonaktifkan oleh pengawas atau sistem karena melanggar aturan proctoring.'}
      </p>
      <div class="mt-6 inline-block rounded-xl border-4 border-black bg-neo-red/10 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.2em] text-neo-red shadow-solid-sm animate-pulse">
        Mengarahkan ke Halaman Hasil...
      </div>
    </div>
  </div>
{/if}

