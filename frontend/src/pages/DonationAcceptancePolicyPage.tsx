import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Donation Acceptance and Fund Utilisation Policy",
  body: "Our commitment to donation acceptance and fund utilisation policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair donation acceptance and fund utilisation policy",
}

export default function DonationAcceptancePolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "purpose-and-use-of-funds",
      title: "Purpose and use of funds",
      body: (
          <>
            <p>Samriddhi Help Team Foundation accepts voluntary support for its charitable objects and programmes concerning marriage assistance for women from financially vulnerable families, tree plantation and children's educational materials, including school uniforms.</p>
            <p>Donations may fund direct assistance and reasonable, documented costs needed to deliver and administer these programmes, such as procurement, transport, verification, coordination, accounting and reporting. We do not claim that every donation is spent entirely on a single beneficiary or that the Foundation has no administrative costs.</p>
          </>
      ),
    },
    {
      id: "general-and-restricted-contributions",
      title: "General and restricted contributions",
      body: (
          <>
            <p>Unless we expressly accept a written restriction, a donation supports the Foundation's charitable work generally. A preference entered in a message will be considered but is not an individually agreed grant arrangement unless confirmed by us. Campaign-specific representations made before donation remain relevant to the purpose for which the funds were solicited.</p>
            <p>An accepted restriction must be lawful and consistent with our objects. If its purpose becomes impossible, materially changes, or receives more funding than needed, we will follow the arrangements disclosed when accepting it. Where those arrangements do not authorise another use, we will seek the donor's agreement or consider return of the unspent amount, subject to applicable law. Restricted funds will not be silently diverted to an unrelated activity.</p>
          </>
      ),
    },
    {
      id: "official-donation-channels-and-verification",
      title: "Official donation channels and verification",
      body: (
          <>
            <p>Use only the Foundation's published bank or UPI details. Volunteers and members cannot collect donations into personal accounts or make commitments on our behalf without written authority. If a request seems suspicious, verify it through our official contact before paying.</p>
            <p>We may request information necessary to establish a contribution's source, donor identity or lawful purpose, and may decline or return a contribution where required by law or where its conditions conflict with our objects, dignity or independence. A donor cannot require access to a beneficiary's private documents, political support or participation in a marriage.</p>
          </>
      ),
    },
    {
      id: "foreign-contributions",
      title: "Foreign contributions",
      body: (
          <>
            <p>Our domestic donation facility must not be used to send contributions classified as foreign contribution under the Foreign Contribution Regulation Act. Any proposal involving a foreign source must be discussed with us before payment and accepted only where the required permissions and lawful banking arrangements are established. The website does not represent that the Foundation holds FCRA registration or prior permission.</p>
            <p>Paying in Indian rupees does not, by itself, make a foreign-source donation domestic. Contributions by foreign citizens, including OCI cardholders, require separate assessment. An Indian citizen residing abroad may have a different position depending on the source and route of the funds; please contact us first for verification.</p>
          </>
      ),
    },
    {
      id: "tax-records-and-reporting",
      title: "Tax records and reporting",
      body: (
          <>
            <p>The Documents page contains the Foundation's published registration and approval records. Historic or provisional approval documents do not establish eligibility for every contribution indefinitely. Donors should obtain confirmation of the applicable approval and certificate arrangements for the relevant period before relying on a deduction.</p>
            <p>We provide relevant acknowledgements and statutory donation certificates where applicable, based on verified records and required donor information. Eligibility and the amount of a deduction depend on the law and the donor's circumstances. In-kind contributions are not automatically eligible for a monetary donation deduction.</p>
          </>
      ),
    },
    {
      id: "programme-reporting-and-independence",
      title: "Programme reporting and independence",
      body: (
          <>
            <p>Impact statements and utilisation updates should be based on supporting records. Beneficiary details will be protected. An estimate of a programme cost is not a guarantee of a particular outcome or an undertaking to spend the donor's exact money on a named item.</p>
            <p>Plantation support does not create a carbon credit, transferable environmental entitlement or guaranteed tree survival. Marriage assistance does not guarantee full wedding expenses. Educational support does not guarantee admission, school fee payment or academic results unless a specific programme expressly provides otherwise.</p>
          </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
          <p>For contribution proposals or utilisation questions, email {contact.email} or call {contact.phone}. Postal address: {contact.address}</p>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Donation Acceptance and Fund Utilisation Policy",
        summary: "Our donation acceptance and fund utilisation policy as of 4 November 2026.",
        scope: "This policy applies to all interactions with the Foundation.",
        updated: { dateTime: "2026-11-04", label: "4 November 2026" },
      }}
      glance={{
        label: "At a glance",
        title: "Key information",
        text: "Essential details about this policy.",
        facts: [
          ["Last updated", "4 November 2026"],
          ["Contact", contact.email],
        ],
        link: { to: "/terms-and-conditions", label: "Terms & Conditions" },
      }}
      sections={sections}
    />
  )
}
