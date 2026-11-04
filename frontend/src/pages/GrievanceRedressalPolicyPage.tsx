import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Grievance Redressal Policy",
  body: "Our commitment to grievance redressal policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair grievance redressal policy",
}

export default function GrievanceRedressalPolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "what-you-can-raise",
      title: "What you can raise",
      body: (
          <p>Donors, beneficiaries, parents, guardians, volunteers, members and website visitors can raise concerns about payments, records, privacy, applications, programme conduct, discrimination, safeguarding, misleading claims or misuse of the Foundation's name. You do not have to donate or be a member to submit a concern.</p>
      ),
    },
    {
      id: "grievance-contact",
      title: "Grievance contact",
      body: (
          <>
            <p>Grievance Officer: [NAME AND DESIGNATION OF APPOINTED GRIEVANCE OFFICER]</p>
            <p>Organisation: Samriddhi Help Team Foundation.</p>
            <p>Email: {contact.email}. Phone: {contact.phone}.</p>
            <p>Postal address: {contact.address}</p>
            <p>Use the subject “Grievance” and briefly state what happened, the relevant date or reference, your preferred contact and the resolution you seek. Attach relevant evidence with unrelated personal information redacted. Never include a PIN, OTP or banking password. Where writing is difficult, you may contact us by phone and ask for assistance recording your concern.</p>
          </>
      ),
    },
    {
      id: "review-and-response",
      title: "Review and response",
      body: (
          <>
            <p>We aim to acknowledge complaints within 2 working days and provide a substantive response or resolution as soon as possible, ordinarily within one month of receipt. Working days exclude Saturdays, Sundays and public holidays in Haryana. Any shorter legal deadline applies in preference to these targets. If a matter needs more time, we will explain the reason and expected next step without extending any mandatory deadline.</p>
            <p>We may request proportionate verification or further information. Complaints will be shared only with people needed to assess and address them, subject to legal reporting duties. Anonymous concerns may be reviewed where enough information is available, although we may be unable to provide an individual response.</p>
          </>
      ),
    },
    {
      id: "escalation-and-protection",
      title: "Escalation and protection",
      body: (
          <>
            <p>If you disagree with a response, request escalation in the same email thread. An unimplicated director or an appropriate independent reviewer will consider the available information. A complaint about the grievance officer must not be decided solely by that officer.</p>
            <p>We prohibit retaliation against anyone raising a concern in good faith. Our process does not prevent you from contacting a bank, payment provider, regulator, police or another competent authority. Urgent safety concerns should be reported to emergency services directly and handled under our Child Protection and Beneficiary Dignity Policy.</p>
          </>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Grievance Redressal Policy",
        summary: "Our grievance redressal policy as of 4 November 2026.",
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
