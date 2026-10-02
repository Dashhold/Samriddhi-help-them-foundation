import logo from "../imports/samriddhi-logo.png"
import { useCms } from "../cms/CmsProvider"
import { organizationDetails } from "../lib/organization"
import { resolvePublicAsset } from "../lib/router"
import { memberDisplayName, type PublicMember } from "../members/contracts"
import {
  formatCardDate,
  formatMonthYear,
  isMembershipExpired,
} from "../members/format"
import QrCode from "./QrCode"
import { Icon } from "./ui"

type MemberIdCardProps = {
  member: PublicMember
  verifyUrl: string
}

/** Front and back of a CR80-sized ID card (54 × 85.6 mm when printed). */
export default function MemberIdCard({ member, verifyUrl }: MemberIdCardProps) {
  const { content } = useCms()
  const organization = organizationDetails(content)
  const isOrganization = member.memberType === "organization"
  const displayName = memberDisplayName(member)
  const location = [member.city, member.state].filter(Boolean).join(", ")
  const expired = isMembershipExpired(member.validUntil)
  const shortUrl = verifyUrl.replace(/^https?:\/\//, "")

  return (
    <div className="member-id-card-pair">
      <article
        className="member-id-card member-id-card--front"
        aria-label={`ID card for ${displayName}`}
      >
        <div className="id-card-ribbon" aria-hidden="true" />
        <header className="id-card-brand">
          <img src={logo} alt={organization.name} />
        </header>
        <span className="id-card-type">
          {isOrganization ? "Partner organisation" : "Member identity card"}
        </span>
        <div
          className={`id-card-photo ${
            isOrganization ? "id-card-photo--logo" : ""
          }`}
        >
          {member.photoUrl ? (
            <img
              src={resolvePublicAsset(member.photoUrl)}
              alt={
                isOrganization
                  ? `${displayName} logo`
                  : `Photo of ${displayName}`
              }
            />
          ) : (
            <Icon name={isOrganization ? "building" : "users"} size={40} />
          )}
        </div>
        <h3 className="id-card-name">{displayName}</h3>
        {isOrganization && member.name ? (
          <p className="id-card-represented">Represented by {member.name}</p>
        ) : null}
        <p className="id-card-designation">
          {member.designation || (isOrganization ? "Partner" : "Member")}
        </p>
        <dl className="id-card-facts">
          <div>
            <dt>ID no.</dt>
            <dd>{member.memberCode}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{formatMonthYear(member.memberSince)}</dd>
          </div>
          <div>
            <dt>Valid until</dt>
            <dd>{formatCardDate(member.validUntil)}</dd>
          </div>
          {location ? (
            <div>
              <dt>Location</dt>
              <dd>{location}</dd>
            </div>
          ) : null}
        </dl>
        <footer className="id-card-verify">
          <QrCode
            value={verifyUrl}
            label={`QR code to verify ID card ${member.memberCode}`}
            className="id-card-qr"
          />
          <div>
            <strong>Scan to verify</strong>
            <span>{shortUrl}</span>
          </div>
        </footer>
        {expired ? (
          <span className="id-card-expired" aria-label="This card has expired">
            Expired
          </span>
        ) : null}
      </article>

      <article
        className="member-id-card member-id-card--back"
        aria-label={`Back of ID card ${member.memberCode}`}
      >
        <div className="id-card-ribbon" aria-hidden="true" />
        <h4>{organization.name}</h4>
        <p className="id-card-back-sub">Section 8 Company · Hisar, Haryana</p>
        <ul className="id-card-terms">
          <li>
            This card is the property of {organization.name} and cannot be
            transferred.
          </li>
          <li>
            It identifies the holder as an approved{" "}
            {isOrganization ? "partner organisation" : "member"} of the
            foundation until the date shown.
          </li>
          <li>
            Scan the QR code on the front to check that the card is genuine and
            still valid.
          </li>
          <li>If found, please return it to the address below.</li>
        </ul>
        <address className="id-card-contact">
          <span>{organization.address}</span>
          <span>{organization.phone}</span>
          <span>{organization.email}</span>
        </address>
        <div className="id-card-sign">
          <span aria-hidden="true" />
          Authorised signatory
        </div>
        <footer className="id-card-legal">
          {organization.cin ? `CIN ${organization.cin}` : organization.name}
          {organization.licence
            ? ` · Section 8 Licence No. ${organization.licence}`
            : ""}
        </footer>
      </article>
    </div>
  )
}
