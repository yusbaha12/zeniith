<!--
Tujuan: Menyediakan halaman pengaturan operasional sistem untuk super admin.
Caller: Route `/superadmin/pengaturan`.
Dependensi: Svelte 5 Runes, SvelteKit data, fetch API response helper, dan toast notification.
Main Functions: Memperbarui parameter operasional sistem secara real-time dan mengirim feedback via toast.
Side Effects: Melakukan HTTP call penyimpanan konfigurasi, menampilkan toast, dan menampilkan hint validasi inline pada field angka.
-->

<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { inlineValidationForm } from '$lib/actions/inline-validation-form'
  import { readApiData } from '$lib/infrastructure/api/response'
  import { notify } from '$lib/infrastructure/notifications/notify'

  let { data } = $props()

  const apiBaseUrl = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000/api'

  let maintenanceMode = $state(data.config.maintenanceMode ?? false)
  let registrationOpen = $state(data.config.registrationOpen ?? true)
  let maxWarningsAllowed = $state<number>(data.config.maxWarningsAllowed ?? 5)
  let paymentAutoVerify = $state(data.config.paymentAutoVerify ?? false)

  let isLoading = $state(false)
  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault()
    isLoading = true

    try {
      const res = await fetch(`${apiBaseUrl}/superadmin/settings`, {
        method: 'POST',
        credentials: 'include',
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

      await readApiData(res, 'Gagal menyimpan pengaturan')

      notify.success('Pengaturan sistem berhasil disimpan!')
      await invalidateAll()
    } catch (err: any) {
      notify.error(err.message)
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
  <!-- Form Config -->
  <form use:inlineValidationForm onsubmit={handleSave} class="max-w-xl rounded-2xl border-[4px] border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
    <!-- Maintenance Mode -->
    <div class="flex items-center justify-between pb-4 border-b-[3px] border-black/10">
      <div>
        <label for="input-maintenance" class="font-black text-black text-sm uppercase cursor-pointer">Mode Pemeliharaan (Maintenance)</label>
        <p class="text-xs text-ink/50 mt-1">Mengunci seluruh akses murid dan guru kecuali admin.</p>
      </div>
      <input
        type="checkbox"
        id="input-maintenance"
        bind:checked={maintenanceMode}
        class="h-6 w-6 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
      />
    </div>

    <!-- Registration Open -->
    <div class="flex items-center justify-between pb-4 border-b-[3px] border-black/10">
      <div>
        <label for="input-registration" class="font-black text-black text-sm uppercase cursor-pointer">Pendaftaran Murid Terbuka</label>
        <p class="text-xs text-ink/50 mt-1">Mengizinkan pengunjung baru mendaftar akun murid secara mandiri.</p>
      </div>
      <input
        type="checkbox"
        id="input-registration"
        bind:checked={registrationOpen}
        class="h-6 w-6 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
      />
    </div>

    <!-- Payment Auto Verify -->
    <div class="flex items-center justify-between pb-4 border-b-[3px] border-black/10">
      <div>
        <label for="input-verify" class="font-black text-black text-sm uppercase cursor-pointer">Verifikasi Pembayaran Otomatis</label>
        <p class="text-xs text-ink/50 mt-1">Mencoba bypass verifikasi manual oleh admin cabang saat murid checkout.</p>
      </div>
      <input
        type="checkbox"
        id="input-verify"
        bind:checked={paymentAutoVerify}
        class="h-6 w-6 rounded border-[3px] border-black bg-white accent-black focus:ring-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
      />
    </div>

    <!-- Max Warnings Allowed -->
    <div class="space-y-2">
      <label for="input-warning" class="font-black text-black text-sm block uppercase">Batas Maksimal Peringatan Proctoring <span class="text-neo-red">*</span></label>
      <p class="text-xs text-ink/50">Jumlah toleransi kecurangan (tab switch/blur) sebelum sesi ujian murid dihentikan paksa.</p>
      <input
        type="number"
        id="input-warning"
        required
        min="1"
        bind:value={maxWarningsAllowed}
        data-required-message="Batas maksimal peringatan wajib diisi."
        data-min-message="Batas maksimal peringatan minimal 1."
        class="mt-2 w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5"
      />
    </div>

    <!-- Save Button -->
    <div class="pt-4">
      <button
        type="submit"
        disabled={isLoading}
        class="w-full rounded-xl border-[3px] border-black bg-neo-green px-6 py-4 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
      >
        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </div>
  </form>
</div>

<style>
</style>
