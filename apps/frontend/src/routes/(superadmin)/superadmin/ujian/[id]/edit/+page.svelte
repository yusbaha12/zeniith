<!--
Tujuan: Menyediakan halaman edit ujian super admin untuk menambah dan mengubah soal ujian nasional.
Caller: Route `/superadmin/ujian/[id]/edit`.
Dependensi: Exam API frontend dan MaterialRichEditor.
Main Functions: Memuat detail ujian, menampilkan daftar soal, dan menyimpan soal baru/perubahan soal.
Side Effects: Melakukan HTTP call ke backend superadmin detail ujian, create question, dan update question.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import MaterialRichEditor from '$lib/components/editor/MaterialRichEditor.svelte'
  import { math } from '$lib/actions/math'
  import { examApi } from '$lib/infrastructure/api/exam.api'

  let { data } = $props<{ data: { examId: string } }>()

  const makeDoc = (text: string) => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }]
      }
    ]
  })

  // State
  let payload = $state<{ exam: any; questions: any[] } | null>(null)
  let selectedQuestionId = $state<string | null>(null)
  let formError = $state<string | null>(null)
  let isSaving = $state(false)
  let activeStep = $state<1 | 2 | 3>(1)
  let questionContent = $state<Record<string, unknown> | null>(makeDoc(''))
  let explanationContent = $state<Record<string, unknown> | null>(makeDoc(''))
  let form = $state({
    score: 10,
    sortOrder: 1,
    options: [
      { id: undefined as string | undefined, optionKey: 'A', text: '', isCorrect: false, sortOrder: 1 },
      { id: undefined as string | undefined, optionKey: 'B', text: '', isCorrect: false, sortOrder: 2 },
      { id: undefined as string | undefined, optionKey: 'C', text: '', isCorrect: false, sortOrder: 3 },
      { id: undefined as string | undefined, optionKey: 'D', text: '', isCorrect: false, sortOrder: 4 },
      { id: undefined as string | undefined, optionKey: 'E', text: '', isCorrect: false, sortOrder: 5 }
    ]
  })

  const loadExam = async () => {
    payload = await examApi.superadminGetExamDetail(data.examId)
  }

  const addOption = () => {
    const nextIndex = form.options.length
    const nextKey = String.fromCharCode(65 + nextIndex)
    form.options = [
      ...form.options,
      {
        id: undefined,
        optionKey: nextKey,
        text: '',
        isCorrect: false,
        sortOrder: nextIndex + 1
      }
    ]
  }

  const removeOption = () => {
    if (form.options.length <= 2) return
    const popped = form.options[form.options.length - 1]
    form.options = form.options.slice(0, -1)
    if (popped.isCorrect) {
      form.options = form.options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === 0
      }))
    }
  }

  onMount(async () => {
    await loadExam()
  })

  const hydrateQuestion = (questionId: string | null) => {
    selectedQuestionId = questionId
    const question = payload?.questions.find((item) => item.id === questionId)

    if (!question) {
      questionContent = makeDoc('')
      explanationContent = makeDoc('')
      form.score = 10
      form.sortOrder = (payload?.questions.length ?? 0) + 1
      form.options = [
        { id: undefined, optionKey: 'A', text: '', isCorrect: false, sortOrder: 1 },
        { id: undefined, optionKey: 'B', text: '', isCorrect: false, sortOrder: 2 },
        { id: undefined, optionKey: 'C', text: '', isCorrect: false, sortOrder: 3 },
        { id: undefined, optionKey: 'D', text: '', isCorrect: false, sortOrder: 4 },
        { id: undefined, optionKey: 'E', text: '', isCorrect: false, sortOrder: 5 }
      ]
      activeStep = 1
      return
    }

    const toText = (content: Record<string, unknown> | null | undefined) => {
      const walk = (node: any): string[] => {
        if (!node) return []
        const own = typeof node.text === 'string' ? [node.text] : []
        const children = Array.isArray(node.content) ? node.content.flatMap(walk) : []
        return [...own, ...children]
      }
      return walk(content).join(' ').trim()
    }

    questionContent = question.contentJson
    explanationContent = question.explanationJson ?? makeDoc('')
    form.score = question.score
    form.sortOrder = question.sortOrder
    form.options = question.options.map((option: any) => ({
      id: option.id,
      optionKey: option.optionKey,
      text: toText(option.contentJson),
      isCorrect: !!option.isCorrect,
      sortOrder: option.sortOrder ?? 0
    }))
    activeStep = 1
  }

  const saveQuestion = async () => {
    isSaving = true
    formError = null

    try {
      const payloadQuestion = {
        questionType: 'MULTIPLE_CHOICE',
        contentJson: questionContent,
        explanationJson: explanationContent,
        score: Number(form.score),
        sortOrder: Number(form.sortOrder),
        options: form.options.map((option) => ({
          id: option.id,
          optionKey: option.optionKey,
          contentJson: makeDoc(option.text),
          isCorrect: option.isCorrect,
          sortOrder: option.sortOrder
        }))
      }

      if (selectedQuestionId) {
        await examApi.superadminUpdateQuestion(selectedQuestionId, payloadQuestion)
      } else {
        await examApi.superadminCreateQuestion(data.examId, payloadQuestion)
      }

      await loadExam()
      hydrateQuestion(null)
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Soal gagal disimpan'
    } finally {
      isSaving = false
    }
  }
</script>

{#if payload}
  <section class="space-y-6">
    <div class="flex rounded-2xl border-4 border-black bg-white shadow-solid overflow-hidden">
      <!-- Accent bar representing the active section -->
      <div class="w-4 bg-neo-stripes-blue border-r-4 border-black flex-shrink-0"></div>
      
      <div class="flex-grow p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="inline-block rounded-md border-2 border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-solid-sm">
                Administrasi Global
              </span>
              <span class="inline-block rounded-md border-2 border-black bg-neo-blue px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-solid-sm">
                Edit Soal Ujian
              </span>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tight text-ink">{payload.exam.title}</h1>
            <p class="mt-2 text-sm font-bold text-ink/60">Kelola butir soal, bobot penilaian, dan opsi jawaban secara terpusat.</p>
          </div>
          
          <div class="flex flex-wrap gap-2 md:mt-2">
            <span class="rounded-lg border-2 border-black bg-slate-100 px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 transition-transform cursor-default">
              📚 {payload.exam.subjectName ?? 'Umum'}
            </span>
            <span class="rounded-lg border-2 border-black bg-slate-100 px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 transition-transform cursor-default">
              ⏱️ {payload.exam.durationMinutes} Menit
            </span>
            <span class="rounded-lg border-2 border-black bg-slate-100 px-3 py-1.5 text-xs font-extrabold uppercase text-black shadow-solid-sm hover:-translate-y-0.5 transition-transform cursor-default">
              📝 {payload.questions.length} Soal
            </span>
          </div>
        </div>

        <div class="mt-6 border-t-[3px] border-black/10 pt-4">
          <a href="/superadmin/ujian" class="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-white px-3.5 py-1.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
            &larr; Kembali ke Daftar Ujian
          </a>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.25fr_0.75fr]">
      <aside class="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black uppercase tracking-[0.22em] text-ink/50">Daftar Soal</p>
          <button type="button" class="rounded-xl border-[3px] border-black bg-black px-4 py-2 text-xs font-black uppercase text-neo-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" onclick={() => hydrateQuestion(null)}>Soal Baru</button>
        </div>

        {#each payload.questions as question, index}
          <button 
            type="button" 
            class={`block w-full rounded-xl p-4 text-left transition-all border-[3px] border-black ${selectedQuestionId === question.id ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'}`} 
            onclick={() => hydrateQuestion(question.id)}
          >
            <p class="text-sm font-black uppercase tracking-wider">Soal {index + 1}</p>
            <p class={`mt-1 text-xs font-bold ${selectedQuestionId === question.id ? 'text-neo-yellow' : 'text-ink/60'}`}>Bobot {question.score} Poin</p>
          </button>
        {/each}
      </aside>

      <div class="flex flex-col gap-6">
        <!-- Top Panel: Wizard Editor -->
        <div class="space-y-5 rounded-[2rem] border-[4px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <!-- Progress / Wizard Tabs -->
          <div class="flex items-center gap-2 border-b-[3px] border-black pb-4 mb-4">
            <button 
              type="button" 
              class={`flex-1 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black transition-all ${activeStep === 1 ? 'bg-neo-yellow text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] -translate-y-[1px]' : 'bg-white text-ink/70 hover:bg-lavender/10 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]'}`}
              onclick={() => activeStep = 1}
            >
              Langkah 1: Soal
            </button>
            <button 
              type="button" 
              class={`flex-1 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black transition-all ${activeStep === 2 ? 'bg-neo-yellow text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] -translate-y-[1px]' : 'bg-white text-ink/70 hover:bg-lavender/10 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]'}`}
              onclick={() => activeStep = 2}
            >
              Langkah 2: Opsi
            </button>
            <button 
              type="button" 
              class={`flex-1 rounded-xl border-[3px] border-black px-4 py-3 text-sm font-black transition-all ${activeStep === 3 ? 'bg-neo-yellow text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] -translate-y-[1px]' : 'bg-white text-ink/70 hover:bg-lavender/10 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]'}`}
              onclick={() => activeStep = 3}
            >
              Langkah 3: Pembahasan
            </button>
          </div>

          <!-- Wizard Content -->
          {#if activeStep === 1}
            <div class="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.22em] text-ink/50">Konten Soal</p>
                <div class="mt-3">
                  <MaterialRichEditor content={questionContent} onChange={(value) => (questionContent = value)} />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="block">
                  <span class="mb-2 block text-sm font-black text-black uppercase tracking-wide">Bobot Poin</span>
                  <input type="number" bind:value={form.score} class="w-full rounded-2xl border-[3px] border-black px-4 py-3 font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5" />
                </label>
                <label class="block">
                  <span class="mb-2 block text-sm font-black text-black uppercase tracking-wide">Urutan Tampil</span>
                  <input type="number" bind:value={form.sortOrder} class="w-full rounded-2xl border-[3px] border-black px-4 py-3 font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5" />
                </label>
              </div>
              <div class="flex justify-end pt-2">
                <button type="button" class="rounded-xl border-[3px] border-black bg-neo-green px-6 py-3 text-sm font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" onclick={() => activeStep = 2}>
                  Lanjut ke Opsi Jawaban &rarr;
                </button>
              </div>
            </div>
          {:else if activeStep === 2}
            <div class="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div class="flex items-center justify-between gap-3 mb-2">
                <p class="text-sm font-black uppercase tracking-[0.22em] text-ink/50">Opsi Jawaban ({form.options.length})</p>
                <div class="flex gap-2">
                  <button 
                    type="button" 
                    class="rounded-lg border-[3px] border-black bg-neo-red px-2.5 py-1 text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-40" 
                    onclick={removeOption} 
                    disabled={form.options.length <= 2}
                  >
                    Hapus Opsi
                  </button>
                  <button 
                    type="button" 
                    class="rounded-lg border-[3px] border-black bg-neo-green px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" 
                    onclick={addOption}
                  >
                    Tambah Opsi
                  </button>
                </div>
              </div>
              
              <div class="rounded-xl border-[3px] border-black bg-neo-yellow/10 p-3 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1 mb-2">
                <p class="font-extrabold uppercase">💡 Petunjuk Rumus (LaTeX):</p>
                <p>Gunakan delimiter <code class="bg-white/60 px-1 rounded">\( ... \)</code> untuk rumus dalam baris (inline).</p>
                <p>Gunakan <code class="bg-white/60 px-1 rounded">$$ ... $$</code> untuk baris baru (block).</p>
              </div>

              <div class="grid gap-4">
                {#each form.options as option, index}
                  <div class={`rounded-2xl border-[3px] p-4 transition-colors ${option.isCorrect ? 'border-neo-green bg-neo-green/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                    <div class="flex items-center gap-3">
                      <span class={`inline-flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-black font-extrabold ${option.isCorrect ? 'bg-neo-green text-black' : 'bg-slate-200 text-black'}`}>{option.optionKey}</span>
                      <input bind:value={option.text} class="flex-1 rounded-xl border-[3px] border-black px-4 py-2 font-black text-black bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-[1px] focus:-translate-y-[1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-neo-yellow/5" placeholder={`Isi opsi ${option.optionKey}`} />
                      <label class="flex items-center gap-2 text-sm font-black cursor-pointer select-none">
                        <input type="radio" name="correct-option" checked={option.isCorrect} onchange={() => {
                          form.options = form.options.map((item, innerIndex) => ({
                            ...item,
                            isCorrect: innerIndex === index
                          }))
                        }} class="w-5 h-5 rounded-full border-[3px] border-black bg-white accent-neo-green cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all focus:ring-0" />
                        BENAR
                      </label>
                    </div>
                  </div>
                {/each}
              </div>
              <div class="flex justify-between pt-2">
                <button type="button" class="rounded-xl border-[3px] border-black bg-white px-6 py-3 text-sm font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" onclick={() => activeStep = 1}>
                  &larr; Kembali
                </button>
                <button type="button" class="rounded-xl border-[3px] border-black bg-neo-green px-6 py-3 text-sm font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all" onclick={() => activeStep = 3}>
                  Lanjut ke Pembahasan &rarr;
                </button>
              </div>
            </div>
          {:else if activeStep === 3}
            <div class="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.22em] text-ink/50">Pembahasan Soal</p>
                <div class="mt-3">
                  <MaterialRichEditor content={explanationContent} onChange={(value) => (explanationContent = value)} />
                </div>
              </div>
              <div class="flex justify-between pt-2 border-t-[3px] border-black mt-6">
                <button type="button" class="rounded-xl border-[3px] border-black bg-white px-6 py-3 text-sm font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all mt-4" onclick={() => activeStep = 2}>
                  &larr; Kembali
                </button>
                <div class="flex gap-3 mt-4">
                  {#if formError}
                    <p class="text-sm font-black text-red-600 self-center mr-3">{formError}</p>
                  {/if}
                  <button type="button" class="rounded-xl border-[3px] border-black bg-black px-8 py-3 text-sm font-black text-neo-yellow uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50" onclick={saveQuestion} disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : selectedQuestionId ? 'Simpan Perubahan' : 'Tambah Soal'}
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Bottom Panel: Live Preview -->
        <div class="rounded-[2rem] border-[4px] border-black bg-neo-yellow/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p class="text-xs font-black uppercase tracking-[0.22em] text-black/60 mb-4 flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neo-red opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-neo-red"></span>
            </span>
            Live Preview (Tampilan Siswa)
          </p>
          
          <div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div class="text-black font-medium leading-relaxed">
              {#if questionContent && Array.isArray(questionContent.content) && questionContent.content.length > 0}
                <MaterialRichEditor content={questionContent} editable={false} flat={true} />
              {:else}
                <p class="text-black/40 italic">Teks soal belum diisi...</p>
              {/if}
            </div>

            <!-- Render Options -->
            <div class="mt-3 grid gap-2.5">
              {#each form.options as option}
                <div class={`flex w-full items-start gap-3 rounded-xl border-[3px] px-4 py-4 text-left text-sm font-black ${option.isCorrect ? 'border-neo-green bg-neo-green/10' : 'border-black bg-white'}`}>
                  <span class={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-black font-extrabold uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${option.isCorrect ? 'bg-neo-green text-black' : 'bg-white text-black'}`}>{option.optionKey}</span>
                  <span class="leading-7 text-black font-black">
                    {#if option.text}
                      <span use:math={option.text}></span>
                    {:else}
                      <span class="text-black/30 italic font-bold">Opsi kosong</span>
                    {/if}
                  </span>
                </div>
              {/each}
            </div>

            <!-- Render Explanation (Visible in Preview) -->
            {#if activeStep === 3}
              <div class="mt-8 rounded-xl border-[3px] border-black bg-neo-cyan/10 p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p class="text-xs font-black uppercase text-black mb-3">Preview Pembahasan:</p>
                <div class="text-black">
                  {#if explanationContent && Array.isArray(explanationContent.content) && explanationContent.content.length > 0}
                    <MaterialRichEditor content={explanationContent} editable={false} flat={true} />
                  {:else}
                    <p class="text-black/40 italic">Pembahasan belum diisi...</p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>
{/if}
