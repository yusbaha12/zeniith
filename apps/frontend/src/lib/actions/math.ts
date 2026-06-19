/*
Tujuan: Menyediakan custom Svelte action untuk merender rumus matematika LaTeX menggunakan KaTeX secara otomatis.
Caller: Komponen materi/soal read-only, opsi pilihan ganda, dan preview editor.
Dependensi: Library katex dan extension auto-render.
Main Functions: math(node: HTMLElement, content?: any)
Side Effects: Memodifikasi DOM element terpilih dengan menyisipkan HTML rumus terformat dari KaTeX.
*/

import renderMathInElement from 'katex/dist/contrib/auto-render'

export function math(node: HTMLElement, textContent: any) {
  const render = (val: any) => {
    let text = ''
    let isHtml = false

    if (val && typeof val === 'object') {
      text = extractPlainText(val)
    } else {
      text = String(val || '')
      const trimmed = text.trim()
      // Deteksi jika konten berupa HTML string (misalnya dari Tiptap HTML preview)
      isHtml = trimmed.startsWith('<') && trimmed.endsWith('>')
    }

    // Reset node content sesuai jenisnya
    if (isHtml) {
      node.innerHTML = text
    } else {
      node.textContent = text
    }

    if (!text.trim()) {
      return
    }

    try {
      renderMathInElement(node, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      })
    } catch (err) {
      console.error('KaTeX rendering error:', err)
    }
  }

  function extractPlainText(content: any): string {
    if (!content) {
      return ''
    }
    const walk = (n: any): string[] => {
      if (!n) {
        return []
      }
      const own = typeof n.text === 'string' ? [n.text] : []
      const children = Array.isArray(n.content) ? n.content.flatMap(walk) : []
      return [...own, ...children]
    }
    return walk(content).join(' ').trim()
  }

  render(textContent)

  return {
    update(newVal: any) {
      render(newVal)
    }
  }
}
