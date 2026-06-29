<!--
Tujuan: Menyediakan dashboard awal murid setelah login berhasil dengan widget rekomendasi belajar adaptif dan ringkasan gamifikasi.
Caller: Route `/student/dashboard`.
Dependensi: Data user dari layout server, examApi untuk mengambil rekomendasi, dan gamificationApi untuk snapshot karakter/XP.
Main Functions: Menampilkan welcome message, ringkasan profil, panel gamifikasi, dan analisis belajar adaptif dinamis.
Side Effects: Mengambil rekomendasi belajar dan snapshot gamifikasi siswa saat halaman di-load.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { examApi } from '$lib/infrastructure/api/exam.api'
  import { gamificationApi } from '$lib/infrastructure/api/gamification.api'
  import type { FrontendGamificationSnapshot } from '$lib/domain/types/gamification.types'
  import { getCharacterEvolutionDisplay } from '$lib/domain/utils/gamification.util'

  let { data } = $props()

  interface RecommendedTopic {
    title: string
    difficulty: 'Mudah' | 'Sedang' | 'Sulit'
    estimatedDurationMinutes: number
    icon: string
  }

  interface RecommendationData {
    level: 'PENGUATAN_DASAR' | 'PEMANTAPAN_KONSISTENSI' | 'TANTANGAN_HOTS' | 'AWAL_BELAJAR'
    lastExamTitle: string | null
    lastPercentage: number | null
    message: string
    actionLabel: string
    actionUrl: string
    recommendedTopics: RecommendedTopic[]
  }

  let recommendation = $state<RecommendationData | null>(null)
  let gamification = $state<FrontendGamificationSnapshot | null>(null)
  let isLoading = $state(true)
  let isGamificationLoading = $state(true)

  onMount(async () => {
    try {
      const [recommendationResponse, gamificationResponse] = await Promise.allSettled([
        examApi.getAdaptiveRecommendation(),
        gamificationApi.getMine()
      ])

      if (recommendationResponse.status === 'fulfilled' && recommendationResponse.value?.success) {
        recommendation = recommendationResponse.value.data
      }

      if (gamificationResponse.status === 'fulfilled') {
        gamification = gamificationResponse.value
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      isLoading = false
      isGamificationLoading = false
    }
  })
</script>

<h1 class="text-3xl font-extrabold uppercase text-black">Halo, {data.user.name}</h1>
<p class="mt-3 text-sm font-bold leading-7 text-black/70">Selamat datang kembali di pusat belajar adaptif Anda. Pantau perkembangan dan tingkatkan performa latihan Anda di sini.</p>

<section class="mt-6 rounded-xl border-4 border-black bg-neo-yellow p-5 shadow-solid-md">
  {#if isGamificationLoading}
    <div class="animate-pulse rounded-lg border-4 border-dashed border-black bg-white/70 p-6 text-sm font-extrabold uppercase text-black">
      Memuat progres gamifikasi...
    </div>
  {:else if gamification}
    {@const activeDisplay = getCharacterEvolutionDisplay(gamification.profile.character, gamification.profile.level)}
    <div class="grid gap-5 lg:grid-cols-[280px_1fr] items-stretch">
      <!-- BENTO 1: Karakter (Kiri) -->
      <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-md flex flex-col items-center text-center justify-between h-full">
        <div class="w-full flex flex-col items-center">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black shadow-solid-sm">
            Karakter Aktif
          </span>
          <img src={activeDisplay.imageUrl} alt={activeDisplay.name} class="mt-6 h-36 w-36 rounded-full border-4 border-black object-cover shadow-solid-sm bg-neo-blue/10" />
          <h2 class="mt-5 text-3xl font-black uppercase text-black tracking-tight">{activeDisplay.name}</h2>
          <h3 class="mt-1 text-lg font-black uppercase text-black/60">{activeDisplay.title}</h3>
          <p class="mt-4 text-sm font-bold leading-6 text-black/80">{gamification.profile.character.personality}</p>
        </div>
        <a href="/student/gamifikasi" class="mt-6 inline-flex w-full items-center justify-center rounded-xl border-4 border-black bg-neo-blue px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-solid-sm transition-transform active:translate-y-1 active:shadow-none hover:-translate-y-1 hover:shadow-solid-md">
          Kelola Karakter
        </a>
      </div>

      <!-- BENTO KANAN: Grid bersarang -->
      <div class="grid gap-5 grid-cols-1 md:grid-cols-3 content-start">
        <!-- BENTO 2: Level Progress (Membentang penuh 3 kolom) -->
        <div class="md:col-span-3 rounded-xl border-4 border-black bg-white p-6 shadow-solid-md flex flex-col justify-center">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-solid-sm">
                Progres Belajar
              </span>
              <div class="mt-2 flex items-baseline gap-2">
                <h3 class="text-5xl font-black uppercase tracking-tighter text-black">LV. {gamification.profile.level}</h3>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-black/70">
                <span class="text-lg font-black text-black">{gamification.profile.currentLevelXp}</span> / {gamification.profile.nextLevelXp} XP
              </p>
              <p class="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Menuju Level {gamification.profile.level + 1}</p>
            </div>
          </div>
          <div class="relative mt-5 h-8 w-full overflow-hidden rounded-full border-4 border-black bg-white shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]">
            <div class="h-full bg-neo-blue transition-all duration-1000 ease-out border-r-4 border-black" style={`width: ${gamification.profile.progressPercent}%`}></div>
          </div>
        </div>

        <!-- BENTO 3: Quest Aktif (Membentang 2 kolom) -->
        <div class="md:col-span-2 rounded-xl border-4 border-black bg-neo-blue p-6 shadow-solid-md flex items-center justify-between transition-transform hover:-translate-y-1">
          {#if gamification.activeQuests && gamification.activeQuests.length > 0}
            {@const quest = gamification.activeQuests[0]}
            <div class="text-white pr-4">
              <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-solid-sm">
                Misi Harian
              </span>
              <h3 class="mt-3 text-2xl font-black uppercase leading-none tracking-tight">{quest.title}</h3>
              <p class="mt-2 text-sm font-bold text-white/80">{quest.description}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-4 border-black bg-neo-green shadow-solid-sm">
                <span class="text-xl font-black text-black">+{quest.xpReward}</span>
                <span class="text-[8px] font-black uppercase text-black/70">XP</span>
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-white">{quest.progressValue}/{quest.targetValue} Selesai</p>
            </div>
          {:else}
            <div class="text-white w-full">
              <span class="inline-block rounded-md border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-solid-sm">
                Misi Harian
              </span>
              <p class="mt-4 text-lg font-black uppercase">Semua misi harian telah selesai!</p>
              <p class="mt-1 text-sm font-bold text-white/80">Kembali lagi besok untuk misi baru.</p>
            </div>
          {/if}
        </div>

        <!-- BENTO 4: Streak Aktif (1 kolom, tinggi penuh) -->
        <div class="md:col-span-1 rounded-xl border-4 border-black bg-neo-green p-6 shadow-solid-md flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
          <p class="text-xs font-black uppercase tracking-widest text-black/70">Streak Aktif</p>
          <p class="mt-2 text-5xl font-black text-black">{gamification.profile.currentStreak}</p>
          <p class="mt-1 text-sm font-black uppercase tracking-widest text-black/70">Hari</p>
        </div>

        <!-- BENTO 5: Total XP -->
        <div class="md:col-span-1 rounded-xl border-4 border-black bg-neo-yellow p-4 shadow-solid-md flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-black/70">Total XP</p>
          <p class="mt-1 text-3xl font-black text-black">{gamification.profile.totalXp}</p>
        </div>

        <!-- BENTO 6: Shields -->
        <div class="md:col-span-1 rounded-xl border-4 border-black bg-neo-red p-4 shadow-solid-md flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1 text-white">
          <p class="text-[10px] font-black uppercase tracking-widest text-white/90">Shields Aktif</p>
          <p class="mt-1 text-3xl font-black text-white">{gamification.profile.streakShields}</p>
        </div>

        <!-- BENTO 7: Badge Terbaru -->
        <div class="md:col-span-1 rounded-xl border-4 border-black bg-white p-4 shadow-solid-md flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1">
          {#if gamification.recentBadges && gamification.recentBadges.length > 0}
            <p class="text-[10px] font-black uppercase tracking-widest text-black/70">Badge Terbaru</p>
            <p class="mt-1 text-sm font-black uppercase leading-tight text-black">{gamification.recentBadges[0].name}</p>
          {:else}
            <p class="text-[10px] font-black uppercase tracking-widest text-black/70">Badge Terbaru</p>
            <p class="mt-1 text-sm font-black uppercase text-black/40">Belum Ada</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="rounded-lg border-4 border-black bg-white p-6 text-sm font-extrabold uppercase text-black">
      Panel gamifikasi belum tersedia. Coba muat ulang halaman beberapa saat lagi.
    </div>
  {/if}
</section>

<div class="mt-6 grid gap-4 md:grid-cols-3">
  <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md">
    <p class="text-sm font-extrabold uppercase text-black/70">Role</p>
    <p class="mt-2 text-lg font-extrabold uppercase text-black">{data.user.role}</p>
  </article>
  <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md">
    <p class="text-sm font-extrabold uppercase text-black/70">Email</p>
    <p class="mt-2 text-lg font-extrabold text-black">{data.user.email}</p>
  </article>
  <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md">
    <p class="text-sm font-extrabold uppercase text-black/70">Status Akun</p>
    <p class="mt-2 text-lg font-extrabold uppercase text-black">{data.user.isActive ? 'Aktif' : 'Nonaktif'}</p>
  </article>
</div>

<h2 class="mt-10 text-xl font-extrabold uppercase tracking-tight text-black">Rekomendasi Belajar Pintar</h2>
<p class="mt-1 text-sm font-bold text-black/60">Engine AI memetakan materi belajar yang paling relevan dengan tingkat pemahamanmu saat ini.</p>

{#if isLoading}
  <div class="mt-4 animate-pulse rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-center text-sm font-bold text-black">
    Meningkatkan logika, menganalisa riwayat ujian dan menyusun kurikulum adaptif...
  </div>
{:else}
  <div class="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <!-- Card Kiri: Analisis & Action -->
    <div class="relative overflow-hidden rounded-xl border-4 border-black p-6 shadow-solid-lg transition-transform hover:-translate-y-1 flex flex-col justify-between
                {recommendation?.level === 'PENGUATAN_DASAR' ? 'bg-neo-red text-white' : 
                 recommendation?.level === 'TANTANGAN_HOTS' ? 'bg-neo-blue text-white' :
                 recommendation?.level === 'PEMANTAPAN_KONSISTENSI' ? 'bg-neo-yellow text-black' :
                 'bg-neo-green text-black'}">
      
      <div>
        <!-- Badge Level -->
        <span class="inline-flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-solid-sm">
          ✨ {recommendation?.level?.replace('_', ' ')}
        </span>

        <h3 class="mt-5 text-2xl font-extrabold uppercase">
          {#if recommendation?.level === 'AWAL_BELAJAR'}
            Ayo Mulai Evaluasi Awal!
          {:else}
            Rekomendasi Belajar untuk Anda
          {/if}
        </h3>
        
        <p class="mt-3 text-sm font-bold leading-7 opacity-90">
          {recommendation?.message}
        </p>

        {#if recommendation?.lastPercentage !== null}
          <div class="mt-5 inline-flex items-center gap-3 rounded-md border-2 border-black bg-white px-4 py-2 text-xs font-extrabold uppercase text-black shadow-solid-sm">
            📊 Skor Terakhir: <strong class="text-sm">{recommendation?.lastPercentage}%</strong> ({recommendation?.lastExamTitle})
          </div>
        {/if}
      </div>

      <div class="mt-8">
        <a href={recommendation?.actionUrl} class="inline-flex items-center justify-center rounded-xl border-4 border-black bg-white px-6 py-4 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 hover:shadow-solid-md">
          {recommendation?.actionLabel}
        </a>
      </div>
    </div>

    <!-- Card Kanan: Daftar Topik Rekomendasi -->
    <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg flex flex-col justify-between">
      <div>
        <h4 class="text-base font-extrabold uppercase text-black">Daftar Latihan Rekomendasi</h4>
        <p class="mt-1 text-xs font-bold text-black/65">Topik terpilih yang dirancang khusus untuk tingkat belajarmu saat ini:</p>

        <div class="mt-4 space-y-3">
          {#each recommendation?.recommendedTopics ?? [] as topic}
            <div class="flex items-center justify-between gap-3 rounded-xl border-4 border-black bg-neo-blue/10 p-4 transition-transform hover:-translate-y-1 hover:shadow-solid-sm">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{topic.icon}</span>
                <div>
                  <p class="text-sm font-extrabold uppercase leading-tight text-black">{topic.title}</p>
                  <p class="mt-1 text-xs font-bold text-black/70">Estimasi: {topic.estimatedDurationMinutes} Menit</p>
                </div>
              </div>
              <span class="rounded-md border-2 border-black bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-black shadow-solid-sm">
                {topic.difficulty}
              </span>
            </div>
          {/each}
        </div>
      </div>
      
      <p class="mt-4 text-center text-[10px] font-extrabold uppercase text-black/60 italic">
        *Rekomendasi ini diperbarui secara otomatis setiap kali Anda menyelesaikan Try Out.
      </p>
    </div>
  </div>
{/if}
