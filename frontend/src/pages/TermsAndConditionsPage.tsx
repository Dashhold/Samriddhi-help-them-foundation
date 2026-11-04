import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Website terms",
  title: "Terms & Conditions",
  body: "The ground rules for using this website, donating to the Foundation and applying to join us.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair terms",
}

export default function TermsAndConditionsPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "about-the-foundation",
      title: "About the Foundation",
      body: (
          <>
            <p>This website is operated by Samriddhi Help Team Foundation, a Section 8 company incorporated under the Companies Act, 2013, with CIN U88900HR2025NPL137636 and its registered office at {contact.address}. In these terms, “Foundation”, “we”, “us” and “our” refer to Samriddhi Help Team Foundation.</p>
            <p>By using our website or submitting an application or donation request, you agree to these terms. Please also read our <AppLink to="/privacy-policy">Privacy Policy</AppLink>, <AppLink to="/refund-cancellation-policy">Donation Refund Cancellation and Return Policy</AppLink>, and <AppLink to="/donation-acceptance-policy">Donation Acceptance and Fund Utilisation Policy</AppLink>. A privacy notice does not replace any separate consent needed for optional communications or publication of personal information.</p>
          </>
      ),
    },
    {
      id: "our-charitable-activities",
      title: "Our charitable activities",
      body: (
          <>
            <p>Our programmes support marriage assistance for women from financially vulnerable families, tree plantation and environmental awareness, and educational assistance for children, including school uniforms and essential learning materials. Activities depend on verified needs, available resources and programme capacity.</p>
            <p>Submitting a request does not guarantee selection, a particular amount of assistance or a fixed completion date. We assess requests fairly against the relevant programme requirements. Assistance is not conditional on making a donation, joining the Foundation or agreeing to publicity.</p>
          </>
      ),
    },
    {
      id: "eligibility-and-accurate-information",
      title: "Eligibility and accurate information",
      body: (
          <>
            <p>Donation and membership facilities are intended for adults aged 18 or above and authorised organisation representatives. A parent or legal guardian should contact us before submitting information about a child. You must provide accurate information and share another person's details, photograph or documents only with appropriate authority.</p>
            <p>We may request information reasonably needed to verify identity, age, need or a transaction. Do not send unnecessary identity documents or payment credentials.</p>
          </>
      ),
    },
    {
      id: "marriage-assistance",
      title: "Marriage assistance",
      body: (
          <>
            <p>Marriage assistance is available only for lawful, freely chosen marriages. We require the woman to be at least 18 and the man to be at least 21, and any further legal requirements applicable to the marriage must be satisfied. Both parties must give free and informed consent. Reliable evidence of age and eligibility may be requested.</p>
            <p>We do not support child marriage, forced marriage, dowry demands or payments made as a condition of marriage. Any assistance must be voluntary, lawful and consistent with the Foundation's charitable objects. We may suspend assistance and report concerns where required by law or necessary to protect someone at risk.</p>
          </>
      ),
    },
    {
      id: "donations-and-acknowledgements",
      title: "Donations and acknowledgements",
      body: (
          <>
            <p>Donations are voluntary charitable contributions. They do not purchase goods, create an investment, earn interest or guarantee a personal benefit. Use only the donation details published on our official <AppLink to="/donate">Donate page</AppLink> and verify the payee before authorising payment.</p>
            <p>Our current donation process uses bank or UPI transfers through your own banking service. The website does not currently process payments through an integrated payment gateway. A submitted verification form, payment screenshot or prepared email is not confirmation that the Foundation has received funds. We issue an acknowledgement after verifying the credit in our records.</p>
            <p>Tax benefits, if available, depend on the applicable law, our valid approval for the relevant period and the donor's eligibility. A donation receipt or appreciation certificate alone does not guarantee a tax deduction. Refunds are handled under our <AppLink to="/refund-cancellation-policy">Donation Refund Cancellation and Return Policy</AppLink>.</p>
          </>
      ),
    },
    {
      id: "volunteers-and-members",
      title: "Volunteers and members",
      body: (
          <>
            <p>Applications are reviewed before approval. The current online application does not collect a membership fee. Website volunteer or supporter enrolment does not, by itself, confer statutory company membership, a directorship, employment, remuneration or authority to bind the Foundation.</p>
            <p>An approved ID card is personal, non-transferable and valid only while the related status remains approved and unexpired. It does not authorise fundraising, signing agreements, making promises or collecting money for the Foundation without separate written authorisation. We may withdraw an ID or participation for misrepresentation, safeguarding concerns or misuse, and provide a reasonable opportunity for review where appropriate.</p>
          </>
      ),
    },
    {
      id: "responsible-use-and-content",
      title: "Responsible use and content",
      body: (
          <>
            <p>Do not impersonate others, submit false documents, misuse our name or logo, publish beneficiaries' private information, interfere with website security or use our forms for abusive or unlawful material. Sharing an official link is welcome; copying or commercially using our protected content requires permission unless the law permits it. Third-party photographs, fonts and other material remain subject to their respective licences.</p>
            <p>If you submit content for publication, you must have the necessary rights and permissions. Any permission to use personal stories or images is limited to the agreed purpose and does not transfer ownership to us. Requests to stop future optional use are handled under our <AppLink to="/privacy-policy">Privacy Policy</AppLink>.</p>
          </>
      ),
    },
    {
      id: "availability-and-responsibility",
      title: "Availability and responsibility",
      body: (
          <p>We take reasonable care over website information but cannot guarantee uninterrupted access or that every update will be immediate. External websites, banking apps and messaging services have their own terms. We remain responsible for obligations the law places on us. Nothing in these terms excludes responsibility for fraud, wilful misconduct, negligence or another liability that cannot lawfully be excluded.</p>
      ),
    },
    {
      id: "changes-and-disputes",
      title: "Changes and disputes",
      body: (
          <>
            <p>Material policy changes will be published with an updated date. Changes apply prospectively and do not retrospectively remove rights relating to earlier donations or accepted restrictions. A material change to the purpose of personal data use requires any additional notice or consent required by law.</p>
            <p>Indian law governs these terms. Subject to mandatory legal rights and the jurisdiction of competent statutory forums, disputes may be brought before the competent courts at Hisar, Haryana. Contacting us first can help resolve a concern but does not prevent you from exercising a legal remedy.</p>
          </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
        <div className="policy-contact">
          <h3>Questions about these terms?</h3>
          <p>Write to us and we will do our best to help.</p>
          <p>
            Email: {contact.email}
            <br />
            Phone: {contact.phone}
            <br />
            Address: {contact.address}
          </p>
          <div className="policy-contact__actions">
            <a
              className="button button--primary"
              href={`mailto:${contact.email}?subject=${encodeURIComponent(
                "Question about the Terms & Conditions",
              )}`}
            >
              Email us <Icon name="mail" size={17} />
            </a>
            <ButtonLink to="/privacy-policy" kind="light">
              Privacy Policy
            </ButtonLink>
          </div>
        </div>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Plain and fair",
        title: "Clear terms for visitors, donors and members",
        summary:
          "These terms explain how you may use this website, what to expect when you donate or apply to join, and what the Foundation is and is not responsible for. We have kept them short and in plain language.",
        scope:
          "These terms apply to this website, its forms and the services described on it.",
        updated: { dateTime: "2026-11-04", label: "4 November 2026" },
      }}
      glance={{
        label: "Key points",
        title: "Terms at a glance",
        text: "The main points in brief. The full terms follow below.",
        facts: [
          ["Donations", "Voluntary, in INR, by bank or UPI transfer"],
          ["Refunds", "Covered by the Refund / Cancellation Policy"],
          ["Membership", "Subject to review and approval"],
          ["Governing law", "India, with courts at Hisar, Haryana"],
          ["Contact", contact.email],
        ],
        link: {
          to: "/refund-cancellation-policy",
          label: "Refund / Cancellation Policy",
        },
      }}
      sections={sections}
    />
  )
}

