import { FormEvent, useEffect, useState } from "react"
import { useCms } from "../../cms/CmsProvider"
import { Campaign, FundRaisingContent } from "../../cms/types"
import { Icon } from "../../components/ui"
import AssetUpload from "../components/AssetUpload"
import { useAdminFeedback } from "../components/AdminFeedback"
import { createId } from "../utils"

type Props = { onSaved: (message: string) => void }

function newCampaign(): Campaign {
  return {
    id: createId("campaign"),
    title: "New fundraising appeal",
    summary:
      "Explain the verified need, intended use of funds and who the appeal supports.",
    imageUrl: "",
    imageAlt: "",
    goalAmount: 100000,
    raisedAmount: 0,
    status: "draft",
    featured: false,
  }
}

export default function FundRaisingSection({ onSaved }: Props) {
  const { content, revision, update } = useCms()
  const [draft, setDraft] = useState<FundRaisingContent>(() =>
    structuredClone(content.fundraising),
  )
  const [saving, setSaving] = useState(false)
  const { confirm } = useAdminFeedback()
  useEffect(() => setDraft(structuredClone(content.fundraising)), [revision])
  const removeCampaign = async (campaign: Campaign) => {
    const name = campaign.title.trim()
    const approved = await confirm({
      title: name ? `Delete “${name}”?` : "Delete this appeal?",
      message:
        "This appeal and its image will be removed from the Fund Raising section. Click Save & publish afterwards to update the live website.",
      confirmLabel: "Delete appeal",
    })
    if (!approved) return
    setDraft((current) => ({
      ...current,
      campaigns: current.campaigns.filter((item) => item.id !== campaign.id),
    }))
    onSaved(
      `${
        name ? `“${name}”` : "Appeal"
      } removed. Click Save & publish to update the live website.`,
    )
  }
  const changeCampaign = (id: string, patch: Partial<Campaign>) =>
    setDraft((current) => ({
      ...current,
      campaigns: current.campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, ...patch } : campaign,
      ),
    }))
  const save = async (event: FormEvent) => {
    event.preventDefault()
    const incomplete = draft.campaigns.find(
      (campaign) =>
        campaign.status === "active" &&
        (!campaign.title.trim() ||
          !campaign.summary.trim() ||
          !campaign.imageUrl),
    )
    if (incomplete) {
      alert(
        `Active campaign "${incomplete.title || "Untitled"}" needs a title, summary and uploaded image.`,
      )
      return
    }
    setSaving(true)
    try {
      await update((next) => ({ ...next, fundraising: draft }))
      onSaved("Fund Raising section published.")
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Fundraising content could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <div className="admin-section-head">
        <div>
          <h2>Fund Raising</h2>
          <p>
            Manage the complete public fundraising section shown above Our
            Focus.
          </p>
        </div>
        <button
          className="admin-button"
          type="submit"
          form="fundraising-form"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>
      <form id="fundraising-form" className="admin-grid" onSubmit={save}>
        <section className="admin-card">
          <h3>Section presentation</h3>
          <p>
            These fields control the heading and visibility of the entire
            fundraising section.
          </p>
          <div className="admin-form-grid">
            <div className="admin-toggle admin-field--full">
              <div>
                <span>Show Fund Raising section</span>
                <small>
                  When hidden, no campaigns appear on the public homepage
                </small>
              </div>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) =>
                  setDraft({ ...draft, enabled: event.target.checked })
                }
              />
            </div>
            <label className="admin-field">
              <span>Eyebrow</span>
              <input
                required
                value={draft.eyebrow}
                onChange={(event) =>
                  setDraft({ ...draft, eyebrow: event.target.value })
                }
              />
            </label>
            <label className="admin-field">
              <span>Section title</span>
              <input
                required
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </label>
            <label className="admin-field admin-field--full">
              <span>Section description</span>
              <textarea
                required
                value={draft.body}
                onChange={(event) =>
                  setDraft({ ...draft, body: event.target.value })
                }
              />
            </label>
          </div>
        </section>
        <section className="admin-card">
          <div className="admin-section-head">
            <div>
              <h3>Fundraising appeals</h3>
              <p>
                Only appeals marked Active are public. Raised amounts must be
                based on verified records.
              </p>
            </div>
            <button
              className="admin-button admin-button--secondary"
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  campaigns: [...current.campaigns, newCampaign()],
                }))
              }
            >
              <Icon name="plus" size={15} />
              Add appeal
            </button>
          </div>
          <div className="admin-list">
            {draft.campaigns.map((campaign, index) => (
              <details
                className="admin-card"
                open={draft.campaigns.length === 1}
                key={campaign.id}
              >
                <summary className="admin-campaign-summary">
                  <span>{campaign.title || `Appeal ${index + 1}`}</span>
                  <span
                    className={`admin-badge ${
                      campaign.status === "draft"
                        ? "admin-badge--draft"
                        : campaign.status === "completed"
                          ? "admin-badge--offline"
                          : ""
                    }`}
                  >
                    {campaign.status}
                  </span>
                </summary>
                <div className="admin-form-grid" style={{ marginTop: 20 }}>
                  <label className="admin-field">
                    <span>Appeal title</span>
                    <input
                      required
                      value={campaign.title}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          title: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Publishing status</span>
                    <select
                      value={campaign.status}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          status: event.target.value as Campaign["status"],
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className="admin-field admin-field--full">
                    <span>Appeal description</span>
                    <textarea
                      required
                      value={campaign.summary}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          summary: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Funding goal (₹)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={campaign.goalAmount}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          goalAmount: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Verified amount raised (₹)</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={campaign.raisedAmount}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          raisedAmount: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="admin-field admin-field--full">
                    <AssetUpload
                      label="Appeal image"
                      value={campaign.imageUrl}
                      folder="fundraising"
                      onChange={(imageUrl) =>
                        changeCampaign(campaign.id, { imageUrl })
                      }
                    />
                  </div>
                  <label className="admin-field admin-field--full">
                    <span>Image description for accessibility</span>
                    <input
                      required
                      value={campaign.imageAlt}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          imageAlt: event.target.value,
                        })
                      }
                      placeholder="Describe the people and activity shown"
                    />
                  </label>
                  <div className="admin-toggle">
                    <div>
                      <span>Featured appeal</span>
                      <small>Featured appeals are displayed first</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={campaign.featured}
                      onChange={(event) =>
                        changeCampaign(campaign.id, {
                          featured: event.target.checked,
                        })
                      }
                    />
                  </div>
                  <button
                    className="admin-button admin-button--danger"
                    type="button"
                    onClick={() => void removeCampaign(campaign)}
                  >
                    <Icon name="trash" size={14} />
                    Remove appeal
                  </button>
                </div>
              </details>
            ))}
            {!draft.campaigns.length && (
              <div className="admin-empty">
                <Icon name="heart" size={30} />
                <h3>No fundraising appeals</h3>
                <p>
                  The section can remain visible with an honest “no active
                  appeal” message, or you can add a draft now.
                </p>
              </div>
            )}
          </div>
          <div className="admin-form-actions">
            <button className="admin-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Fund Raising section"}
            </button>
          </div>
        </section>
      </form>
    </>
  )
}
