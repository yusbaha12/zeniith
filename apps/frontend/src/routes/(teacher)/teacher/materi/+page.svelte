<!--
Tujuan: Menyediakan halaman daftar materi guru fase 3.
Caller: Route `/teacher/materi`.
Dependensi: Material API dan tipe teacher material frontend.
Main Functions: Mengambil semua materi milik guru dan menyediakan CTA buat/edit/hapus materi.
Side Effects: Melakukan HTTP call ke backend teacher material endpoints.
-->

<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  import type { TeacherMaterialListItem } from '$lib/domain/types/material.types'
  import { materialApi } from '$lib/infrastructure/api/material.api'

  let materials = $state<TeacherMaterialListItem[]>([])
  let isLoading = $state(true)
  let loadError = $state<string | null>(null)

  const loadMaterials = async () => {
    isLoading = true
    loadError = null
    try {
      materials = await materialApi.listTeacherMaterials()
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Daftar materi guru gagal dimuat'
    } finally {
      isLoading = false
    }
  }

  onMount(async () => {
    await loadMaterials()
  })

  const removeMaterial = async (materialId: string) => {
    await materialApi.deleteTeacherMaterial(materialId)
    await loadMaterials()
  }
</script>

<section class="space-y-6">
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Panel Guru
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
            Materi Ajar
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Materi Milik Anda</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Kelola bahan ajar dan modul pembelajaran</p>
      </div>
      <div>
        <a href="/teacher/materi/buat" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-neo-green px-5 py-3 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform">
          Buat Materi &rarr;
        </a>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-black shadow-solid">Memuat daftar materi...</div>
  {:else if loadError}
    <div class="rounded-xl border-4 border-black bg-neo-red/20 p-8 text-sm font-bold text-black shadow-solid">{loadError}</div>
  {:else if materials.length === 0}
    <div class="rounded-xl border-4 border-black bg-white p-8 text-sm font-bold text-ink/70 shadow-solid">Belum ada materi yang Anda buat.</div>
  {:else}
    <div class="space-y-4">
      {#each materials as material}
        <article class="rounded-2xl border-4 border-black bg-white p-6 shadow-solid">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-lg font-black text-ink uppercase tracking-tight">{material.title}</p>
              <p class="mt-1 text-sm font-bold text-ink/70">{material.subjectName} • {material.moduleTitle}</p>
              {#if material.summary}
                <p class="mt-2 text-sm font-semibold text-ink/75">{material.summary}</p>
              {/if}
            </div>
            <div class="flex gap-2">
              <button type="button" class="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform" onclick={() => goto(`/teacher/materi/${material.id}/edit`)}>Edit</button>
              <button type="button" class="rounded-lg border-2 border-black bg-neo-red px-4 py-2 text-sm font-extrabold uppercase text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform" onclick={() => void removeMaterial(material.id)}>Hapus</button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
