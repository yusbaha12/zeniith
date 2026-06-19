<!--
Tujuan: Menyediakan halaman pengaturan operasional sistem untuk super admin.
Caller: Route `/superadmin/pengaturan`.
Dependensi: Svelte 5 Runes, SvelteKit data, dan fetch API client.
Main Functions: Memperbarui parameter operasional sistem secara real-time.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  let maintenanceMode = $state(data.config.maintenanceMode ?? false)
  let registrationOpen = $state(data.config.registrationOpen ?? true)
  let maxWarningsAllowed = $state<number>(data.config.maxWarningsAllowed ?? 5)
  let paymentAutoVerify = $state(data.config.paymentAutoVerify ?? false)

  let isLoading = $state(false)
  let successMsg = $state<string | null>(null)
  let errorMsg = $state<string | null>(null)

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true
    successMsg = null
    errorMsg = null

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/settings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          key: 'system_config',
          value: {
            maintenanceMode,
            registrationOpen,
            maxWarningsAllowed,
            paymentAutoVerify
          }
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan pengaturan')
      }

      successMsg = 'Pengaturan sistem berhasil disimpan!'
      await invalidateAll()
    } catch (err: any) {
      errorMsg = err.message
    } finally {
      isLoading = false
    }
  }
</script>

<div class="space-y-6">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-green border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Konfigurasi Utama
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-neo-green px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Pengaturan Sistem
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Pengaturan Sistem</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Atur parameter dan konfigurasi operasional LMS Bimbel global.</p>
      </div>
    </div>
  </div>

  {#if successMsg}
    <div class="rounded-xl border-2 border-black bg-neo-green/20 p-4 text-sm font-bold text-black shadow-solid-sm">
      {successMsg}
    </div>
  {/if}

  {#if errorMsg}
    <div class="rounded-xl border-2 border-black bg-neo-red/20 p-4 text-sm font-bold text-black shadow-solid-sm">
      {errorMsg}
    </div>
  {/if}

  <!-- Form Config -->
  <form onsubmit={handleSave} class="max-w-xl rounded-2xl border-4 border-black bg-white p-8 shadow-solid space-y-6">
    <!-- Maintenance Mode -->
    <div class="flex items-center justify-between pb-4 border-b-2 border-black/10">
      <div>
        <label for="input-maintenance" class="font-black text-black text-sm uppercase">Mode Pemeliharaan (Maintenance)</label>
        <p class="text-xs text-ink/50 mt-1">Mengunci seluruh akses murid dan guru kecuali admin.</p>
      </div>
      <input
        type="checkbox"
        id="input-maintenance"
        bind:checked={maintenanceMode}
        class="h-6 w-6 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
      />
    </div>

    <!-- Registration Open -->
    <div class="flex items-center justify-between pb-4 border-b-2 border-black/10">
      <div>
        <label for="input-registration" class="font-black text-black text-sm uppercase">Pendaftaran Murid Terbuka</label>
        <p class="text-xs text-ink/50 mt-1">Mengizinkan pengunjung baru mendaftar akun murid secara mandiri.</p>
      </div>
      <input
        type="checkbox"
        id="input-registration"
        bind:checked={registrationOpen}
        class="h-6 w-6 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
      />
    </div>

    <!-- Payment Auto Verify -->
    <div class="flex items-center justify-between pb-4 border-b-2 border-black/10">
      <div>
        <label for="input-verify" class="font-black text-black text-sm uppercase">Verifikasi Pembayaran Otomatis</label>
        <p class="text-xs text-ink/50 mt-1">Mencoba bypass verifikasi manual oleh admin cabang saat murid checkout.</p>
      </div>
      <input
        type="checkbox"
        id="input-verify"
        bind:checked={paymentAutoVerify}
        class="h-6 w-6 rounded border-2 border-black accent-black focus:ring-0 cursor-pointer"
      />
    </div>

    <!-- Max Warnings Allowed -->
    <div class="space-y-2">
      <label for="input-warning" class="font-black text-black text-sm block uppercase">Batas Maksimal Peringatan Proctoring</label>
      <p class="text-xs text-ink/50">Jumlah toleransi kecurangan (tab switch/blur) sebelum sesi ujian murid dihentikan paksa.</p>
      <input
        type="number"
        id="input-warning"
        required
        bind:value={maxWarningsAllowed}
        class="w-full rounded-xl border-2 border-black px-4 py-3 text-sm font-bold bg-white outline-none focus:bg-neo-yellow/5 focus:ring-0"
      />
    </div>

    <!-- Save Button -->
    <div class="pt-4">
      <button
        type="submit"
        disabled={isLoading}
        class="w-full rounded-xl border-2 border-black bg-neo-green px-6 py-4 text-sm font-extrabold uppercase text-black shadow-solid hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50"
      >
        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </div>
  </form>
</div>

<style>
  .text-mint-dark {
    color: #1b4d3e;
  }
</style>
