import { useEffect, useId, useRef } from "react"
import { Icon } from "./ui"
import ThankYouCertificate from "./ThankYouCertificate"

type CertificatePreviewModalProps = {
  open: boolean
  onClose: () => void
}

export default function CertificatePreviewModal({
  open,
  onClose,
}: CertificatePreviewModalProps) {
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const modal = dialog.current
    if (!open || !modal) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    if (!modal.open) modal.showModal()
    closeButton.current?.focus()

    return () => {
      if (modal.open) modal.close()
      document.body.style.overflow = previousOverflow
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialog}
      className="certificate-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="certificate-modal__panel">
        <div className="certificate-modal__heading">
          <div>
            <span className="eyebrow">Design preview</span>
            <h2 id={titleId}>Thank-you certificate</h2>
            <p>
              This sample uses placeholder details and is not evidence of a
              donation. A personalized version may be created only from a paid,
              confirmed donation record.
            </p>
          </div>
          <button
            ref={closeButton}
            className="certificate-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close certificate preview"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="certificate-print-root">
          <ThankYouCertificate />
        </div>
        <div className="certificate-modal__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => window.print()}
          >
            Print or save as PDF <Icon name="document" size={18} />
          </button>
          <button
            className="button button--text"
            type="button"
            onClick={onClose}
          >
            Close preview
          </button>
        </div>
      </div>
    </dialog>
  )
}
