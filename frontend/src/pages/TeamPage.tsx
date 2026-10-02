import { useEffect, useRef, useState } from "react"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import MemberIdCard from "../components/MemberIdCard"
import { ButtonLink, Icon, PageHero } from "../components/ui"
import { ApiError } from "../lib/api"
import { printElement } from "../lib/print"
import { AppLink, resolvePublicAsset } from "../lib/router"
import {
  idCardPath,
  idCardUrl,
  memberDisplayName,
  type PublicMember,
} from "../members/contracts"
import {
  formatCardDate,
  formatMonthYear,
  isMembershipExpired,
} from "../members/format"
import { loadTeam, loadTeamMember } from "../members/repository"

const banner: PageBanner = {
  eyebrow: "Our team",
  title: "The people behind Samriddhi",
  body: "Approved members, volunteers and partner organisations who help us turn compassion into responsible action.",
  imageUrl: images.group,
  imageAlt: "Members of the community standing together",
}

function TeamCard({ member }: { member: PublicMember }) {
  const isOrganization = member.memberType === "organization"
  const name = memberDisplayName(member)
  const location = [member.city, member.state].filter(Boolean).join(", ")
  return (
    <article className="team-card">
      <div
        className={`team-card__photo ${
          isOrganization ? "team-card__photo--logo" : ""
        }`}
      >
        {member.photoUrl ? (
          <img
            src={resolvePublicAsset(member.photoUrl)}
            alt={isOrganization ? `${name} logo` : `Photo of ${name}`}
            loading="lazy"
          />
        ) : (
          <Icon name={isOrganization ? "building" : "users"} size={40} />
        )}
      </div>
      <div className="team-card__body">
        <span className="team-card__type">
          {isOrganization ? "Partner organisation" : "Member"}
        </span>
        <h3>{name}</h3>
        <p className="team-card__role">{member.designation}</p>
        {location ? (
          <p className="team-card__location">
            <Icon name="pin" size={14} /> {location}
          </p>
        ) : null}
        <AppLink className="team-card__link" to={idCardPath(member.memberCode)}>
          View ID card <Icon name="arrow" size={16} />
        </AppLink>
      </div>
    </article>
  )
}

export function TeamPage() {
  const [members, setMembers] = useState<PublicMember[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    loadTeam()
      .then((result) => {
        if (active) setMembers(result)
      })
      .catch((loadError) => {
        if (!active) return
        setMembers([])
        setError(
          loadError instanceof ApiError &&
            loadError.code === "API_NOT_CONFIGURED"
            ? "The team list is not available right now."
            : "The team list could not be loaded. Please try again shortly.",
        )
      })
    return () => {
      active = false
    }
  }, [])

  const people =
    members?.filter((item) => item.memberType === "individual") ?? []
  const partners =
    members?.filter((item) => item.memberType === "organization") ?? []

  return (
    <>
      <PageHero banner={banner} />
      <section className="content-section">
        <div className="page-shell">
          <div className="route-intro">
            <div>
              <span className="eyebrow">Members & volunteers</span>
              <h2 className="team-heading">
                People who stand with communities
              </h2>
            </div>
            <p>
              Everyone listed here has been reviewed and approved by the
              foundation. Open an ID card to see it in full or check that it is
              valid.
            </p>
          </div>

          {members === null ? (
            <div className="team-loading" role="status">
              <span aria-hidden="true" /> Loading the team…
            </div>
          ) : error ? (
            <div className="empty-state">
              <Icon name="users" size={33} />
              <h3>Team list unavailable</h3>
              <p>{error}</p>
            </div>
          ) : !members.length ? (
            <div className="empty-state">
              <Icon name="users" size={33} />
              <h3>Our team is growing</h3>
              <p>
                Approved members will appear here. Be one of the first to join
                the foundation.
              </p>
            </div>
          ) : (
            <>
              {people.length ? (
                <div className="team-grid">
                  {people.map((member) => (
                    <TeamCard key={member.memberCode} member={member} />
                  ))}
                </div>
              ) : null}
              {partners.length ? (
                <>
                  <h2 className="team-subheading">Partner organisations</h2>
                  <div className="team-grid">
                    {partners.map((member) => (
                      <TeamCard key={member.memberCode} member={member} />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}

          <div className="team-cta">
            <div>
              <h3>Want to be part of the team?</h3>
              <p>
                Join as a volunteer or member, or partner with us as an
                organisation.
              </p>
            </div>
            <ButtonLink to="/join">Join us</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt("Copy this ID card link", url)
    }
  }
  return (
    <button className="button button--text" type="button" onClick={copy}>
      {copied ? "Link copied" : "Copy link"}
      <Icon name={copied ? "check" : "copy"} size={16} />
    </button>
  )
}

export function MemberIdCardPage({ code }: { code: string }) {
  const [member, setMember] = useState<PublicMember | null>(null)
  const [status, setStatus] =
    useState<"loading" | "ready" | "missing" | "error">("loading")
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    loadTeamMember(code)
      .then((result) => {
        if (!active) return
        setMember(result)
        setStatus("ready")
      })
      .catch((loadError) => {
        if (!active) return
        setStatus(
          loadError instanceof ApiError && loadError.status === 404
            ? "missing"
            : "error",
        )
      })
    return () => {
      active = false
    }
  }, [code])

  useEffect(() => {
    if (member) {
      document.title = `${memberDisplayName(member)} · ID card · Samriddhi Help Team Foundation`
    }
  }, [member])

  const expired = member ? isMembershipExpired(member.validUntil) : false

  return (
    <section className="content-section id-card-page">
      <div className="page-shell">
        <AppLink className="id-card-back-link" to="/team">
          <Icon name="arrow" size={16} /> Back to the team
        </AppLink>

        {status === "loading" ? (
          <div className="team-loading" role="status">
            <span aria-hidden="true" /> Loading ID card…
          </div>
        ) : null}

        {status === "missing" || status === "error" ? (
          <div className="empty-state">
            <Icon name="shield" size={33} />
            <h3>
              {status === "missing"
                ? "ID card not found"
                : "ID card could not be loaded"}
            </h3>
            <p>
              {status === "missing"
                ? `No valid member was found for ID ${code}. The card may have been withdrawn, or the link may be incorrect.`
                : "Please check your connection and try again."}
            </p>
          </div>
        ) : null}

        {status === "ready" && member ? (
          <div className="id-card-layout">
            <div className="id-card-stage" ref={cardRef}>
              <MemberIdCard
                member={member}
                verifyUrl={idCardUrl(member.memberCode)}
              />
            </div>
            <aside className="id-card-status">
              <span
                className={`id-card-status__badge ${
                  expired ? "is-expired" : ""
                }`}
              >
                <Icon name={expired ? "clock" : "shield"} size={16} />
                {expired ? "Card expired" : "Verified member"}
              </span>
              <h1>{memberDisplayName(member)}</h1>
              <p className="id-card-status__role">
                {member.designation} · {member.memberCode}
              </p>
              <dl>
                <div>
                  <dt>Member since</dt>
                  <dd>{formatMonthYear(member.memberSince)}</dd>
                </div>
                <div>
                  <dt>Valid until</dt>
                  <dd>{formatCardDate(member.validUntil)}</dd>
                </div>
              </dl>
              <p>
                {expired
                  ? "This card is past its validity date. Contact the foundation to renew it."
                  : "This ID card was issued by Samriddhi Help Team Foundation after reviewing the member's application."}
              </p>
              <div className="id-card-actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() =>
                    printElement(cardRef.current, {
                      pageSize: "A4 portrait",
                      margin: "15mm",
                    })
                  }
                >
                  Print or save as PDF <Icon name="download" size={17} />
                </button>
                <CopyLinkButton url={idCardUrl(member.memberCode)} />
              </div>
              <small>
                The printed card is actual ID-card size (54 × 85.6 mm). Cut
                along the edges and laminate the front and back together.
              </small>
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  )
}
