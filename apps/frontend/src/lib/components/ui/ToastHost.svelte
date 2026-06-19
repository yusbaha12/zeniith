<!--
Tujuan: Merender toast notification global internal frontend dengan gaya neobrutalism.
Caller: Root layout SvelteKit.
Dependensi: toast-store internal dan style scoped komponen.
Main Functions: Menampilkan daftar toast aktif, ikon SVG tipe notifikasi, dan tombol tutup manual.
Side Effects: Menghapus toast dari store ketika tombol close ditekan.
-->

<script lang="ts">
  import { removeToast, toastItems, type ToastItem } from '$lib/infrastructure/notifications/toast-store'
</script>

<div class="neo-toast-stack" aria-live="polite" aria-atomic="true">
  {#each $toastItems as toast (toast.id)}
    <div class={`neo-toast neo-toast-${toast.type}`} role="status">
      <div class="neo-toast-icon" aria-hidden="true">
        {#if toast.type === 'success'}
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        {:else if toast.type === 'error'}
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        {:else if toast.type === 'warning'}
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 4.2 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        {/if}
      </div>
      <p class="neo-toast-message">{toast.message}</p>
      <button
        type="button"
        class="neo-toast-close"
        aria-label="Tutup notifikasi"
        onclick={() => removeToast(toast.id)}
      >
        x
      </button>
    </div>
  {/each}
</div>

<style>
  .neo-toast-stack {
    position: fixed;
    top: calc(var(--header-height, 72px) + 16px);
    right: 20px;
    z-index: 10050;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(380px, calc(100vw - 32px));
    pointer-events: none;
  }

  .neo-toast {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border: 4px solid #000000;
    border-radius: 12px;
    box-shadow: 7px 7px 0 #000000;
    color: #000000;
    font-family: "Plus Jakarta Sans", sans-serif;
    padding: 12px;
    pointer-events: auto;
    transform: translateZ(0);
  }

  .neo-toast-icon {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #000000;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 3px 3px 0 #000000;
  }

  .neo-toast-icon svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .neo-toast-message {
    min-width: 0;
    margin: 0;
    font-size: 0.92rem;
    font-weight: 900;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .neo-toast-close {
    width: 34px;
    height: 34px;
    border: 3px solid #000000;
    border-radius: 8px;
    background: #ffffff;
    color: #000000;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
    box-shadow: 3px 3px 0 #000000;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease;
  }

  .neo-toast-close:hover {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #000000;
  }

  .neo-toast-success {
    background: #bbf7d0;
  }

  .neo-toast-error {
    background: #fecaca;
  }

  .neo-toast-info {
    background: #bfdbfe;
  }

  .neo-toast-warning {
    background: #fde68a;
  }

  @media (max-width: 640px) {
    .neo-toast-stack {
      top: calc(var(--header-height, 72px) + 12px);
      right: 12px;
      width: min(360px, calc(100vw - 24px));
    }
  }
</style>
