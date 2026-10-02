import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { Icon, type IconName } from "../../components/ui"

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  icon?: IconName
}

type NoticeTone = "success" | "error"

type AdminFeedback = {
  /** Shows a warning dialog and resolves `true` only when the action is confirmed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Shows a short confirmation remark (or an error) in the corner of the dashboard. */
  notify: (message: string, tone?: NoticeTone) => void
}

// Used only if a component renders outside the dashboard provider.
const fallback: AdminFeedback = {
  confirm: (options) =>
    Promise.resolve(window.confirm(`${options.title}\n\n${options.message}`)),
  notify: () => undefined,
}

const AdminFeedbackContext = createContext<AdminFeedback | null>(null)

export function useAdminFeedback(): AdminFeedback {
  return useContext(AdminFeedbackContext) ?? fallback
}

type ConfirmRequest = ConfirmOptions & { id: number }
// Multi-line on purpose: the pinned oxfmt 0.2.0 drops the separators of one-line type literals.
type PendingConfirm = {
  id: number
  resolve: (approved: boolean) => void
}
type Notice = {
  id: number
  message: string
  tone: NoticeTone
}

export default function AdminFeedbackProvider({
  children,
}: {
  children: ReactNode
}) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const pending = useRef<PendingConfirm | null>(null)
  const counter = useRef(0)

  // Settling is keyed by request id, so a late event from an old dialog cannot answer a newer one.
  const settle = useCallback((id: number, approved: boolean) => {
    if (pending.current?.id !== id) return
    pending.current.resolve(approved)
    pending.current = null
    setRequest(null)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    // Only one warning is shown at a time; a newer request cancels the older one.
    pending.current?.resolve(false)
    counter.current += 1
    const id = counter.current
    return new Promise<boolean>((resolve) => {
      pending.current = { id, resolve }
      setRequest({ ...options, id })
    })
  }, [])

  const notify = useCallback(
    (message: string, tone: NoticeTone = "success") => {
      counter.current += 1
      setNotice({ id: counter.current, message, tone })
    },
    [],
  )

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6000 : 3500,
    )
    return () => window.clearTimeout(timer)
  }, [notice])

  // A pending warning counts as cancelled if the dashboard closes, for example after sign-out.
  useEffect(() => () => pending.current?.resolve(false), [])

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify])

  return (
    <AdminFeedbackContext.Provider value={value}>
      {children}
      {request && (
        <ConfirmDialog key={request.id} request={request} onSettle={settle} />
      )}
      {notice && (
        <div
          key={notice.id}
          className={`admin-toast${
            notice.tone === "error" ? " admin-toast--error" : ""
          }`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          <Icon
            name={notice.tone === "error" ? "warning" : "check"}
            size={15}
          />
          <span>{notice.message}</span>
        </div>
      )}
    </AdminFeedbackContext.Provider>
  )
}

function ConfirmDialog({
  request,
  onSettle,
}: {
  request: ConfirmRequest
  onSettle: (id: number, approved: boolean) => void
}) {
  const titleId = useId()
  const messageId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const answer = (approved: boolean) => onSettle(request.id, approved)

  useEffect(() => {
    const modal = dialog.current
    if (!modal) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (!modal.open) modal.showModal()
    // Cancel is the safe default, so pressing Enter never deletes anything.
    cancelButton.current?.focus()
    return () => {
      if (modal.open) modal.close()
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="admin-confirm"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault()
        answer(false)
      }}
      onClose={() => {
        // The browser can force-close a dialog, for example on a repeated Escape.
        if (!dialog.current?.open) answer(false)
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) answer(false)
      }}
    >
      <div className="admin-confirm__panel">
        <span className="admin-confirm__icon">
          <Icon name="warning" size={24} />
        </span>
        <h2 id={titleId}>{request.title}</h2>
        <p id={messageId}>{request.message}</p>
        <div className="admin-confirm__actions">
          <button
            ref={cancelButton}
            className="admin-button admin-button--secondary"
            type="button"
            onClick={() => answer(false)}
          >
            {request.cancelLabel ?? "Cancel"}
          </button>
          <button
            className="admin-button admin-button--destructive"
            type="button"
            onClick={() => answer(true)}
          >
            <Icon name={request.icon ?? "trash"} size={14} />
            {request.confirmLabel ?? "Delete"}
          </button>
        </div>
      </div>
    </dialog>
  )
}
