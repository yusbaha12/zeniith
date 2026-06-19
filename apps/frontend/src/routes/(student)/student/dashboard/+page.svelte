<!--
Tujuan: Menyediakan dashboard awal murid fase 1 setelah login berhasil dengan widget rekomendasi belajar adaptif.
Caller: Route `/student/dashboard`.
Dependensi: Data user dari layout server, examApi untuk mengambil rekomendasi.
Main Functions: Menampilkan welcome message, ringkasan profil, dan analisis belajar adaptif dinamis.
Side Effects: Mengambil rekomendasi belajar siswa saat halaman di-load.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { examApi } from '$lib/infrastructure/api/exam.api'

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
  let isLoading = $state(true)

  onMount(async () => {
    try {
      const response = await examApi.getAdaptiveRecommendation()
      if (response && response.success) {
        recommendation = response.data
      }
    } catch (err) {
      console.error('Failed to load recommendation:', err)
    } finally {
      isLoading = false
    }
  })
</script>

<h1 class="text-3xl font-extrabold uppercase text-black">Halo, {data.user.name}</h1>
<p class="mt-3 text-sm font-bold leading-7 text-black/70">Selamat datang kembali di pusat belajar adaptif Anda. Pantau perkembangan dan tingkatkan performa latihan Anda di sini.</p>

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
