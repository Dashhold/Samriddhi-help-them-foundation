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
      id: "acceptance",
      title: "Acceptance of these terms",
      body: (
        <p>
          By using this website, sending a form, requesting donation
          verification or applying to join, you agree to these Terms &amp;
          Conditions and to our{" "}
          <AppLink to="/privacy-policy">Privacy Policy</AppLink>. If you do not
          agree, please do not use the website.
        </p>
      ),
    },
    {
      id: "foundation",
      title: "About the Foundation",
      body: (
        <>
          <p>
            This website is run by Samriddhi Help Team Foundation (“the
            Foundation”), a Section 8 company based in Hisar, Haryana. Our
            registered office is {contact.address}.
          </p>
          <p>
            Our incorporation, registration and governance records are
            published on the <AppLink to="/documents">Documents page</AppLink>.
          </p>
        </>
      ),
    },
    {
      id: "use",
      title: "Using this website",
      body: (
        <>
          <p>
            You may use this website for lawful purposes only. Its application
            and donation features are for adults and authorised organisation
            representatives. If you are under 18, a parent or legal guardian
            should contact us before any personal information is submitted.
          </p>
          <p>When you use a form on this website, you agree to:</p>
          <ul>
            <li>give information that is accurate and complete, and keep it up to date;</li>
            <li>use only your own details, or details you have permission to share; and</li>
            <li>act for a company or organisation only if you are authorised to do so.</li>
          </ul>
        </>
      ),
    },
    {
      id: "donations",
      title: "Donations",
      body: (
        <>
          <p>
            Donations are voluntary and are accepted in Indian rupees (INR). To
            donate, transfer money by bank or UPI to the verified details on
            the <AppLink to="/donate">Donate page</AppLink>. The transfer
            happens in your own bank or UPI app, not inside this website, and
            the website does not currently use a payment gateway.
          </p>
          <p>
            After you pay, you can prepare a verification request on the Donate
            page and send it to us by email or WhatsApp. That request is not a
            receipt. We check that the money has been credited before we issue
            an acknowledgement or, where eligible, a receipt.
          </p>
          <p>
            Before you pay, check that the payee name matches the one shown on
            the Donate page. We never ask for your UPI PIN, OTP, card PIN or
            banking password.
          </p>
          <p>
            Donations are generally non-refundable. Duplicate or mistaken
            payments and failed transfers are handled under our{" "}
            <AppLink to="/refund-cancellation-policy">
              Refund / Cancellation Policy
            </AppLink>
            .
          </p>
        </>
      ),
    },
    {
      id: "membership",
      title: "Membership, volunteers and partners",
      body: (
        <>
          <p>
            You can apply on the <AppLink to="/join">Join us page</AppLink> as
            an individual or as a company or organisation. Our team reviews
            every application, and applying does not guarantee approval. We may
            ask for more information or decline an application. The
            application form does not take any payment.
          </p>
          <p>
            Approved members receive a member ID and an ID card with a QR code.
            They may appear on the team page with their name or organisation
            name, photo or logo, role and city, as agreed when they apply.
          </p>
          <p>
            You can ask to withdraw an application or cancel a membership at
            any time. The{" "}
            <AppLink to="/refund-cancellation-policy">
              Refund / Cancellation Policy
            </AppLink>{" "}
            explains how.
          </p>
          <p>These rules apply to membership and ID cards:</p>
          <ul>
            <li>An ID card belongs to the person or organisation named on it. It may not be shared, lent or transferred.</li>
            <li>Each card shows a valid-until date, and it is valid only while the membership remains approved.</li>
            <li>Membership does not authorise anyone to speak, sign or collect money for the Foundation unless we have said so in writing.</li>
            <li>We may reject an application, or cancel a membership and withdraw its ID card, if information is inaccurate or if the card or the Foundation's name is misused or misrepresented.</li>
          </ul>
        </>
      ),
    },
    {
      id: "conduct",
      title: "What you must not do",
      body: (
        <>
          <p>When using this website, you must not:</p>
          <ul>
            <li>break any law, or help someone else to break it;</li>
            <li>give false or misleading information, or pretend to be another person or organisation;</li>
            <li>submit photographs, logos or other material that you do not have the right to use;</li>
            <li>use the Foundation's name, logo or ID cards to ask for money or support without our written permission;</li>
            <li>try to gain unauthorised access to the administrator area, the database or other people's information;</li>
            <li>disrupt the website, for example with malware, excessive automated requests or other harmful tools; or</li>
            <li>send abusive, threatening or unlawful content through our forms.</li>
          </ul>
          <div className="policy-note">
            <strong>If these rules are broken:</strong> we may refuse or remove
            submissions, restrict access, and report serious misuse to the
            authorities.
          </div>
        </>
      ),
    },
    {
      id: "intellectual-property",
      title: "Content and intellectual property",
      body: (
        <>
          <p>
            The text, design, logo and other material on this website belong to
            the Foundation or are used with permission. You may view the
            website and share links to it for personal, non-commercial use.
            Apart from what the law allows, you may not copy, change,
            republish or use our name or logo without our written permission.
          </p>
          <p>
            Some photographs and fonts on the website are supplied by third
            parties, such as Unsplash and Google Fonts, under their own
            licences.
          </p>
          <p>
            If you give us a photograph, logo or other material for display,
            you confirm that you have the right to share it and you allow us to
            display it as agreed with you. You can ask us to remove it.
          </p>
        </>
      ),
    },
    {
      id: "third-parties",
      title: "Third-party links and services",
      body: (
        <p>
          This website links to, and works with, services that we do not
          control, such as email, WhatsApp, banks and UPI apps, Google Fonts
          and Unsplash. They have their own terms and privacy practices, and we
          are not responsible for their content or conduct.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Disclaimer and limitation of liability",
      body: (
        <>
          <p>
            We take care to keep the information on this website accurate and
            up to date, but we do not promise that it is complete, that the
            website will always be available, or that it will be free from
            errors. The information is general and is not legal, tax or
            financial advice. Please speak to your own adviser, for example
            about the tax treatment of a donation.
          </p>
          <p>
            To the extent the law allows, the Foundation is not liable for any
            loss or damage arising from your use of this website, from
            interruptions or errors, from third-party services, or from
            payments sent to an account or UPI ID other than the verified
            details on the Donate page. Nothing in these terms limits any right
            or liability that cannot be limited by law.
          </p>
        </>
      ),
    },
    {
      id: "privacy",
      title: "Privacy",
      body: (
        <p>
          How we collect, use and protect personal information is explained in
          our <AppLink to="/privacy-policy">Privacy Policy</AppLink>. Please
          read it before you submit a form, request donation verification or
          apply to join.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms and the website",
      body: (
        <>
          <p>
            We may update these terms, for example when the features of the
            website or the law change. The date at the top shows when they were
            last updated. If you keep using the website after an update, you
            accept the updated terms.
          </p>
          <p>
            We may also change, pause or withdraw any part of the website at
            any time.
          </p>
        </>
      ),
    },
    {
      id: "governing-law",
      title: "Governing law and disputes",
      body: (
        <p>
          These terms are governed by the laws of India, and any dispute is
          subject to the jurisdiction of the courts at Hisar, Haryana. If you
          have a concern, please contact us first so that we can try to resolve
          it.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact us",
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
    },
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
        updated: { dateTime: "2026-10", label: "October 2026" },
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
