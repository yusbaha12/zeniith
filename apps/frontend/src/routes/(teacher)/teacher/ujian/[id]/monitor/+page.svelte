<!--
Tujuan: Menyediakan halaman monitor live proctoring ujian untuk pengawas/guru fase 6.
Caller: Route `/teacher/ujian/[id]/monitor`.
Dependensi: Exam API, WebSocket client, shared WS events, Tailwind CSS, toast notification, dan dialog SweetAlert2.
Main Functions: Menampilkan status realtime pengerjaan peserta ujian, log kecurangan, memberi warning manual, force terminate, konfirmasi dialog, dan mengirim feedback via toast.
Side Effects: Melakukan koneksi WebSocket, HTTP get proctor data/log, HTTP post warn/terminate, menampilkan dialog konfirmasi, dan menampilkan toast notification.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { CLIENT_EVENTS, SERVER_EVENTS } from '@lms-bimbel/shared'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { dialog } from '$lib/infrastructure/dialog/dialog'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import { wsClient } from '$lib/infrastructure/websocket/ws.client'

  let { data } = $props<{ data: { examId: string } }>()

  // State Variables
  let participants = $state<any[]>([])
  let examTitle = $state('Live Proctoring Ujian')
  let searchQuery = $state('')
  let statusFilter = $state('ALL')
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

  // Modals state
  let selectedParticipant = $state<any | null>(null)
  let showWarnModal = $state(false)
  let showLogModal = $state(false)
  let warningMessage = $state('Mohon fokus pada halaman ujian dan hindari membuka tab atau aplikasi lain.')
  let proctorLogs = $state<any[]>([])
  let isLoadingLogs = $state(false)

  // WS Detach listener
  let detachAlertListener: (() => void) | null = null

  // Computed / Filtered participants
  const filteredParticipants = $derived(
    participants.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  )

  const activeCount = $derived(participants.filter((p) => p.status === 'ACTIVE').length)
  const terminatedCount = $derived(participants.filter((p) => p.status === 'TERMINATED').length)
  const warningInfractionsCount = $derived(participants.filter((p) => p.warningCount > 0).length)

  // Load initial participant data
  const loadData = async () => {
    isLoading = true
    errorMsg = null
    try {
      // Load exam detail for title
      const examDetail = await examApi.getTeacherExamDetail(data.examId)
      examTitle = examDetail.exam.title

      // Load participants data
      participants = await examApi.getLiveProctorData(data.examId)
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memuat data live monitor'
    } finally {
      isLoading = false
    }
  }

  // Action: Terminate Session
  const handleForceTerminate = async (sessionId: string) => {
    const confirmed = await dialog.confirm({
      title: 'Hentikan Sesi?',
      message: 'Apakah Anda yakin ingin menghentikan sesi ujian murid ini secara paksa? Sesi tidak akan bisa dilanjutkan.',
      confirmText: 'Ya, hentikan'
    })
    if (!confirmed) return

    try {
      await examApi.terminateSession(sessionId)
      notify.success('Sesi ujian murid berhasil dihentikan.')
      // Update local state status to TERMINATED
      participants = participants.map((p) =>
        p.sessionId === sessionId ? { ...p, status: 'TERMINATED' } : p
      )
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menghentikan sesi')
    }
  }

  // Action: Open Warn Modal
  const openWarnModal = (participant: any) => {
    selectedParticipant = participant
    warningMessage = 'Mohon fokus pada halaman ujian dan hindari membuka tab atau aplikasi lain.'
    showWarnModal = true
  }

  // Action: Submit Warn
  const submitWarning = async () => {
    if (!selectedParticipant) return
    try {
      await examApi.warnStudent(selectedParticipant.sessionId, {
        userId: selectedParticipant.userId,
        message: warningMessage
      })
      showWarnModal = false
      // Local warningCount increment
      participants = participants.map((p) =>
        p.sessionId === selectedParticipant.sessionId
          ? { ...p, warningCount: p.warningCount + 1 }
          : p
      )
      notify.success('Peringatan berhasil dikirim ke murid.')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal mengirim peringatan')
    }
  }

  // Action: View Log Modal
  const openLogModal = async (participant: any) => {
    selectedParticipant = participant
    showLogModal = true
    isLoadingLogs = true
    proctorLogs = []
    try {
      proctorLogs = await examApi.getProctorLog(participant.sessionId)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memuat log proctoring')
    } finally {
      isLoadingLogs = false
    }
  }

  onMount(async () => {
    await loadData()

    // 1. Join proctor monitor room via WebSocket
    wsClient.send(CLIENT_EVENTS.PROCTOR_MONITOR, {
      examId: data.examId
    })

    // 2. Listen for realtime proctor alerts from students
    detachAlertListener = wsClient.on(SERVER_EVENTS.PROCTOR_ALERT, (payload: any) => {
      // payload: { sessionId, userId, name, status, warningCount, eventType, message, occurredAt }
      // Update or add participant in list
      const idx = participants.findIndex((p) => p.sessionId === payload.sessionId)
      if (idx !== -1) {
        participants[idx] = {
          ...participants[idx],
          status: payload.status,
          warningCount: payload.warningCount,
          lastHeartbeatAt: new Date().toISOString()
        }
        // Force refresh
        participants = [...participants]
      } else {
        // Participant is new to this monitor session
        participants = [
          ...participants,
          {
            sessionId: payload.sessionId,
            userId: payload.userId,
            name: payload.name,
            branchName: 'Cabang Baru',
            status: payload.status,
            warningCount: payload.warningCount,
            lastHeartbeatAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            submittedAt: null
          }
        ]
      }

      // If viewing log modal for this participant, refresh logs
      if (showLogModal && selectedParticipant?.sessionId === payload.sessionId) {
        examApi.getProctorLog(payload.sessionId).then((logs) => {
          proctorLogs = logs
        })
      }
    })
  })

  onDestroy(() => {
    detachAlertListener?.()
  })

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
</script>

<main class="container mx-auto max-w-7xl px-4 py-8 space-y-8">
  <!-- Header Card -->
  <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between rounded-2xl border-4 border-black bg-white p-8 shadow-solid">
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <a href="/teacher/ujian" class="inline-flex items-center justify-center rounded-lg border-2 border-black bg-white px-3 py-1 text-xs font-black text-black hover:-translate-y-0.5 active:translate-y-0 transition-transform shadow-solid-sm">
          ← Kembali
        </a>
        <span class="rounded-lg border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-black text-black uppercase tracking-wider shadow-solid-sm">Live Monitor</span>
      </div>
      <h1 class="text-3xl font-black uppercase tracking-tight text-ink">{examTitle}</h1>
      <p class="text-sm font-bold text-ink/60">Pantau kehadiran, log aktivitas, dan warning murid secara realtime.</p>
    </div>

    <!-- Live Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-2xl bg-mint/10 border border-mint/20 p-4 text-center">
        <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-mint-800">Aktif</p>
        <p class="mt-1 text-2xl font-black text-mint-800">{activeCount}</p>
      </div>
      <div class="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
        <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-red-700">Pelanggaran</p>
        <p class="mt-1 text-2xl font-black text-red-700">{terminatedCount}</p>
      </div>
      <div class="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center">
        <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-700">Terganggu</p>
        <p class="mt-1 text-2xl font-black text-amber-700">{warningInfractionsCount}</p>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="rounded-[2rem] bg-white/50 p-12 text-center text-ink/60">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-ink border-t-transparent"></div>
      <p class="mt-4 text-sm font-semibold">Menghubungkan ke server monitor...</p>
    </div>
  {:else if errorMsg}
    <div class="rounded-[2.5rem] border border-red-200 bg-red-50 p-8 text-center text-red-600 font-semibold">
      {errorMsg}
      <button onclick={loadData} class="mt-4 block mx-auto rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white">Coba Lagi</button>
    </div>
  {:else}
    <!-- Controls (Search + Filters) -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="w-full md:max-w-md">
        <input
          type="text"
          placeholder="Cari nama murid..."
          bind:value={searchQuery}
          class="w-full rounded-2xl border border-lavender/30 bg-white px-5 py-4 text-sm text-ink outline-none focus:border-ink transition-colors shadow-glow"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs font-bold uppercase tracking-wider text-ink/50">Filter Status:</span>
        <button
          type="button"
          onclick={() => statusFilter = 'ALL'}
          class={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-ink text-white shadow-glow' : 'bg-white border border-lavender/25 text-ink hover:bg-lavender/10'}`}
        >
          Semua
        </button>
        <button
          type="button"
          onclick={() => statusFilter = 'ACTIVE'}
          class={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === 'ACTIVE' ? 'bg-ink text-white shadow-glow' : 'bg-white border border-lavender/25 text-ink hover:bg-lavender/10'}`}
        >
          Aktif
        </button>
        <button
          type="button"
          onclick={() => statusFilter = 'SUBMITTED'}
          class={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === 'SUBMITTED' ? 'bg-ink text-white shadow-glow' : 'bg-white border border-lavender/25 text-ink hover:bg-lavender/10'}`}
        >
          Selesai
        </button>
        <button
          type="button"
          onclick={() => statusFilter = 'TERMINATED'}
          class={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${statusFilter === 'TERMINATED' ? 'bg-ink text-white shadow-glow' : 'bg-white border border-lavender/25 text-ink hover:bg-lavender/10'}`}
        >
          Dihentikan
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/95 shadow-glow backdrop-blur-xl">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-lavender/20 bg-lavender/5 text-ink/60 font-bold">
              <th class="px-6 py-5">Nama Murid</th>
              <th class="px-6 py-5">Status</th>
              <th class="px-6 py-5">Jam Mulai</th>
              <th class="px-6 py-5">Warning Count</th>
              <th class="px-6 py-5">Terakhir Aktif</th>
              <th class="px-6 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-lavender/10">
            {#if filteredParticipants.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-ink/40 font-medium">Tidak ada peserta ujian yang cocok.</td>
              </tr>
            {:else}
              {#each filteredParticipants as participant}
                <tr class="hover:bg-lavender/5 transition-colors">
                  <td class="px-6 py-5">
                    <p class="font-extrabold text-ink">{participant.name}</p>
                    <p class="text-xs text-ink/50 mt-1">{participant.branchName || 'Tanpa Cabang'}</p>
                  </td>
                  <td class="px-6 py-5">
                    {#if participant.status === 'ACTIVE'}
                      <span class="rounded-full bg-mint/10 border border-mint/20 px-3 py-1 text-xs font-extrabold text-mint-800 tracking-wide">Aktif</span>
                    {:else if participant.status === 'SUBMITTED'}
                      <span class="rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-extrabold text-gray-700 tracking-wide">Selesai</span>
                    {:else if participant.status === 'TERMINATED'}
                      <span class="rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-extrabold text-red-700 tracking-wide">Dihentikan</span>
                    {:else}
                      <span class="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-extrabold text-amber-700 tracking-wide">{participant.status}</span>
                    {/if}
                  </td>
                  <td class="px-6 py-5 font-mono text-ink/70">
                    {formatDateTime(participant.startedAt)}
                  </td>
                  <td class="px-6 py-5">
                    <span class={`font-extrabold text-sm ${participant.warningCount >= 4 ? 'text-red-600 animate-pulse' : participant.warningCount >= 2 ? 'text-amber-600' : 'text-ink/70'}`}>
                      {participant.warningCount} / 5
                    </span>
                  </td>
                  <td class="px-6 py-5 font-mono text-ink/60">
                    {formatDateTime(participant.lastHeartbeatAt || participant.startedAt)}
                  </td>
                  <td class="px-6 py-5 text-right space-x-2">
                    <button
                      type="button"
                      onclick={() => openLogModal(participant)}
                      class="rounded-xl border border-lavender/25 bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-lavender/10 hover:scale-95 transition-transform"
                    >
                      Log
                    </button>
                    {#if participant.status === 'ACTIVE'}
                      <button
                        type="button"
                        onclick={() => openWarnModal(participant)}
                        class="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600 hover:scale-95 transition-transform shadow-sm"
                      >
                        Warn
                      </button>
                      <button
                        type="button"
                        onclick={() => handleForceTerminate(participant.sessionId)}
                        class="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 hover:scale-95 transition-transform shadow-sm"
                      >
                        Terminate
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</main>

<!-- Warn Student Modal -->
{#if showWarnModal && selectedParticipant}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
    <div class="w-full max-w-lg rounded-[2.5rem] border border-lavender/20 bg-white p-8 shadow-glow animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-lavender/10 pb-4">
        <h3 class="text-xl font-black text-ink">Kirim Peringatan</h3>
        <button onclick={() => showWarnModal = false} class="text-ink/40 hover:text-ink">✕</button>
      </div>
      
      <div class="mt-6 space-y-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-ink/50">Murid Penerima</p>
          <p class="text-base font-extrabold text-ink mt-1">{selectedParticipant.name}</p>
        </div>

        <div class="space-y-2">
          <label for="warningMessageInput" class="text-xs font-bold uppercase tracking-wider text-ink/50">Pesan Peringatan</label>
          <textarea
            id="warningMessageInput"
            bind:value={warningMessage}
            rows="4"
            class="w-full rounded-2xl border border-lavender/30 p-4 text-sm text-ink outline-none focus:border-ink transition-colors"
          ></textarea>
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="text-xs font-bold text-ink/40 py-1.5">Preset:</span>
          <button
            type="button"
            onclick={() => warningMessage = 'Mohon fokus pada halaman ujian dan hindari membuka tab atau aplikasi lain.'}
            class="rounded-lg bg-lavender/10 px-2.5 py-1.5 text-xs text-ink/70 font-semibold hover:bg-lavender/20"
          >
            Fokus Layar
          </button>
          <button
            type="button"
            onclick={() => warningMessage = 'Peringatan keras: Aktivitas mencurigakan terdeteksi. Sesi Anda dapat dihentikan jika berlanjut.'}
            class="rounded-lg bg-lavender/10 px-2.5 py-1.5 text-xs text-ink/70 font-semibold hover:bg-lavender/20"
          >
            Peringatan Keras
          </button>
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onclick={() => showWarnModal = false}
          class="rounded-xl border border-lavender/20 bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-lavender/10"
        >
          Batal
        </button>
        <button
          type="button"
          onclick={submitWarning}
          class="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-all hover:scale-[0.98] active:scale-95 shadow-glow"
        >
          Kirim Peringatan
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Proctor Logs Modal -->
{#if showLogModal && selectedParticipant}
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
    <div class="w-full max-w-2xl rounded-[2.5rem] border border-lavender/20 bg-white p-8 shadow-glow animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-lavender/10 pb-4">
        <div>
          <h3 class="text-xl font-black text-ink">Log Aktivitas Proctoring</h3>
          <p class="text-xs text-ink/50 mt-1">Sesi Ujian Murid: {selectedParticipant.name}</p>
        </div>
        <button onclick={() => showLogModal = false} class="text-ink/40 hover:text-ink">✕</button>
      </div>

      <div class="mt-6 max-h-[25rem] overflow-y-auto pr-2">
        {#if isLoadingLogs}
          <div class="py-8 text-center text-ink/50">Memuat riwayat log...</div>
        {:else if proctorLogs.length === 0}
          <div class="py-8 text-center text-ink/40 font-medium">Ujian berjalan bersih. Tidak ada pelanggaran tercatat.</div>
        {:else}
          <div class="space-y-4">
            {#each proctorLogs as log}
              <div class="flex gap-4 p-4 rounded-2xl border border-lavender/15 bg-lavender/5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg bg-white border border-lavender/20">
                  {#if log.eventType === 'TAB_SWITCH'}
                    🔀
                  {:else if log.eventType === 'WINDOW_BLUR'}
                    🔌
                  {:else if log.eventType === 'RIGHT_CLICK'}
                    🖱️
                  {:else if log.eventType === 'KEYBOARD_SHORTCUT'}
                    ⌨️
                  {:else if log.eventType === 'COPY_ATTEMPT'}
                    📋
                  {:else}
                    ⚠️
                  {/if}
                </div>
                <div class="space-y-1">
                  <p class="font-extrabold text-ink">{log.eventType}</p>
                  <p class="text-xs text-ink/50">{formatDateTime(log.occurredAt)}</p>
                  {#if log.metadata && Object.keys(log.metadata).length > 0}
                    <pre class="text-[0.65rem] bg-ink/5 p-2 rounded-lg text-ink/70 mt-1 max-w-full overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="mt-8 flex justify-end">
        <button
          type="button"
          onclick={() => showLogModal = false}
          class="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-all hover:scale-[0.98] active:scale-95 shadow-glow"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
