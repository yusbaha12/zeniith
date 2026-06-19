<!--
Tujuan: Menyediakan halaman log sistem (audit trail) untuk super admin.
Caller: Route `/superadmin/log`.
Dependensi: Svelte 5 Runes, SvelteKit data.
Main Functions: Menampilkan tabel audit log/aktivitas keamanan sistem secara terurut.
-->

<script lang="ts">
  let { data } = $props()

  const logs = $derived(data.logs)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata) return '-'
    try {
      return typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    } catch {
      return '-'
    }
  }
</script>

<div class="space-y-6">
  <!-- Header Card -->
  <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
    <!-- Accent bar representing the active section -->
    <div class="w-4 bg-neo-stripes-slate border-r-4 border-black flex-shrink-0"></div>
    
    <div class="flex-grow p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Sistem Keamanan
          </span>
          <span class="inline-block rounded-md border-2 border-black bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
            Audit Log
          </span>
        </div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-ink">Audit Log & Aktivitas</h1>
        <p class="mt-1 text-sm font-bold text-ink/60">Riwayat otorisasi, permission check, dan tindakan keamanan di sistem.</p>
      </div>
    </div>
  </div>

  <!-- Audit Table -->
  <div class="overflow-x-auto rounded-2xl border-4 border-black bg-white shadow-solid">
    <table class="w-full border-collapse text-left text-sm">
      <thead>
        <tr class="border-b-4 border-black bg-slate-100 text-xs font-black uppercase tracking-wider text-black">
          <th class="px-6 py-4">Waktu</th>
          <th class="px-6 py-4">Aktor (User)</th>
          <th class="px-6 py-4">Permission</th>
          <th class="px-6 py-4">Tindakan</th>
          <th class="px-6 py-4">Hasil</th>
          <th class="px-6 py-4">Metadata</th>
        </tr>
      </thead>
      <tbody class="divide-y-2 divide-black/10">
        {#if logs.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-8 text-center text-ink/50 font-bold">
              Tidak ada data log sistem tercatat.
            </td>
          </tr>
        {:else}
          {#each logs as log}
            <tr class="hover:bg-slate-50 transition-colors text-xs">
              <td class="px-6 py-4 text-ink/60 whitespace-nowrap font-bold">{formatDate(log.createdAt)}</td>
              <td class="px-6 py-4">
                <span class="font-extrabold text-ink">{log.actorName ?? 'System / Anonymous'}</span>
                <span class="block text-[10px] text-ink/40 font-mono">{log.actorUserId ?? '-'}</span>
              </td>
              <td class="px-6 py-4">
                <span class="font-mono text-ink/75 bg-slate-100 border border-black/10 px-1.5 py-0.5 rounded">{log.permissionCode}</span>
              </td>
              <td class="px-6 py-4">
                <span class="font-bold text-ink">{log.actionType}</span>
                {#if log.targetRole}
                  <span class="block text-[10px] text-ink/50">Target: {log.targetRole}</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded border border-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-solid-sm {log.effect === 'ALLOW'
                    ? 'bg-neo-green text-black'
                    : 'bg-neo-red text-white'}"
                >
                  {log.effect}
                </span>
              </td>
              <td class="px-6 py-4 text-ink/60 max-w-xs truncate font-medium" title={formatMetadata(log.metadata)}>
                {formatMetadata(log.metadata)}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
