<!--
Tujuan: Menyediakan custom select dropdown dengan pencarian (seperti Select2) ber-style Neobrutalism yang premium.
Caller: Form yang membutuhkan input select interaktif.
Dependensi: Svelte 5 Runes dan komponen FieldNote untuk pesan error inline.
Main Functions: Menormalkan opsi, membuka dropdown pencarian, memilih item, dan menampilkan error inline di bawah field.
Side Effects: Menambahkan listener click global saat komponen mounted untuk mendeteksi klik di luar dropdown.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import FieldNote from '$lib/components/ui/FieldNote.svelte'

  interface Option {
    value: any
    label: string
  }

  let {
    options = [],
    value = $bindable(),
    placeholder = 'Pilih opsi...',
    disabled = false,
    searchable = true,
    error = false,
    errorMessage = null,
    class: className = ''
  } = $props<{
    options: (Option | string)[]
    value: any
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    error?: boolean
    errorMessage?: string | null
    class?: string
  }>()

  // Normalize options to { value, label } objects
  let normalizedOptions = $derived(
    options.map((opt: Option | string) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt }
      }
      return opt
    })
  )

  let isOpen = $state(false)
  let searchQuery = $state('')
  let triggerElement = $state<HTMLElement | null>(null)
  let dropdownElement = $state<HTMLElement | null>(null)

  let selectedOption = $derived(
    normalizedOptions.find((opt: Option) => opt.value === value) || null
  )

  let filteredOptions = $derived(
    normalizedOptions.filter((opt: Option) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  function toggleDropdown() {
    if (disabled) return
    isOpen = !isOpen
    if (isOpen) {
      searchQuery = ''
    }
  }

  function selectOption(optValue: any) {
    value = optValue
    isOpen = false
  }

  // Click outside detection
  function handleClickOutside(event: MouseEvent) {
    if (
      isOpen &&
      triggerElement &&
      !triggerElement.contains(event.target as Node) &&
      dropdownElement &&
      !dropdownElement.contains(event.target as Node)
    ) {
      isOpen = false
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<div class="relative w-full {className}">
  <!-- Trigger Button -->
  <button
    type="button"
    bind:this={triggerElement}
    onclick={toggleDropdown}
    {disabled}
    class="w-full flex items-center justify-between gap-2 rounded-xl border-[3px] bg-white px-4 py-3 text-left text-sm font-black text-black outline-none transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:pointer-events-none focus:border-neo-blue {error ? 'border-neo-red' : 'border-black'}"
  >
    <span class={selectedOption ? 'text-black font-black' : 'text-slate-400 font-bold'}>
      {selectedOption ? selectedOption.label : placeholder}
    </span>
    
    <!-- Chevron Icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="3"
      stroke="currentColor"
      class="h-4 w-4 text-black transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  </button>

  <!-- Dropdown Panel -->
  {#if isOpen}
    <div
      bind:this={dropdownElement}
      class="absolute left-0 right-0 z-[9999] mt-2 rounded-xl border-[3px] border-black bg-white p-2 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
    >
      <!-- Search Input if searchable -->
      {#if searchable}
        <div class="mb-2">
          <input
            type="text"
            placeholder="Cari..."
            bind:value={searchQuery}
            class="w-full rounded-lg border-2 border-black bg-slate-50 px-3 py-2 text-xs font-bold text-black outline-none focus:bg-white focus:border-black"
          />
        </div>
      {/if}

      <!-- Options List -->
      <ul class="max-h-60 overflow-y-auto space-y-1">
        {#if filteredOptions.length === 0}
          <li class="px-3 py-3 text-center text-xs font-bold text-slate-400">
            Tidak ada opsi ditemukan
          </li>
        {:else}
          {#each filteredOptions as opt}
            {@const isSelected = value === opt.value}
            <li>
              <button
                type="button"
                onclick={() => selectOption(opt.value)}
                class="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-black transition-colors {isSelected ? 'bg-neo-purple/20 text-black border-2 border-black' : 'text-black hover:bg-slate-100'}"
              >
                <span>{opt.label}</span>
                {#if isSelected}
                  <span class="text-xs font-black text-neo-purple">✓</span>
                {/if}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  {/if}
</div>

<FieldNote
  error={error ? errorMessage : null}
/>
