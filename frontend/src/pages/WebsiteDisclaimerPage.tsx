import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Website Disclaimer",
  body: "Our commitment to website disclaimer.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair website disclaimer",
}

export default function WebsiteDisclaimerPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [

  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Website Disclaimer",
        summary: "Our website disclaimer as of 4 November 2026.",
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
