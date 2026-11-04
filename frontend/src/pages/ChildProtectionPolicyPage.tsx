import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Child Protection and Beneficiary Dignity Policy",
  body: "Our commitment to child protection and beneficiary dignity policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair child protection and beneficiary dignity policy",
}

export default function ChildProtectionPolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "our-commitment",
      title: "Our commitment",
      body: (
          <>
            <p>Samriddhi Help Team Foundation seeks to protect the safety, privacy and dignity of everyone involved in its activities, especially children and adults experiencing financial vulnerability. This policy applies to directors, staff, volunteers, members, programme partners and visitors acting in connection with our work.</p>
            <p>For safeguarding purposes, a child is anyone under 18. We prohibit abuse, exploitation, harassment, discrimination, humiliating treatment, coercion and retaliation. Assistance must never be exchanged for money paid to an individual, sexual or personal favours, political support or agreement to publicity.</p>
          </>
      ),
    },
    {
      id: "safe-educational-activities",
      title: "Safe educational activities",
      body: (
          <>
            <p>Children should participate through arrangements agreed with the appropriate parent, guardian or school, with any specific consent required for the activity. Adults must maintain professional boundaries, use appropriate language and avoid unnecessary private contact, isolation, unauthorised transport or unsupervised access to children.</p>
            <p>Checks, supervision and reporting arrangements must be appropriate to a person's role and the activity. Volunteers should coordinate through authorised Foundation representatives and school or guardian contacts rather than privately approaching children or requesting information on personal messaging accounts.</p>
          </>
      ),
    },
    {
      id: "marriage-assistance-and-adult-consent",
      title: "Marriage assistance and adult consent",
      body: (
          <>
            <p>We support only lawful marriages involving a woman aged at least 18 and a man aged at least 21, with the free and informed consent of both parties and satisfaction of other applicable legal requirements. Financial need must not be used to pressure someone into marriage.</p>
            <p>No representative may support a child marriage, arrange a forced marriage, demand dowry or make assistance conditional on a dowry payment. Assistance must be lawful and directed towards a verified charitable need. Where a safety or coercion concern arises, we may pause the activity and refer the concern to competent authorities as required.</p>
          </>
      ),
    },
    {
      id: "photographs-and-stories",
      title: "Photographs and stories",
      body: (
          <>
            <p>Consent to assistance and consent to publicity are separate. Before taking or publishing identifiable photographs, videos or stories, explain the purpose, likely audience and intended channels in a language the person understands. Obtain the adult's permission, or the appropriate parent or guardian's permission for a child together with the child's willing participation where appropriate.</p>
            <p>Do not stage distress, expose a person's poverty for publicity, or photograph someone in a humiliating situation. Avoid identifying details that create risk, such as a child's precise routine, home address, personal phone number or documents. A child's best interests may require declining publication even where an adult has consented.</p>
          </>
      ),
    },
    {
      id: "fair-selection-and-concerns",
      title: "Fair selection and concerns",
      body: (
          <p>Assistance is assessed on documented need and programme criteria. Beneficiaries may ask questions, decline optional photographs or raise concerns without losing support for that reason. Conflicts of interest, demands for a private payment and suspected misuse of materials or funds must be reported.</p>
      ),
    },
    {
      id: "reporting-and-response",
      title: "Reporting and response",
      body: (
          <>
            <p>Report a safeguarding concern promptly to {contact.email} or {contact.phone}, marking it “Safeguarding concern”. Share only information needed to understand the situation. Do not circulate allegations, identifying images or a child's account in public groups.</p>
            <p>We will prioritise immediate safety, limit information to those who need it and take proportionate protective action. We cannot promise absolute confidentiality where reporting or disclosure is required by law. Suspected offences involving children will be reported to the competent authorities as required; an internal review does not replace that obligation.</p>
            <p>If a person faces immediate danger, contact local emergency services or the police directly. Do not wait for the Foundation's email response. Concerns involving a Foundation representative will be referred for review by an unimplicated director or an appropriate independent person. No one may retaliate against a person raising a concern in good faith.</p>
          </>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Child Protection and Beneficiary Dignity Policy",
        summary: "Our child protection and beneficiary dignity policy as of 4 November 2026.",
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
