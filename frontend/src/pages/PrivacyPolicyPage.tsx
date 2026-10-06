import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import { ButtonLink, Icon, PageHero, type IconName } from "../components/ui"
import { AppLink } from "../lib/router"
import type { ReactNode } from "react"

const banner: PageBanner = {
  eyebrow: "Privacy & trust",
  title: "Your information, handled with care",
  body: "How Samriddhi Help Team Foundation collects, uses, protects and shares information when you visit, contact, donate, volunteer or partner with us.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and responsible information practices",
}

const policyLinks = [
  ["scope", "Scope and responsibility"],
  ["information", "Information we collect"],
  ["use", "How information is used"],
  ["donations", "Donations and receipts"],
  ["members", "Members and partners"],
  ["public-content", "Public profiles and records"],
  ["cookies", "Cookies and external services"],
  ["sharing", "When information is shared"],
  ["retention", "Retention"],
  ["security", "Security"],
  ["children", "Children and young people"],
  ["rights", "Your choices and rights"],
  ["contact", "Contact and updates"],
] as const

const informationCards: {
  icon: IconName
  title: string
  body: string
}[] = [
  {
    icon: "mail",
    title: "Enquiries",
    body: "Your name, email address, optional phone number and message when you prepare or send an enquiry.",
  },
  {
    icon: "heart",
    title: "Donations and receipts",
    body: "Donor or company name, contact details, amount, date, purpose and transaction reference; PAN and address may be recorded when needed for an eligible receipt.",
  },
  {
    icon: "users",
    title: "Member applications",
    body: "Identity, contact, address, participation, skills and motivation details, plus a photo for an individual or logo for an organisation.",
  },
  {
    icon: "building",
    title: "Organisation partnerships",
    body: "Organisation type, registration or CIN, optional GSTIN and PAN, website, representative details and the proposed form of collaboration.",
  },
  {
    icon: "shield",
    title: "Technical and security data",
    body: "IP address, browser or device information, request identifiers, timestamps and security or rate-limit events that may be processed by our hosting and API systems.",
  },
  {
    icon: "document",
    title: "Content you ask us to publish",
    body: "Approved profile details, photographs, organisation logos, stories, documents or other material supplied with permission for public display.",
  },
]

function PolicySection({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="policy-section" id={id}>
      <span className="policy-section__number">Section {number}</span>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function PrivacyPolicyPage() {
  const { content } = useCms()
  const { contact } = content

  return (
    <>
      <PageHero banner={banner} />

      <section className="content-section policy-overview">
        <div className="page-shell policy-overview__grid">
          <div className="policy-overview__copy">
            <span className="eyebrow">A clear commitment</span>
            <h2>Privacy built around dignity, consent and transparency</h2>
            <p>
              Samriddhi Help Team Foundation works with donors, volunteers,
              members, organisations and communities. We collect only the
              information reasonably needed to respond, verify support,
              administer memberships, issue records and operate the website.
            </p>
            <div className="policy-meta">
              <Icon name="shield" size={22} />
              <div>
                <strong>
                  Effective and last updated: <time dateTime="2026-10-02">2 October 2026</time>
                </strong>
                <span>
                  This policy applies to this website, its public forms and the
                  Foundation's related administrative records.
                </span>
              </div>
            </div>
          </div>

          <aside className="policy-controller" aria-label="Responsible organisation">
            <span className="policy-controller__label">Responsible organisation</span>
            <h2>Samriddhi Help Team Foundation</h2>
            <p>
              A Section 8 company based in Hisar, Haryana. The Foundation is
              responsible for deciding how information covered by this policy
              is handled.
            </p>
            <dl>
              <div>
                <dt>Leadership</dt>
                <dd>जगबीर सिंह गढ़वाल · Founder &amp; Director</dd>
              </div>
              <div>
                <dt>Privacy contact</dt>
                <dd>{contact.email}</dd>
              </div>
              <div>
                <dt>Registered office</dt>
                <dd>{contact.address}</dd>
              </div>
            </dl>
            <ButtonLink to="/about#jagbir-singh" kind="light">
              Founder &amp; leadership
            </ButtonLink>
          </aside>
        </div>
      </section>

      <section className="content-section content-section--gray">
        <div className="page-shell policy-layout">
          <aside className="policy-toc" aria-label="Privacy Policy sections">
            <span>On this page</span>
            <nav>
              {policyLinks.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="policy-document">
            <PolicySection id="scope" number="01" title="Scope and responsibility">
              <p>
                This policy applies when you browse this website, contact the
                Foundation, request donation verification, apply as a member or
                volunteer, represent an organisation, or provide information
                for an approved public profile, ID card, story or record.
              </p>
              <p>
                The Foundation is led by जगबीर सिंह गढ़वाल, Founder &amp;
                Director, together with its directors, members and authorised
                team. Only authorised people should access private application,
                donation and administrative information for Foundation work.
              </p>
            </PolicySection>

            <PolicySection id="information" number="02" title="Information we collect">
              <p>
                The information collected depends on how you interact with us.
                Required fields are identified in the relevant form; optional
                fields may be left blank.
              </p>
              <div className="policy-cards">
                {informationCards.map((item) => (
                  <section className="policy-card" key={item.title}>
                    <span className="policy-card__icon">
                      <Icon name={item.icon} size={21} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </section>
                ))}
              </div>
              <div className="policy-note">
                <strong>Sensitive identifiers:</strong> please provide PAN,
                GSTIN, transaction references or similar identifiers only when
                relevant to a partnership, verification or lawful receipt. The
                Foundation will never ask for your UPI PIN, OTP, card PIN or
                banking password.
              </div>
            </PolicySection>

            <PolicySection id="use" number="03" title="How information is used">
              <p>We may use information to:</p>
              <ul>
                <li>respond to questions, support requests and collaboration proposals;</li>
                <li>review volunteer, member and organisation applications;</li>
                <li>verify donations and prepare acknowledgements or eligible receipts;</li>
                <li>create and administer approved member ID cards and public team profiles;</li>
                <li>maintain accounting, governance, compliance and audit records;</li>
                <li>protect the website, prevent misuse and investigate technical problems;</li>
                <li>publish content where permission has been given; and</li>
                <li>meet applicable legal, regulatory or reporting obligations.</li>
              </ul>
              <p>
                We rely on your consent for optional public display and direct
                communications, and on necessary administrative and legal
                purposes for membership, donation and compliance records. You
                may withdraw consent for future optional use by contacting us.
              </p>
            </PolicySection>

            <PolicySection id="donations" number="04" title="Donations and receipts">
              <p>
                The current donation page displays verified bank or UPI details.
                Transfers take place through your chosen banking or UPI service,
                not inside this website. The verification form prepares an email
                or WhatsApp message on your device containing the details you
                enter; it reaches the selected service only when you choose to
                continue and send it.
              </p>
              <p>
                After a transfer is verified, authorised administrators may
                create an accounting or receipt record containing the donor's
                name, company name, email, phone, amount, payment date, mode,
                reference, purpose and notes. PAN and postal address may also be
                recorded where supplied for tax or receipt requirements.
              </p>
              <p>
                We do not request or store UPI PINs, OTPs, card PINs or online
                banking passwords. If an external payment gateway is introduced,
                its own terms and privacy notice will apply to information it
                processes directly.
              </p>
            </PolicySection>

            <PolicySection id="members" number="05" title="Members, volunteers and partners">
              <p>
                Individual applications may include name, date of birth, gender,
                occupation, email, phone, address, city, state, PIN code,
                availability, skills, interests, motivation and a photograph.
                Organisation applications may include the registered name and
                address, organisation type, registration or CIN, optional GSTIN
                and PAN, website, representative details, collaboration proposal
                and logo.
              </p>
              <p>
                Applications are reviewed by authorised administrators. An
                approved record may be assigned a member code, designation,
                approval date and validity date. Private contact, address and
                application details are not displayed on the public team page.
              </p>
            </PolicySection>

            <PolicySection id="public-content" number="06" title="Public profiles, stories and records">
              <p>
                With consent and approval, an individual's name, photograph,
                role and city—or an organisation's name, logo, role and city—may
                appear on the team page and verifiable ID card. You can ask us to
                review, correct or remove optional public profile information.
              </p>
              <p>
                The website also publishes leadership information about Founder
                &amp; Director जगबीर सिंह गढ़वाल, Director कुलदीप कुमार and
                Member मोहनलाल गोस्वामी, together with governance and compliance
                documents supplied for organisational transparency. Official
                records may contain details required by the issuing authority;
                contact us if you believe a public record should be reviewed or
                replaced with an appropriately redacted copy.
              </p>
              <p>
                Stories and photographs involving beneficiaries should be shared
                with dignity and appropriate permission. We avoid publishing
                private contact details unless there is a clear, authorised need.
              </p>
            </PolicySection>

            <PolicySection id="cookies" number="07" title="Cookies, analytics and external services">
              <p>
                Public visitors do not need an account, and this site is not
                currently configured with advertising cookies or Google
                Analytics. The About page stores your selected biography
                language in browser local storage so the preference can be
                remembered on that device. An authorised administrator's
                temporary session is stored in that administrator's browser
                session storage and is removed when cleared or expired.
              </p>
              <p>
                Pages may load fonts from Google Fonts and photographs from
                Unsplash. Those providers, and our hosting infrastructure, may
                receive technical information such as an IP address, browser
                details and the requested resource. Email, WhatsApp, banking and
                other external links take you to services governed by their own
                privacy practices.
              </p>
            </PolicySection>

            <PolicySection id="sharing" number="08" title="When information is shared">
              <p>We do not sell or rent personal information. Information may be shared only:</p>
              <ul>
                <li>with authorised Foundation directors, administrators and team members who need it for their role;</li>
                <li>with hosting, database, email, messaging, payment or technical providers acting for the relevant service;</li>
                <li>with professional advisers, auditors or authorities where reasonably necessary; or</li>
                <li>when required by law, regulation, legal process, safety or fraud prevention.</li>
              </ul>
              <p>
                Public profile or story information is shared publicly only after
                the related approval or consent process.
              </p>
            </PolicySection>

            <PolicySection id="retention" number="09" title="How long information is kept">
              <p>
                Information is kept only for as long as reasonably needed for the
                purpose for which it was collected, ongoing membership or
                partnership administration, dispute handling, security,
                accounting, tax, audit and other legal obligations.
              </p>
              <p>
                Enquiries and unsuccessful applications may be removed when no
                longer useful. Approved membership records may be kept while the
                relationship remains active and for a reasonable period
                afterwards. Donation and receipt records may need to be retained
                for applicable statutory accounting and tax periods. Backup or
                append-only audit records may take additional time to expire.
              </p>
            </PolicySection>

            <PolicySection id="security" number="10" title="How information is protected">
              <p>
                We use proportionate safeguards such as HTTPS in deployment,
                restricted administrator access, validated uploads and form
                inputs, hashed administrator credentials and session tokens,
                request rate limits, audit records and controlled database access.
              </p>
              <p>
                No website, transmission or storage system can be guaranteed
                completely secure. Please avoid sending unnecessary sensitive
                information, and contact us promptly if you suspect misuse or an
                incorrect public disclosure.
              </p>
            </PolicySection>

            <PolicySection id="children" number="11" title="Children and young people">
              <p>
                Some Foundation programmes may support children or young people,
                but the website's application and donation features are intended
                for adults and authorised organisation representatives. A parent
                or legal guardian should contact the Foundation before submitting
                personal information for someone under 18.
              </p>
              <p>
                We seek appropriate permission before publishing a child's name,
                image or story and aim to use the minimum detail necessary to
                communicate the Foundation's work safely and respectfully.
              </p>
            </PolicySection>

            <PolicySection id="rights" number="12" title="Your choices and rights">
              <p>
                Subject to applicable law and necessary identity checks, you may
                ask us to provide access to, correct, update or delete information
                about you; withdraw consent for future optional use; stop direct
                communications; or review public profile and image permissions.
              </p>
              <p>
                We may need to keep limited information where required for tax,
                accounting, legal claims, fraud prevention, audit integrity or
                another lawful obligation. We will explain this where relevant.
              </p>
            </PolicySection>

            <PolicySection id="contact" number="13" title="Contact, concerns and policy updates">
              <div className="policy-contact">
                <h3>Contact the Foundation about privacy</h3>
                <p>
                  Describe the information or page concerned and the action you
                  are requesting. We may ask for reasonable proof of identity
                  before changing a private or public record.
                </p>
                <p>
                  Email: {contact.email}
                  <br />
                  Phone: {contact.phone}
                  <br />
                  Address: {contact.address}
                </p>
                <div className="policy-contact__actions">
                  <a className="button button--primary" href={`mailto:${contact.email}?subject=Privacy%20request`}>
                    Email a privacy request <Icon name="mail" size={17} />
                  </a>
                  <ButtonLink to="/about" kind="light">
                    About the Foundation
                  </ButtonLink>
                </div>
              </div>
              <h3>Updates to this policy</h3>
              <p>
                We may update this policy when website features, service
                providers, legal requirements or Foundation practices change.
                The effective date at the top will be revised when a material
                update is published.
              </p>
              <p>
                For transparency records, visit the <AppLink to="/documents">Documents page</AppLink>.
              </p>
            </PolicySection>
          </article>
        </div>
      </section>
    </>
  )
}
