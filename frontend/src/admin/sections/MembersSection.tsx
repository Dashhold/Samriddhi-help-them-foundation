import { useEffect, useMemo, useRef, useState } from "react"
import MemberIdCard from "../../components/MemberIdCard"
import { Icon } from "../../components/ui"
import { printElement } from "../../lib/print"
import { AppLink, resolvePublicAsset } from "../../lib/router"
import {
  idCardPath,
  idCardUrl,
  memberDetailFields,
  memberDisplayName,
  optionLabel,
  toPublicMember,
  type AdminMember,
  type MemberStatus,
} from "../../members/contracts"
import { addOneYear, formatCardDate } from "../../members/format"
import {
  deleteMember,
  loadMembers,
  updateMember,
} from "../../members/repository"
import { useAdminFeedback } from "../components/AdminFeedback"

type Props = { onSaved: (message: string) => void }
type Filter = MemberStatus | "all"

const filters: [Filter, string][] = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["all", "All"],
]

const statusBadge: Record<MemberStatus, string> = {
  pending: "admin-badge admin-badge--draft",
  approved: "admin-badge",
  rejected: "admin-badge admin-badge--offline",
}

function formatAppliedDate(value: string) {
  if (!value) return ""
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value))
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

type ApprovalDraft = {
  designation: string
  validUntil: string
  showOnTeam: boolean
  adminNote: string
}

function approvalDraftFor(member: AdminMember): ApprovalDraft {
  return {
    designation: member.designation,
    validUntil: member.validUntil || addOneYear(new Date()),
    showOnTeam: member.showOnTeam,
    adminNote: member.adminNote,
  }
}

function IdCardPreview({
  member,
  onClose,
}: {
  member: AdminMember
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const publicMember = toPublicMember(member)
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="admin-modal admin-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label={`ID card for ${memberDisplayName(member)}`}
      >
        <div className="admin-modal__head">
          <h2>ID card · {member.memberCode}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="admin-id-card-stage" ref={cardRef}>
          <MemberIdCard
            member={publicMember}
            verifyUrl={idCardUrl(member.memberCode)}
          />
        </div>
        <div className="admin-form-actions">
          <AppLink
            className="admin-button admin-button--secondary"
            to={idCardPath(member.memberCode)}
            target="_blank"
          >
            Open public page <Icon name="external" size={14} />
          </AppLink>
          <button
            className="admin-button"
            type="button"
            onClick={() =>
              printElement(cardRef.current, {
                pageSize: "A4 portrait",
                margin: "15mm",
              })
            }
          >
            <Icon name="download" size={14} /> Print / save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MembersSection({ onSaved }: Props) {
  const { confirm, notify } = useAdminFeedback()
  const [members, setMembers] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [filter, setFilter] = useState<Filter>("pending")
  const [reviewing, setReviewing] = useState<AdminMember | null>(null)
  const [approval, setApproval] = useState<ApprovalDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [cardMember, setCardMember] = useState<AdminMember | null>(null)

  const refresh = async () => {
    setLoading(true)
    setLoadError("")
    try {
      setMembers(await loadMembers("all"))
    } catch (error) {
      setLoadError(errorText(error, "Join requests could not be loaded."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: members.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    }
    for (const member of members) result[member.status] += 1
    return result
  }, [members])

  const visible =
    filter === "all"
      ? members
      : members.filter((member) => member.status === filter)

  const open = (member: AdminMember) => {
    setReviewing(member)
    setApproval(approvalDraftFor(member))
  }
  const close = () => {
    setReviewing(null)
    setApproval(null)
  }
  const replace = (updated: AdminMember) =>
    setMembers((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    )

  const save = async (status: MemberStatus) => {
    if (!reviewing || !approval) return
    setSaving(true)
    try {
      const updated = await updateMember(reviewing.id, {
        status,
        designation: approval.designation.trim(),
        validUntil: approval.validUntil,
        showOnTeam: approval.showOnTeam,
        adminNote: approval.adminNote.trim(),
      })
      replace(updated)
      if (status === "approved" && reviewing.status !== "approved") {
        onSaved(
          `${memberDisplayName(updated)} approved. ID card ${updated.memberCode} is ready.`,
        )
        close()
        setCardMember(updated)
      } else if (status === "rejected" && reviewing.status !== "rejected") {
        onSaved(`${memberDisplayName(updated)} rejected.`)
        close()
      } else {
        onSaved("Member details saved.")
        setReviewing(updated)
        setApproval(approvalDraftFor(updated))
      }
    } catch (error) {
      notify(errorText(error, "The member could not be updated."), "error")
    } finally {
      setSaving(false)
    }
  }

  const reject = async () => {
    if (!reviewing) return
    const wasApproved = reviewing.status === "approved"
    const approved = await confirm({
      title: wasApproved
        ? `Withdraw ${memberDisplayName(reviewing)}'s membership?`
        : `Reject ${memberDisplayName(reviewing)}'s application?`,
      message: wasApproved
        ? "They will be removed from the Team page and their ID card link will stop working. You can approve them again later."
        : "The application will move to Rejected and will not appear on the Team page. You can still approve it later.",
      confirmLabel: wasApproved ? "Withdraw membership" : "Reject application",
      icon: "close",
    })
    if (approved) await save("rejected")
  }

  const remove = async (member: AdminMember) => {
    const approved = await confirm({
      title: `Delete ${memberDisplayName(member)}'s application?`,
      message:
        member.status === "approved"
          ? "This permanently deletes the member, their photo and their ID card. The card link will stop working. This cannot be undone."
          : "This permanently deletes the application and the uploaded photo. This cannot be undone.",
      confirmLabel: "Delete permanently",
    })
    if (!approved) return
    try {
      await deleteMember(member.id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
      if (reviewing?.id === member.id) close()
      onSaved(`${memberDisplayName(member)} deleted.`)
    } catch (error) {
      notify(errorText(error, "The application could not be deleted."), "error")
    }
  }

  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Join requests & team</h2>
          <p>
            Review people and organisations who applied through Join us.
            Approving creates their member ID card and adds them to the Team
            page.
          </p>
        </div>
        <button
          className="admin-button admin-button--secondary"
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <section className="admin-card">
        <div
          className="admin-tabs"
          role="tablist"
          aria-label="Filter by status"
        >
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label} <span>{counts[value]}</span>
            </button>
          ))}
        </div>

        {loadError ? (
          <div className="admin-auth-error" style={{ marginBottom: 14 }}>
            {loadError}
          </div>
        ) : null}

        <div className="admin-list">
          {visible.map((member) => (
            <article
              className="admin-list-item admin-member-item"
              key={member.id}
            >
              {member.photoUrl ? (
                <img
                  src={resolvePublicAsset(member.photoUrl)}
                  alt=""
                  className={
                    member.memberType === "organization"
                      ? "admin-member-logo"
                      : undefined
                  }
                />
              ) : (
                <span className="admin-preview-image" />
              )}
              <div>
                <div className="admin-member-badges">
                  <span className={statusBadge[member.status]}>
                    {member.status}
                  </span>
                  <span className="admin-badge admin-badge--neutral">
                    {member.memberType === "organization"
                      ? "Organisation"
                      : "Individual"}
                  </span>
                  {member.memberCode ? (
                    <span className="admin-badge admin-badge--neutral">
                      {member.memberCode}
                    </span>
                  ) : null}
                </div>
                <h4>{memberDisplayName(member)}</h4>
                <p>
                  {member.designation}
                  {member.city ? ` · ${member.city}` : ""} · Applied{" "}
                  {formatAppliedDate(member.createdAt)}
                </p>
              </div>
              <div className="admin-list-item__actions">
                {member.status === "approved" ? (
                  <button
                    className="admin-icon-button"
                    type="button"
                    onClick={() => setCardMember(member)}
                    aria-label={`View ID card for ${memberDisplayName(member)}`}
                    title="View ID card"
                  >
                    <Icon name="shield" size={15} />
                  </button>
                ) : null}
                <button
                  className="admin-icon-button"
                  type="button"
                  onClick={() => open(member)}
                  aria-label={`Review ${memberDisplayName(member)}`}
                  title="Review"
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  className="admin-icon-button admin-icon-button--danger"
                  type="button"
                  onClick={() => void remove(member)}
                  aria-label={`Delete ${memberDisplayName(member)}`}
                  title="Delete"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </article>
          ))}
          {!loading && !visible.length ? (
            <div className="admin-empty">
              <Icon name="users" size={28} />
              <h3>
                {filter === "pending"
                  ? "No pending join requests"
                  : "Nothing to show here"}
              </h3>
              <p>
                New applications from the Join us page will appear under
                Pending.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {reviewing && approval ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && close()
          }
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-label={`Review ${memberDisplayName(reviewing)}`}
          >
            <div className="admin-modal__head">
              <h2>{memberDisplayName(reviewing)}</h2>
              <button type="button" onClick={close} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="admin-member-review">
              <div
                className={`admin-member-photo ${
                  reviewing.memberType === "organization"
                    ? "admin-member-photo--logo"
                    : ""
                }`}
              >
                {reviewing.photoUrl ? (
                  <a
                    href={resolvePublicAsset(reviewing.photoUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={resolvePublicAsset(reviewing.photoUrl)}
                      alt={`Uploaded image for ${memberDisplayName(reviewing)}`}
                    />
                  </a>
                ) : (
                  <Icon name="users" size={34} />
                )}
              </div>
              <dl className="admin-member-details">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={statusBadge[reviewing.status]}>
                      {reviewing.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>
                    {reviewing.memberType === "organization"
                      ? "Company / organisation"
                      : "Individual"}
                  </dd>
                </div>
                {reviewing.memberType === "organization" ? (
                  <div>
                    <dt>Contact person</dt>
                    <dd>{reviewing.name}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${reviewing.email}`}>{reviewing.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${reviewing.phone.replace(/\s/g, "")}`}>
                      {reviewing.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>City / state</dt>
                  <dd>
                    {[reviewing.city, reviewing.state]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
                <div>
                  <dt>Applied on</dt>
                  <dd>{formatAppliedDate(reviewing.createdAt)}</dd>
                </div>
                {reviewing.memberCode ? (
                  <div>
                    <dt>Member ID</dt>
                    <dd>{reviewing.memberCode}</dd>
                  </div>
                ) : null}
                {memberDetailFields[reviewing.memberType]
                  .filter((field) => reviewing.details[field.key])
                  .map((field) => (
                    <div
                      key={field.key}
                      className={
                        ["address", "motivation", "about", "skills"].includes(
                          field.key,
                        )
                          ? "admin-member-details__wide"
                          : undefined
                      }
                    >
                      <dt>{field.label}</dt>
                      <dd>
                        {field.key === "dateOfBirth"
                          ? formatCardDate(reviewing.details[field.key] ?? "")
                          : field.options
                            ? optionLabel(
                                field.options,
                                reviewing.details[field.key] ?? "",
                              )
                            : reviewing.details[field.key]}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>

            <div className="admin-member-approval">
              <h3>
                {reviewing.status === "approved"
                  ? "ID card details"
                  : "Approve and create ID card"}
              </h3>
              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Role shown on ID card</span>
                  <input
                    value={approval.designation}
                    maxLength={80}
                    onChange={(event) =>
                      setApproval({
                        ...approval,
                        designation: event.target.value,
                      })
                    }
                    placeholder="Volunteer"
                  />
                </label>
                <label className="admin-field">
                  <span>Valid until</span>
                  <input
                    type="date"
                    value={approval.validUntil}
                    onChange={(event) =>
                      setApproval({
                        ...approval,
                        validUntil: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="admin-toggle admin-field--full">
                  <div>
                    <span>Show on the Team page</span>
                    <small>
                      The ID card link works either way while the member is
                      approved.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={approval.showOnTeam}
                    onChange={(event) =>
                      setApproval({
                        ...approval,
                        showOnTeam: event.target.checked,
                      })
                    }
                  />
                </div>
                <label className="admin-field admin-field--full">
                  <span>Internal note (not public)</span>
                  <textarea
                    value={approval.adminNote}
                    maxLength={1000}
                    onChange={(event) =>
                      setApproval({
                        ...approval,
                        adminNote: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="admin-form-actions admin-form-actions--spread">
              <button
                className="admin-button admin-button--danger"
                type="button"
                onClick={() => void remove(reviewing)}
                disabled={saving}
              >
                <Icon name="trash" size={14} /> Delete
              </button>
              <div>
                {reviewing.status !== "rejected" ? (
                  <button
                    className="admin-button admin-button--secondary"
                    type="button"
                    onClick={() => void reject()}
                    disabled={saving}
                  >
                    {reviewing.status === "approved" ? "Withdraw" : "Reject"}
                  </button>
                ) : null}
                {reviewing.status === "approved" ? (
                  <>
                    <button
                      className="admin-button admin-button--secondary"
                      type="button"
                      onClick={() => {
                        const member = reviewing
                        close()
                        setCardMember(member)
                      }}
                    >
                      View ID card
                    </button>
                    <button
                      className="admin-button"
                      type="button"
                      onClick={() => void save("approved")}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </>
                ) : (
                  <button
                    className="admin-button"
                    type="button"
                    onClick={() => void save("approved")}
                    disabled={saving}
                  >
                    <Icon name="check" size={14} />
                    {saving ? "Approving…" : "Approve & create ID card"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cardMember ? (
        <IdCardPreview
          member={cardMember}
          onClose={() => setCardMember(null)}
        />
      ) : null}
    </>
  )
}
