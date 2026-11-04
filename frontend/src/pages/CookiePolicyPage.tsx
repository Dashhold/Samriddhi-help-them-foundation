import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Cookie and Browser Storage Policy",
  body: "Our commitment to cookie and browser storage policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair cookie and browser storage policy",
}

export default function CookiePolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "current-website-arrangements",
      title: "Current website arrangements",
      body: (
          <p>Cookies and browser storage are small pieces of information stored by a browser. Samriddhi Help Team Foundation uses limited browser storage to support website functions. The current website is not configured with Google Analytics or advertising tracking scripts.</p>
      ),
    },
    {
      id: "language-preference",
      title: "Language preference",
      body: (
          <p>The About page stores your selected biography language in local storage on your device so the choice can be remembered. The relevant key is “samriddhi-leadership-language”. It remains until changed or cleared through your browser. It does not by itself identify you to the Foundation.</p>
      ),
    },
    {
      id: "administrator-sessions",
      title: "Administrator sessions",
      body: (
          <p>Authorised administrator sessions use browser session storage for temporary access information. This is restricted administrative functionality and is not a visitor marketing profile. Session information is cleared on logout or expiry as implemented by the service; browser session storage is ordinarily cleared when the relevant browsing session ends.</p>
      ),
    },
    {
      id: "hosting-and-external-resources",
      title: "Hosting and external resources",
      body: (
          <p>Hosting and security providers may process technical request information to deliver and protect the site. Pages load resources such as Google Fonts and Unsplash images, whose providers may receive your IP address, browser information and the requested resource. External email, WhatsApp, banking and UPI services have their own storage and privacy practices when you use them.</p>
      ),
    },
    {
      id: "your-choices",
      title: "Your choices",
      body: (
          <>
            <p>You can clear cookies and local or session storage using your browser settings. Clearing a language preference may reset the selection; clearing administrator session information may sign an administrator out. If optional analytics or advertising technologies are introduced, we will update this policy and provide the controls required before their use. Continuing to browse is not treated as blanket consent to optional tracking.</p>
            <p>For questions, email {contact.email} or call {contact.phone}. Read our Privacy Policy for information on personal data requests.</p>
          </>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Cookie and Browser Storage Policy",
        summary: "Our cookie and browser storage policy as of 4 November 2026.",
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
