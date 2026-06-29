<!--
Tujuan: Menyediakan halaman detail materi murid fase 3 untuk video, PDF, teks, latihan, dan feedback XP gamifikasi.
Caller: Route `/student/materi/[materialId]`.
Dependensi: Material API, editor read-only untuk konten teks/exercise, dan helper toast notifikasi.
Main Functions: Mengambil detail materi, menampilkan viewer sesuai type, menandai selesai, dan memberi feedback XP jika reward baru diterapkan.
Side Effects: Melakukan HTTP call ke backend untuk detail materi dan update progress.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import type { FrontendMaterialDetail } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let { data } = $props<{ data: { materialId: string } }>()

  let material = $state<FrontendMaterialDetail | null>(null)
  let isLoading = $state(true)
  let message = $state<string | null>(null)
  let errorMessage = $state<string | null>(null)

  onMount(async () => {
    try {
      material = await materialApi.getMaterialDetail(data.materialId)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Detail materi gagal dimuat'
    } finally {
      isLoading = false
    }
  })

  const markCompleted = async () => {
    if (!material) {
      return
    }

    try {
      const result = await materialApi.trackProgress(material.id, 100, true)
      message = 'Progress materi ditandai selesai.'
      if (result.gamificationReward?.applied) {
        notify.success(`Materi selesai. +${result.gamificationReward.xpDelta ?? 25} XP`)
      } else {
        notify.info('Materi sudah pernah dihitung untuk XP. Progress tetap tersimpan.')
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Progress gagal disimpan'
      notify.error(errorMessage)
    }
  }
</script>

{#if isLoading}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">
    Memuat detail materi...
  </section>
{:else if errorMessage}
  <section class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">
    {errorMessage}
  </section>
{:else if material}
  <section class="space-y-6">
    <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
      <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">{material.materialType}</p>
      <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">{material.title}</h1>
      {#if material.summary}
        <p class="mt-3 text-sm font-bold leading-7 text-black/70">{material.summary}</p>
      {/if}
    </div>

    {#if material.materialType === 'VIDEO' && material.attachmentUrl}
      <video controls class="w-full rounded-xl border-4 border-black bg-black" src={material.attachmentUrl}>
        <track kind="captions" srclang="id" label="Bahasa Indonesia" src="data:text/vtt,WEBVTT" />
      </video>
    {:else if material.materialType === 'PDF' && material.attachmentUrl}
      <iframe title={material.title} src={material.attachmentUrl} class="h-[720px] w-full rounded-xl border-4 border-black bg-white"></iframe>
    {:else}
      <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <MaterialRichEditor content={material.contentJson} editable={false} />
      </div>
    {/if}

    <div class="flex items-center gap-4">
      <button type="button" class="rounded-xl border-4 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none" onclick={markCompleted}>
        Tandai Selesai
      </button>
      {#if message}<p class="mt-4 rounded-md border-2 border-black bg-neo-green p-3 text-sm font-extrabold uppercase text-black">{message}</p>{/if}
    </div>
  </section>
{/if}
