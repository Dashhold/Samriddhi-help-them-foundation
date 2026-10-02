/**
 * Prints one element on its own. The element is copied into a top-level sheet so that
 * scrolling modals and fixed layouts cannot clip it, and the page size is set per document.
 */
export function printElement(
  element: HTMLElement | null,
  { pageSize = "A4 portrait", margin = "12mm" } = {},
) {
  if (!element) return
  const sheet = document.createElement("div")
  sheet.className = "print-sheet"
  sheet.appendChild(element.cloneNode(true))
  const pageStyle = document.createElement("style")
  pageStyle.textContent = `@page { size: ${pageSize}; margin: ${margin}; }`

  document.head.appendChild(pageStyle)
  document.body.appendChild(sheet)
  document.body.classList.add("is-printing")

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup)
    document.body.classList.remove("is-printing")
    sheet.remove()
    pageStyle.remove()
  }
  window.addEventListener("afterprint", cleanup)
  window.print()
}
