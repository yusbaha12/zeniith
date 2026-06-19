<!--
Tujuan: Menyediakan halaman ruang belajar murid fase 3 dengan daftar subject, modul, dan materi.
Caller: Route `/student/materi`.
Dependensi: Material API, Order API, serta tipe material/subscription frontend.
Main Functions: Mengambil subject dan modul, menampilkan state lock/unlock subscription, lalu memuat materi per modul aktif.
Side Effects: Melakukan HTTP call ke backend untuk subject, modul, materi, dan status subscription.
-->

<script lang="ts">
  import { onMount } from 'svelte'

  import type { FrontendModule, FrontendModuleMaterials, FrontendSubject } from '$lib/domain/types/material.types'
  import type { ActiveSubscription } from '$lib/domain/types/subscription.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'
  import { orderApi } from '$lib/infrastructure/api/order.api'

  let subjects = $state<FrontendSubject[]>([])
  let modules = $state<FrontendModule[]>([])
  let moduleMaterials = $state<FrontendModuleMaterials | null>(null)
  let activeSubscription = $state<ActiveSubscription | null>(null)
  let selectedSubjectId = $state<string | null>(null)
  let selectedModuleId = $state<string | null>(null)
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  const loadModules = async (subjectId: string) => {
    modules = await materialApi.listModules(subjectId)
    selectedModuleId = modules[0]?.id ?? null
    moduleMaterials = null

    if (selectedModuleId && activeSubscription) {
      moduleMaterials = await materialApi.listMaterialsByModule(selectedModuleId)
    }
  }

  const selectModule = async (moduleId: string) => {
    selectedModuleId = moduleId
    moduleMaterials = activeSubscription
      ? await materialApi.listMaterialsByModule(moduleId)
      : null
  }

  onMount(async () => {
    try {
      const [subjectsResult, subscriptionResult] = await Promise.all([
        materialApi.listSubjects(),
        orderApi.activeSubscription()
      ])

      subjects = subjectsResult
      activeSubscription = subscriptionResult
      selectedSubjectId = subjects[0]?.id ?? null

      if (selectedSubjectId) {
        await loadModules(selectedSubjectId)
      }
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Ruang belajar gagal dimuat'
    } finally {
      isLoading = false
    }
  })
</script>

<section class="space-y-6">
  <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
    <p class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.24em] text-black shadow-solid-sm">Materi Belajar</p>
    <h1 class="mt-4 text-3xl font-extrabold uppercase text-black">Ruang belajar sesuai paket aktif Anda</h1>
    <p class="mt-3 text-sm font-bold leading-7 text-black/70">
      Pilih mata pelajaran lalu masuk ke modul yang ingin dipelajari. Progress materi akan tersimpan saat Anda menandainya selesai.
    </p>
  </div>

  <div class={`rounded-xl border-4 border-black p-6 shadow-solid-lg ${
    activeSubscription ? 'bg-neo-green text-black' : 'bg-neo-yellow text-black'
  }`}>
    {#if activeSubscription}
      <h2 class="text-2xl font-extrabold uppercase text-black">Akses aktif: {activeSubscription.packageName}</h2>
      <p class="mt-3 text-sm font-bold leading-7 text-black/90">
        Paket Anda aktif hingga {new Date(activeSubscription.endsAt).toLocaleDateString('id-ID')} dengan sisa {activeSubscription.remainingDays} hari.
      </p>
    {:else}
      <h2 class="text-2xl font-extrabold uppercase text-black">Akses materi masih terkunci</h2>
      <p class="mt-3 text-sm font-bold leading-7 text-black/90">
        Anda tetap bisa melihat daftar mapel dan modul, tetapi membuka materi memerlukan langganan aktif.
      </p>
      <a href="/paket" class="mt-5 inline-flex rounded-xl border-4 border-black bg-white px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm transition-transform hover:-translate-y-1 hover:shadow-solid-md active:translate-x-1 active:translate-y-1 active:shadow-none">
        Pilih Paket Sekarang
      </a>
    {/if}
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-dashed border-black bg-neo-blue/10 p-8 text-sm font-bold text-black">Memuat ruang belajar...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-dashed border-black bg-neo-red/10 p-8 text-sm font-extrabold uppercase text-neo-red">{loadError}</div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
        <h2 class="text-xl font-extrabold uppercase text-black">Mata Pelajaran</h2>
        <div class="mt-5 space-y-3">
          {#each subjects as subject}
            <button
              type="button"
              class={`block w-full rounded-xl border-4 border-black p-4 text-left transition-transform hover:-translate-y-1 hover:shadow-solid-sm ${
                selectedSubjectId === subject.id ? 'bg-neo-blue/10 shadow-solid-sm' : 'bg-white'
              }`}
              onclick={async () => {
                selectedSubjectId = subject.id
                await loadModules(subject.id)
              }}
            >
              <p class="text-base font-extrabold uppercase text-black">{subject.name}</p>
              {#if subject.description}
                <p class="mt-1 text-sm font-bold text-black/70">{subject.description}</p>
              {/if}
            </button>
          {/each}
        </div>
      </article>

      <article class="space-y-6">
        <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
          <h2 class="text-xl font-extrabold uppercase text-black">Modul</h2>
          <div class="mt-5 grid gap-3">
            {#each modules as moduleItem}
              <button
                type="button"
                class={`rounded-xl border-4 border-black p-4 text-left transition-transform hover:-translate-y-1 hover:shadow-solid-sm ${
                  selectedModuleId === moduleItem.id ? 'bg-neo-blue/10 shadow-solid-sm' : 'bg-white'
                }`}
                onclick={async () => await selectModule(moduleItem.id)}
              >
                <p class="text-base font-extrabold uppercase text-black">{moduleItem.title}</p>
                {#if moduleItem.description}
                  <p class="mt-1 text-sm font-bold text-black/70">{moduleItem.description}</p>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <div class="rounded-xl border-4 border-black bg-white p-6 shadow-solid-lg">
          <h2 class="text-xl font-extrabold uppercase text-black">Materi</h2>
          {#if !activeSubscription}
            <p class="mt-5 text-sm font-bold text-black/70">Aktifkan paket terlebih dahulu untuk membuka materi pada modul yang dipilih.</p>
          {:else if !moduleMaterials}
            <p class="mt-5 text-sm font-bold text-black/70">Pilih modul untuk melihat daftar materi.</p>
          {:else if moduleMaterials.materials.length === 0}
            <p class="mt-5 text-sm font-bold text-black/70">Belum ada materi pada modul ini.</p>
          {:else}
            <div class="mt-5 space-y-4">
              {#each moduleMaterials.materials as material}
                <a href={`/student/materi/${material.id}`} class="block rounded-xl border-4 border-black bg-white p-4 transition-transform hover:-translate-y-1 hover:shadow-solid-sm active:translate-x-1 active:translate-y-1 active:shadow-none">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-sm font-extrabold uppercase text-black">{material.title}</p>
                      {#if material.summary}
                        <p class="mt-1 text-sm font-bold text-black/70">{material.summary}</p>
                      {/if}
                    </div>
                    <span class="rounded-md border-2 border-black bg-neo-yellow px-3 py-1 text-xs font-extrabold uppercase text-black shadow-solid-sm">{material.materialType}</span>
                  </div>
                  <div class="mt-4 flex items-center justify-between text-sm font-bold text-black/70">
                    <span>Progress {material.progressPercent}%</span>
                    <span>{material.isCompleted ? 'Selesai' : 'Lanjutkan'}</span>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </article>
    </div>
  {/if}
</section>
