<!--
Tujuan: Menampilkan error inline konsisten di bawah field frontend.
Caller: Komponen form seperti Select yang membutuhkan area pesan validasi di bawah field.
Dependensi: Props Svelte 5 Runes.
Main Functions: Merender pesan error saat field invalid.
Side Effects: Tidak ada; hanya render UI.
-->

<script lang="ts">
  let {
    error = null,
    class: className = ''
  } = $props<{
    error?: string | null
    class?: string
  }>()
</script>

{#if error}
  <p class={`mt-2 block text-[11px] font-black text-neo-red ${className}`}>{error}</p>
{/if}
