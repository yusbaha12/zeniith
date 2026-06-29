<!--
Tujuan: Menyediakan halaman gamifikasi murid untuk memilih karakter dan memantau XP, streak, badge, serta quest.
Caller: Route `/student/gamifikasi`.
Dependensi: gamificationApi dan tipe gamifikasi frontend.
Main Functions: Mengambil snapshot gamifikasi, mengganti karakter aktif, menampilkan level progress, badge terbaru, dan quest aktif.
Side Effects: Melakukan HTTP call GET/PATCH ke backend gamifikasi.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type {
    FrontendGamificationSnapshot,
    GamificationCharacterCode
  } from '$lib/domain/types/gamification.types'
  import { gamificationApi } from '$lib/infrastructure/api/gamification.api'
  import { notify } from '$lib/infrastructure/notifications/notify'
  import { getCharacterEvolutionDisplay } from '$lib/domain/utils/gamification.util'

  let snapshot = $state<FrontendGamificationSnapshot | null>(null)
  let isLoading = $state(true)
  let isSaving = $state(false)
  let errorMessage = $state<string | null>(null)

  const loadSnapshot = async () => {
    isLoading = true
    errorMessage = null

    try {
      snapshot = await gamificationApi.getMine()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Gagal memuat gamifikasi'
    } finally {
      isLoading = false
    }
  }

  const chooseCharacter = async (characterCode: GamificationCharacterCode) => {
    if (!snapshot || snapshot.profile.characterCode === characterCode || isSaving) {
      return
    }

    isSaving = true
    errorMessage = null

    try {
      snapshot = await gamificationApi.chooseCharacter(characterCode)
      notify.success('Karakter berhasil diperbarui')
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui karakter'
      notify.error(errorMessage)
    } finally {
      isSaving = false
    }
  }

  const questProgressPercent = (progressValue: number, targetValue: number) =>
    targetValue > 0 ? Math.min(100, Math.round((progressValue / targetValue) * 100)) : 0

  onMount(loadSnapshot)
</script>

<h1 class="text-3xl font-extrabold uppercase text-black">Gamifikasi Belajar</h1>
<p class="mt-3 text-sm font-bold leading-7 text-black/70">Pilih karakter, pantau level, kumpulkan badge, dan selesaikan quest belajar secara konsisten.</p>

{#if isLoading}
  <div class="mt-6 animate-pulse rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-center text-sm font-extrabold uppercase text-black">
    Memuat dunia belajar Anda...
  </div>
{:else if errorMessage}
  <div class="mt-6 rounded-xl border-4 border-black bg-neo-red p-6 text-sm font-extrabold uppercase text-black shadow-solid-sm">
    {errorMessage}
  </div>
{:else if snapshot}
  {@const activeDisplay = getCharacterEvolutionDisplay(snapshot.profile.character, snapshot.profile.level)}
  <section class="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
    <div class="rounded-xl border-4 border-black bg-neo-yellow p-6 shadow-solid-md">
      <p class="text-xs font-extrabold uppercase text-black/60">Karakter Aktif</p>
      <div class="mt-4 flex flex-col md:flex-row items-center md:items-start gap-6">
        <img src={activeDisplay.imageUrl} alt={activeDisplay.name} class="h-32 w-32 rounded-xl border-4 border-black object-cover shadow-solid-sm bg-white" />
        <div>
          <h2 class="text-3xl font-black uppercase text-black">{activeDisplay.name} - {activeDisplay.title}</h2>
          <p class="mt-3 max-w-2xl text-sm font-bold leading-7 text-black/75">{snapshot.profile.character.personality}</p>
          <p class="mt-2 text-xs font-bold text-black/60 italic">Kondisi saat ini: {activeDisplay.visualCue}</p>
        </div>
      </div>

      <div class="mt-6 h-5 overflow-hidden rounded-full border-4 border-black bg-white">
        <div class="h-full bg-neo-blue" style={`width: ${snapshot.profile.progressPercent}%`}></div>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-black uppercase text-black">
        <span>Level {snapshot.profile.level}</span>
        <span>{snapshot.profile.currentLevelXp} / {snapshot.profile.nextLevelXp} XP</span>
      </div>
    </div>

    <div class="grid gap-3">
      <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm">
        <p class="text-xs font-extrabold uppercase text-black/60">Total XP</p>
        <p class="mt-2 text-3xl font-black text-black">{snapshot.profile.totalXp}</p>
      </article>
      <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm">
        <p class="text-xs font-extrabold uppercase text-black/60">Streak Saat Ini</p>
        <p class="mt-2 text-3xl font-black text-black">{snapshot.profile.currentStreak} Hari</p>
      </article>
      <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm">
        <p class="text-xs font-extrabold uppercase text-black/60">Pelindung Streak</p>
        <p class="mt-2 text-3xl font-black text-black">{snapshot.profile.streakShields}</p>
      </article>
    </div>
  </section>

  <section class="mt-8">
    <h2 class="text-xl font-extrabold uppercase text-black">Pilih Karakter</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {#each snapshot.characters as character}
        {@const charDisplay = getCharacterEvolutionDisplay(character, snapshot.profile.level)}
        <button
          type="button"
          disabled={isSaving}
          onclick={() => chooseCharacter(character.code)}
          class="rounded-xl border-4 border-black p-5 text-left shadow-solid-sm transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 {snapshot.profile.characterCode === character.code ? 'bg-neo-blue text-white' : 'bg-white text-black'}"
        >
          <div class="flex justify-between items-start">
            <span class="inline-flex rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-[10px] font-black uppercase text-black shadow-solid-sm">
              {character.code}
            </span>
            <img src={charDisplay.imageUrl} alt={character.name} class="h-16 w-16 rounded-full border-2 border-black object-cover bg-white shadow-solid-sm" />
          </div>
          <h3 class="mt-4 text-lg font-black uppercase">{character.name}</h3>
          <p class="mt-1 text-xs font-black uppercase opacity-90">{charDisplay.title}</p>
          <p class="mt-3 text-sm font-bold leading-6 opacity-85">{charDisplay.visualCue}</p>
          <p class="mt-4 text-xs font-black uppercase">
            {snapshot.profile.characterCode === character.code ? 'Sedang Dipakai' : 'Pilih Karakter'}
          </p>
        </button>
      {/each}
    </div>
  </section>

  <section class="mt-8 grid gap-6 lg:grid-cols-2">
    <div>
      <h2 class="text-xl font-extrabold uppercase text-black">Quest Aktif</h2>
      <div class="mt-4 space-y-3">
        {#if snapshot.activeQuests.length === 0}
          <div class="rounded-xl border-4 border-dashed border-black bg-white p-6 text-sm font-bold text-black/70">
            Quest aktif belum tersedia. Fondasi quest sudah siap untuk fase G3.
          </div>
        {:else}
          {#each snapshot.activeQuests as quest}
            <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-black uppercase text-black/60">{quest.type} - {quest.xpReward} XP</p>
                  <h3 class="mt-1 text-base font-black uppercase text-black">{quest.title}</h3>
                  <p class="mt-2 text-sm font-bold leading-6 text-black/70">{quest.description}</p>
                </div>
                <span class="rounded-md border-2 border-black bg-neo-green px-2 py-1 text-[10px] font-black uppercase text-black">
                  {quest.status}
                </span>
              </div>
              <div class="mt-4 h-4 overflow-hidden rounded-full border-4 border-black bg-white">
                <div class="h-full bg-neo-blue" style={`width: ${questProgressPercent(quest.progressValue, quest.targetValue)}%`}></div>
              </div>
              <p class="mt-2 text-xs font-black uppercase text-black/60">{quest.progressValue} / {quest.targetValue}</p>
            </article>
          {/each}
        {/if}
      </div>
    </div>

    <div>
      <h2 class="text-xl font-extrabold uppercase text-black">Badge Terbaru</h2>
      <div class="mt-4 space-y-3">
        {#if snapshot.recentBadges.length === 0}
          <div class="rounded-xl border-4 border-dashed border-black bg-white p-6 text-sm font-bold text-black/70">
            Badge belum terkumpul. Badge akan muncul otomatis setelah reward event fase G2 aktif.
          </div>
        {:else}
          {#each snapshot.recentBadges as badge}
            <article class="rounded-xl border-4 border-black bg-white p-5 shadow-solid-sm">
              <p class="text-[10px] font-black uppercase text-black/60">{badge.category} - {badge.tier}</p>
              <h3 class="mt-1 text-base font-black uppercase text-black">{badge.name}</h3>
              <p class="mt-2 text-sm font-bold leading-6 text-black/70">{badge.description}</p>
            </article>
          {/each}
        {/if}
      </div>
    </div>
  </section>
{/if}
