/*
Tujuan: Menampilkan pesan validasi inline di bawah input/textarea form tanpa tooltip browser bawaan.
Caller: Route Svelte yang memasang `use:inlineValidationForm` pada elemen `<form>`.
Dependensi: Constraint Validation API browser dan atribut HTML field seperti required, min, max, minlength, accept.
Main Functions: Menangkap event invalid/input/change dan menampilkan atau menghapus error inline per field.
Side Effects: Memanipulasi DOM di dalam form untuk menyisipkan elemen error dan memperbarui atribut `aria-invalid`.
*/

import type { Action } from 'svelte/action'

type InlineValidationFormOptions = {
  errorMessageClass?: string
}

type SupportedControl = HTMLInputElement | HTMLTextAreaElement

const CONTROL_SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
  'textarea'
].join(', ')

const DEFAULT_OPTIONS: Required<InlineValidationFormOptions> = {
  errorMessageClass: 'mt-2 block text-[11px] font-black text-neo-red'
}

function resolveValidationMessage(control: SupportedControl) {
  if (control.validity.valueMissing && control.dataset.requiredMessage) {
    return control.dataset.requiredMessage
  }

  if (control.validity.patternMismatch && control.dataset.patternMessage) {
    return control.dataset.patternMessage
  }

  if (control.validity.tooShort && control.dataset.minlengthMessage) {
    return control.dataset.minlengthMessage
  }

  if (control.validity.rangeUnderflow && control.dataset.minMessage) {
    return control.dataset.minMessage
  }

  if (control.validity.rangeOverflow && control.dataset.maxMessage) {
    return control.dataset.maxMessage
  }

  return control.validationMessage
}

function createHintNode(control: SupportedControl, options: Required<InlineValidationFormOptions>) {
  const hintNode = document.createElement('p')
  hintNode.className = 'hidden'
  hintNode.dataset.validationHint = 'true'
  hintNode.textContent = ''
  hintNode.id = `${control.name || control.id || 'field'}-validation-hint`
  control.insertAdjacentElement('afterend', hintNode)
  control.setAttribute('aria-describedby', hintNode.id)
  return hintNode
}

export const inlineValidationForm: Action<HTMLFormElement, InlineValidationFormOptions | undefined> = (
  form,
  providedOptions = {}
) => {
  const options = { ...DEFAULT_OPTIONS, ...providedOptions }
  const hintMap = new WeakMap<SupportedControl, HTMLParagraphElement>()
  const controls = Array.from(form.querySelectorAll<SupportedControl>(CONTROL_SELECTOR))

  const ensureHintNode = (control: SupportedControl) => {
    let hintNode = hintMap.get(control)
    if (!hintNode) {
      hintNode = createHintNode(control, options)
      hintMap.set(control, hintNode)
    }
    return hintNode
  }

  const resetControlState = (control: SupportedControl) => {
    const hintNode = ensureHintNode(control)
    hintNode.className = 'hidden'
    hintNode.textContent = ''
    control.setAttribute('aria-invalid', 'false')
    control.setCustomValidity('')
  }

  const showControlError = (control: SupportedControl) => {
    const hintNode = ensureHintNode(control)
    const message = resolveValidationMessage(control)
    hintNode.className = options.errorMessageClass
    hintNode.textContent = message
    control.setAttribute('aria-invalid', 'true')
  }

  const handleInvalid = (event: Event) => {
    const control = event.target
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
      return
    }

    event.preventDefault()
    showControlError(control)
  }

  const handleInput = (event: Event) => {
    const control = event.target
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
      return
    }

    if (control.checkValidity()) {
      resetControlState(control)
    }
  }

  const handleChange = (event: Event) => {
    const control = event.target
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
      return
    }

    if (control.checkValidity()) {
      resetControlState(control)
      return
    }

    showControlError(control)
  }

  controls.forEach((control) => {
    ensureHintNode(control)
    control.setAttribute('aria-invalid', 'false')
  })

  form.addEventListener('invalid', handleInvalid, true)
  form.addEventListener('input', handleInput, true)
  form.addEventListener('change', handleChange, true)

  return {
    destroy() {
      form.removeEventListener('invalid', handleInvalid, true)
      form.removeEventListener('input', handleInput, true)
      form.removeEventListener('change', handleChange, true)
    }
  }
}
