<!--
Tujuan: Menyediakan editor Tiptap fase 3 untuk membuat dan menampilkan konten materi guru.
Caller: Halaman teacher buat/edit materi dan halaman detail materi teks/exercise.
Dependensi: Tiptap core/extensions, callback upload gambar, dan konten JSON materi.
Main Functions: Menginisialisasi editor, menyediakan toolbar dasar, dan sinkronkan JSON content ke parent.
Side Effects: Menjalankan editor rich text di browser dan dapat upload image via callback parent.
Catatan Perbaikan: Menghapus auto-render KaTeX langsung pada DOM editor yang editable untuk mencegah kerusakan/desinkronisasi struktur dokumen Tiptap. Rumus tetap dirender dengan aman pada area pratinjau (preview).
-->

<script lang="ts">
import { onMount } from 'svelte'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import Underline from '@tiptap/extension-underline'
  import Image from '@tiptap/extension-image'
  import { Table } from '@tiptap/extension-table'
  import TableRow from '@tiptap/extension-table-row'
  import TableHeader from '@tiptap/extension-table-header'
  import TableCell from '@tiptap/extension-table-cell'
  import Placeholder from '@tiptap/extension-placeholder'
  import { math } from '$lib/actions/math'

  let {
    content = null,
    editable = true,
    flat = false,
    placeholder = 'Tulis materi di sini...',
    onChange = (_value: Record<string, unknown> | null) => {},
    onUploadImage = null
  } = $props<{
    content?: Record<string, unknown> | null
    editable?: boolean
    flat?: boolean
    placeholder?: string
    onChange?: (value: Record<string, unknown> | null) => void
    onUploadImage?: ((file: File) => Promise<{ objectKey: string; url: string }>) | null
  }>()

  let element = $state<HTMLDivElement | null>(null)
  let editorState = $state<{ editor: Editor | null }>({ editor: null })
  let isUploadingImage = $state(false)
  let rawHtmlForPreview = $state<string>('')
  let showGuide = $state(false)

  const refreshState = (editor: Editor) => {
    editorState = { editor }
    rawHtmlForPreview = editor.getHTML()
    onChange(editor.getJSON() as Record<string, unknown>)
  }

  const uploadImage = async (event: Event) => {
    const target = event.currentTarget as HTMLInputElement
    const file = target.files?.[0]

    if (!file || !editorState.editor || !onUploadImage) {
      return
    }

    isUploadingImage = true

    try {
      const uploaded = await onUploadImage(file)
      editorState.editor
        .chain()
        .focus()
        .setImage({
          src: uploaded.url,
          alt: file.name,
          uploadKey: uploaded.objectKey
        } as any)
        .run()
      refreshState(editorState.editor)
    } finally {
      isUploadingImage = false
      target.value = ''
    }
  }



  const insertFormula = (latex: string) => {
    editorState.editor?.chain().focus().insertContent(latex).run()
    if (editorState.editor) {
      refreshState(editorState.editor)
    }
  }

  const insertFormulaSnippet = () => {
    insertFormula('\\( a^2 + b^2 = c^2 \\)')
  }

  // Action untuk memindahkan elemen modal ke document.body (portal) agar tidak terpotong oleh parent stacking context
  const portal = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node)
        }
      }
    }
  }

  // Efek reaktif Svelte 5 untuk menyinkronkan konten dari parent ke editor Tiptap
  $effect(() => {
    if (editorState.editor && content !== undefined) {
      const currentJSON = editorState.editor.getJSON()
      if (JSON.stringify(currentJSON) !== JSON.stringify(content)) {
        editorState.editor.commands.setContent(content ?? {
          type: 'doc',
          content: [
            {
              type: 'paragraph'
            }
          ]
        })
        rawHtmlForPreview = editorState.editor.getHTML()
      }
    }
  })

  onMount(() => {
    if (editable && !element) {
      return
    }

    const editor = new Editor({
      element: editable ? element : undefined,
      editable,
      extensions: [
        StarterKit,
        Underline,
        Image,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({
          placeholder: placeholder,
          emptyEditorClass: 'is-editor-empty'
        })
      ],
      content: content ?? {
        type: 'doc',
        content: [
          {
            type: 'paragraph'
          }
        ]
      },
      onTransaction: ({ editor }) => {
        refreshState(editor)
      }
    })

    editorState = { editor }
    rawHtmlForPreview = editor.getHTML()

    return () => {
      editor.destroy()
    }
  })
</script>

<div class="space-y-4">
  {#if editorState.editor && editable}
    <div class="flex flex-wrap items-center gap-3 rounded-2xl border-4 border-black bg-white p-3 shadow-solid-sm">
      <!-- Group 1: Text Formatting & Utilities -->
      <div class="flex items-center gap-1.5 pr-2.5 border-r-2 border-black/15">
        <button 
          type="button" 
          title="Tebal (Bold)"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('bold') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleBold().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h8a4 4 0 100-8H6v8zm0 0h9a4 4 0 110 8H6v-8z" />
          </svg>
        </button>

        <button 
          type="button" 
          title="Miring (Italic)"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('italic') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleItalic().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m-4 0h4m-8 16h4" />
          </svg>
        </button>

        <button 
          type="button" 
          title="Garis Bawah (Underline)"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('underline') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleUnderline().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 0012 0V3M4 21h16" />
          </svg>
        </button>

        <button 
          type="button" 
          title="Hapus Format (Clear Formatting)"
          class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all" 
          onclick={() => editorState.editor?.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <span class="text-xs font-black">Tx</span>
        </button>

        <button 
          type="button" 
          title="Batal (Undo)"
          class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all" 
          onclick={() => editorState.editor?.chain().focus().undo().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button 
          type="button" 
          title="Ulangi (Redo)"
          class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all" 
          onclick={() => editorState.editor?.chain().focus().redo().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <!-- Group 2: Layout & Structure -->
      <div class="flex items-center gap-1.5 px-1 pr-2.5 border-r-2 border-black/15">
        <button 
          type="button" 
          title="Heading 2"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('heading', { level: 2 }) ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span class="text-xs font-black">H2</span>
        </button>

        <button 
          type="button" 
          title="Daftar Simbol (Bullet List)"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('bulletList') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleBulletList().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16M4 6h.01M4 12h.01M4 18h.01" />
          </svg>
        </button>

        <button 
          type="button" 
          title="Daftar Angka (Number List)"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('orderedList') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().toggleOrderedList().run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6h11M9 12h11M9 18h11M4 6h2M4 12h2M4 18h2" />
          </svg>
        </button>
      </div>

      <!-- Group 3: Media, Tables & Custom Elements -->
      <div class="flex items-center gap-1.5 px-1 pr-2.5 border-r-2 border-black/15">
        <button 
          type="button" 
          title="Sisipkan Tabel"
          class={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black transition-all ${editorState.editor.isActive('table') ? 'bg-neo-yellow text-black shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0'}`} 
          onclick={() => editorState.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {#if onUploadImage}
          <label 
            title="Unggah Gambar"
            class="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            {#if isUploadingImage}
              <svg class="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            {/if}
            <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" onchange={uploadImage} />
          </label>
        {/if}

        <button 
          type="button" 
          title="Sisipkan Contoh Rumus (LaTeX)"
          class="flex h-9 px-2 items-center justify-center gap-1 rounded-lg border-2 border-black bg-white text-ink shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all" 
          onclick={insertFormulaSnippet}
        >
          <span class="text-xs font-black">√x</span>
          <span class="text-[10px] font-bold text-black/50">Formula</span>
        </button>
      </div>

      <!-- Group 4: Guidance / Help -->
      <div class="flex items-center gap-1.5 ml-auto">
        <button 
          type="button" 
          class="flex h-9 px-3 items-center gap-1.5 rounded-lg border-2 border-black bg-neo-yellow/20 text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-all font-extrabold text-xs" 
          onclick={() => showGuide = !showGuide}
        >
          📖 <span class="hidden sm:inline">Panduan Rumus</span>
        </button>
      </div>
    </div>

    <!-- Table Action Sub-Toolbar -->
    {#if editorState.editor.isActive('table')}
      <div class="flex flex-wrap items-center gap-2 rounded-2xl border-4 border-black bg-neo-yellow/10 p-3 shadow-solid-sm animate-in slide-in-from-top-2 duration-150 mt-2">
        <span class="text-xs font-black uppercase text-black/60 px-2 border-r-2 border-black/20 mr-1.5">Kontrol Tabel:</span>
        <button 
          type="button" 
          title="Tambah Baris Setelah"
          class="flex h-8 px-3.5 items-center justify-center gap-1 rounded-lg border-2 border-black bg-white text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform text-xs font-bold" 
          onclick={() => editorState.editor?.chain().focus().addRowAfter().run()}
        >
          ➕ Baris
        </button>
        <button 
          type="button" 
          title="Hapus Baris"
          class="flex h-8 px-3.5 items-center justify-center gap-1 rounded-lg border-2 border-black bg-white text-neo-red shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform text-xs font-bold" 
          onclick={() => editorState.editor?.chain().focus().deleteRow().run()}
        >
          ❌ Baris
        </button>
        <button 
          type="button" 
          title="Tambah Kolom Setelah"
          class="flex h-8 px-3.5 items-center justify-center gap-1 rounded-lg border-2 border-black bg-white text-black shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform text-xs font-bold" 
          onclick={() => editorState.editor?.chain().focus().addColumnAfter().run()}
        >
          ➕ Kolom
        </button>
        <button 
          type="button" 
          title="Hapus Kolom"
          class="flex h-8 px-3.5 items-center justify-center gap-1 rounded-lg border-2 border-black bg-white text-neo-red shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform text-xs font-bold" 
          onclick={() => editorState.editor?.chain().focus().deleteColumn().run()}
        >
          ❌ Kolom
        </button>
        <button 
          type="button" 
          title="Hapus Tabel"
          class="flex h-8 px-3.5 items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-neo-red text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform text-xs font-black ml-auto" 
          onclick={() => editorState.editor?.chain().focus().deleteTable().run()}
        >
          🗑️ Hapus Tabel
        </button>
      </div>
    {/if}
  {/if}

  {#if !editable}
    <div use:math={rawHtmlForPreview} class={flat ? "is-flat-preview prose dark:prose-invert max-w-none" : "min-h-[160px] rounded-[1.5rem] border-4 border-black bg-white dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-100 p-5 prose dark:prose-invert max-w-none transition-colors duration-300"}></div>
  {:else}
    <div bind:this={element} class="min-h-[160px] min-h-editable rounded-[1.5rem] border-4 border-black bg-white dark:bg-slate-900/60 dark:border-slate-850 dark:text-slate-100 p-5 prose dark:prose-invert max-w-none transition-all duration-300 focus-within:ring-4 focus-within:ring-neo-yellow/30"></div>
    {#if rawHtmlForPreview}
      <div class="mt-4 rounded-2xl border-4 border-dashed border-black/25 p-4 bg-slate-50 dark:bg-slate-900/40">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-2">Pratinjau Rumus & Konten</p>
        <div use:math={rawHtmlForPreview} class="prose dark:prose-invert max-w-none"></div>
      </div>
    {/if}
  {/if}
</div>

{#if showGuide}
  <div use:portal class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm">
    <div class="w-full max-w-2xl rounded-2xl border-4 border-black bg-white p-6 shadow-solid-lg animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
        <h3 class="text-xl font-black uppercase text-black">📖 Panduan Penulisan Rumus (LaTeX)</h3>
        <button type="button" class="rounded-lg border-2 border-black bg-neo-red px-3 py-1 text-sm font-bold text-white shadow-solid-sm hover:-translate-y-0.5 active:translate-y-0" onclick={() => showGuide = false}>
          Tutup
        </button>
      </div>

      <p class="text-sm font-bold text-black/75 mb-4 leading-relaxed">
        Gunakan delimiter berikut di dalam teks Anda untuk menulis rumus matematika atau fisika. 
        <strong class="text-black">Klik contoh rumus untuk memasukkannya langsung ke kursor editor:</strong>
      </p>

      <div class="grid gap-3 md:grid-cols-2 max-h-[350px] overflow-y-auto pr-1">
        <div class="rounded-xl border-4 border-black bg-neo-yellow/10 p-4 shadow-solid-sm">
          <p class="text-xs font-black uppercase tracking-wider text-black mb-2">Tipe Delimiter</p>
          <div class="space-y-2">
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black text-xs font-mono hover:bg-slate-50 transition-colors" onclick={() => insertFormula('\\( x^2 \\)')}>
              <span class="font-bold text-black">Inline (Satu Baris):</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\( ... \)</code> atau <code class="bg-slate-100 px-1 py-0.5 rounded">$ ... $</code>
              <div class="mt-1 text-gray-500">Contoh: \( x^2 \) (menyatu dengan teks)</div>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black text-xs font-mono hover:bg-slate-50 transition-colors" onclick={() => insertFormula('$$\nE = mc^2\n$$')}>
              <span class="font-bold text-black">Block (Baris Baru):</span> <code class="bg-slate-100 px-1 py-0.5 rounded">$$ ... $$</code> atau <code class="bg-slate-100 px-1 py-0.5 rounded">\[ ... \]</code>
              <div class="mt-1 text-gray-500">Contoh: $$ E = mc^2 $$ (tengah halaman)</div>
            </button>
          </div>
        </div>

        <div class="rounded-xl border-4 border-black bg-neo-blue/10 p-4 shadow-solid-sm">
          <p class="text-xs font-black uppercase tracking-wider text-black mb-2">Rumus Umum</p>
          <div class="space-y-2 text-xs">
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( \\frac{a}{b} \\)')}>
              <span class="font-bold text-black">Pecahan:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\frac{'{a}'}{'{b}'}</code>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( \\sqrt{x} \\)')}>
              <span class="font-bold text-black">Akar Kuadrat:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\sqrt{'{x}'}</code>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( x_{i}^{2} \\)')}>
              <span class="font-bold text-black">Pangkat & Indeks:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">x_{'{i}'}^{'{2}'}</code>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( \\sin(\\theta) \\)')}>
              <span class="font-bold text-black">Trigonometri:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\sin(\theta)</code>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( \\int_{a}^{b} x \\, dx \\)')}>
              <span class="font-bold text-black">Integral:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\int_{'{a}'}^{'{b}'}</code>
            </button>
            <button type="button" class="w-full text-left bg-white p-2 rounded-lg border-2 border-black font-mono hover:bg-slate-50 transition-colors text-black" onclick={() => insertFormula('\\( \\lim_{{x \\to \\infty}} \\frac{1}{x} \\)')}>
              <span class="font-bold text-black">Limit:</span> <code class="bg-slate-100 px-1 py-0.5 rounded">\lim_{'{x \\to \\infty}'}</code>
            </button>
          </div>
        </div>
      </div>
      
      <div class="mt-4 text-xs font-semibold text-black/50 text-right">
        LMS Bimbel Zeniith · STEM Ready 🚀
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.ProseMirror) {
    outline: none;
    padding: 0.5rem;
  }
  :global(.min-h-editable .ProseMirror) {
    min-height: 120px;
  }
  :global(.is-flat-preview .ProseMirror) {
    padding: 0 !important;
  }
  :global(.is-flat-preview .ProseMirror p) {
    margin-top: 0 !important;
    margin-bottom: 0.5rem !important;
  }
  :global(.is-flat-preview .ProseMirror p:last-child) {
    margin-bottom: 0 !important;
  }
  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #94a3b8;
    pointer-events: none;
    height: 0;
  }

  /* Headings (H2) */
  :global(.ProseMirror h2), 
  :global(.prose h2), 
  :global(.is-flat-preview h2) {
    font-size: 1.4rem !important;
    font-weight: 850 !important;
    margin-top: 1.25rem !important;
    margin-bottom: 0.5rem !important;
    color: #000000 !important;
    line-height: 1.3 !important;
  }

  /* Lists (Bullet List & Ordered List) */
  :global(.ProseMirror ul), 
  :global(.prose ul), 
  :global(.is-flat-preview ul) {
    list-style-type: disc !important;
    padding-left: 1.5rem !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  :global(.ProseMirror ol), 
  :global(.prose ol), 
  :global(.is-flat-preview ol) {
    list-style-type: decimal !important;
    padding-left: 1.5rem !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  :global(.ProseMirror li), 
  :global(.prose li), 
  :global(.is-flat-preview li) {
    margin-bottom: 0.25rem !important;
    display: list-item !important;
  }

  /* Tables */
  :global(.ProseMirror table), 
  :global(.prose table), 
  :global(.is-flat-preview table) {
    border-collapse: collapse !important;
    margin: 1rem 0 !important;
    width: 100% !important;
    border: 2px solid #000000 !important;
  }

  :global(.ProseMirror th), 
  :global(.ProseMirror td), 
  :global(.prose th), 
  :global(.prose td), 
  :global(.is-flat-preview th), 
  :global(.is-flat-preview td) {
    border: 2px solid #000000 !important;
    padding: 8px 12px !important;
    min-width: 60px !important;
    text-align: left !important;
    color: #000000 !important; /* Force black text color */
    position: relative !important;
  }

  :global(.ProseMirror th), 
  :global(.prose th), 
  :global(.is-flat-preview th) {
    background-color: #f3f4f6 !important;
    font-weight: 800 !important;
  }

  /* Table Column Resizing handles & classes */
  :global(.ProseMirror table .column-resize-handle) {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: -2px;
    width: 4px;
    background-color: #2563EB !important; /* Use premium neo-blue for resize handles */
    pointer-events: none;
    cursor: col-resize;
  }

  :global(.ProseMirror table .selectedCell::after) {
    z-index: 2;
    position: absolute;
    content: "";
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(250, 204, 21, 0.15) !important; /* light yellow tint for selection */
    pointer-events: none;
  }

  :global(.ProseMirror .resize-cursor) {
    cursor: col-resize !important;
  }
</style>
