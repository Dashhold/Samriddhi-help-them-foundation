import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Website Disclaimer",
  body: "Important information about the use and limitations of website content.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair website disclaimer",
}

export default function WebsiteDisclaimerPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "general-information",
      title: "General information and care",
      body: (
        <>
          <p>Samriddhi Help Team Foundation provides website information to explain its charitable work and ways to participate. Information is general and is not individual legal, tax, investment or financial advice. We take reasonable care over its accuracy, but programme information can change as needs and resources change.</p>
          <p>Photographs labelled as illustrative or obtained from image libraries do not establish that the people shown are Foundation beneficiaries. Published activity totals and impact claims should be read with their stated dates, scope and supporting records. A team member's earlier work with another group is not automatically the Foundation's own achievement.</p>
        </>
      ),
    },
    {
      id: "registration-documents",
      title: "Registration and approvals",
      body: (
        <p>The publication of incorporation, tax or other registration documents does not represent an unconditional government endorsement, guaranteed tax deduction or permission to accept every type of contribution. Check the approval relevant to your donation and contact us if clarification is needed.</p>
      ),
    },
    {
      id: "programme-outcomes",
      title: "Programme outcomes",
      body: (
        <p>We do not guarantee a particular beneficiary selection, wedding budget, school result, tree survival rate or campaign outcome. Any specific written commitment accepted by the Foundation and rights under applicable law remain unaffected.</p>
      ),
    },
    {
      id: "external-services",
      title: "External services and liability",
      body: (
        <p>External websites and services are governed by their own terms. Nothing in this disclaimer excludes responsibility for fraud, wilful misconduct, negligence or a liability that cannot lawfully be excluded. For corrections or concerns, email {contact.email} or call {contact.phone}.</p>
      ),
    },
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Important information",
        title: "Understanding our website content",
        summary: "This disclaimer explains the nature and limitations of information provided on our website, including programme details, photographs, and registration documents.",
        scope: "This disclaimer applies to all content published on samriddhiteam.com.",
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
