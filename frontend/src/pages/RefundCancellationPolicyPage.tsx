import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

// Default timelines used in the policy text. Change them here and every mention follows.
const REQUEST_WINDOW = "7 days"
const PROCESSING_TIME = "7 working days"

const banner: PageBanner = {
  eyebrow: "Donations & membership",
  title: "Refund / Cancellation Policy",
  body: "When a donation can be refunded, how to ask for a refund, and how to cancel a membership application.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing a clear and fair refund process",
}

export default function RefundCancellationPolicyPage() {
  const { content } = useCms()
  const { contact } = content
  const requestHref = `mailto:${contact.email}?subject=${encodeURIComponent(
    "Refund request",
  )}&body=${encodeURIComponent(
    [
      "Donor name:",
      "Transaction ID / UTR:",
      "Payment date:",
      "Amount (INR):",
      "UPI ID or last 4 digits of the bank account paid from:",
      "What went wrong:",
    ].join("\n"),
  )}`

  const sections: LegalSection[] = [
    {
      id: "donations",
      title: "Donations are voluntary",
      body: (
        <>
          <p>
            Every donation to Samriddhi Help Team Foundation is a voluntary
            gift made to support its charitable work. Once a donation has been
            received and verified, it is generally non-refundable. Changing
            your mind later is not a reason for a refund.
          </p>
          <p>
            We do want to put right genuine mistakes. The sections below
            explain which cases we will look at and how to ask.
          </p>
        </>
      ),
    },
    {
      id: "how-donations-work",
      title: "How donations are made",
      body: (
        <>
          <p>
            Donations are made by bank or UPI transfer to the verified details
            on the <AppLink to="/donate">Donate page</AppLink>. The transfer
            happens in your own bank or UPI app, not inside this website, and
            the website does not currently use a payment gateway.
          </p>
          <p>
            Because of this, an approved refund is sent back by the Foundation
            to the same account or UPI ID that the money came from.
          </p>
        </>
      ),
    },
    {
      id: "eligible",
      title: "When we will refund a donation",
      body: (
        <>
          <p>We will consider a refund request in these cases:</p>
          <ul>
            <li>
              <strong>Duplicate payment:</strong> the same donation was paid
              more than once by mistake.
            </li>
            <li>
              <strong>Payment made in error:</strong> a wrong amount was
              transferred (for example, an extra zero), or the money was sent
              to the Foundation by mistake.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "failed-transfers",
      title: "Failed or pending transfers",
      body: (
        <>
          <p>
            If a transfer fails or stays pending, the money is normally
            returned to your account automatically by your bank or UPI app,
            within the time your bank allows. The Foundation can only refund
            money that it has actually received.
          </p>
          <p>
            Please check your account statement before trying again, so that
            you do not pay twice. If the money has left your account and has
            not come back within your bank's stated time, contact your bank
            first and quote the transaction ID. You can also write to us with
            the details, and we will check our records.
          </p>
          <p>
            If the money did reach the Foundation but you have not received an
            acknowledgement, that is not a refund case. Send a verification
            request from the <AppLink to="/donate">Donate page</AppLink> and we
            will verify the payment.
          </p>
        </>
      ),
    },
    {
      id: "how-to-ask",
      title: "How to ask for a refund",
      body: (
        <>
          <p>
            Email us at <a href={`mailto:${contact.email}`}>{contact.email}</a>{" "}
            or call{" "}
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              {contact.phone}
            </a>
            . Writing by email helps us keep a record of your request. Please
            include:
          </p>
          <ul>
            <li>your name and contact details;</li>
            <li>the transaction ID or UTR reference;</li>
            <li>the date and amount of the payment, in INR;</li>
            <li>
              the UPI ID, or the last four digits of the bank account, that
              the payment was made from; and
            </li>
            <li>
              a short description of what went wrong, such as a duplicate
              payment or a wrong amount.
            </li>
          </ul>
          <div className="policy-note">
            <strong>Keep your details safe:</strong> never send your UPI PIN,
            OTP, card PIN or banking password. We will never ask for them.
          </div>
        </>
      ),
    },
    {
      id: "time-limit",
      title: "Time limit for requests",
      body: (
        <p>
          Please send your refund request within {REQUEST_WINDOW} of the date
          of the transaction. Requests received after that are normally not
          accepted, so write to us as soon as you notice a problem.
        </p>
      ),
    },
    {
      id: "processing",
      title: "Checking and processing a refund",
      body: (
        <>
          <p>
            We check each request against our bank records and the details you
            give us. We may ask for more information, such as a bank statement
            showing the payment. If we cannot approve a request, we will tell
            you why.
          </p>
          <p>
            If a refund is approved, we process it within {PROCESSING_TIME} of
            approval. It goes back to the original payment method: the same
            bank account or UPI ID that the payment came from. We do not
            refund in cash or to a different account.
          </p>
          <p>
            Your bank or UPI app may take additional time to show the credit,
            and any charges your bank applies are outside our control. If we
            have already issued an acknowledgement or receipt for a donation
            that is refunded, we will cancel it.
          </p>
        </>
      ),
    },
    {
      id: "membership",
      title: "Cancelling a membership application",
      body: (
        <>
          <p>
            Applying on the <AppLink to="/join">Join us page</AppLink> does
            not involve any payment, so there is nothing to refund. Our team
            reviews every application before anyone is added to the team page.
          </p>
          <p>
            You can ask us at any time to withdraw an application that is
            still under review, or to cancel an approved membership. On
            request, we will remove your public team profile, and your ID card
            will no longer verify as valid. Cancelling a membership does not
            affect donations already made, which are covered by the sections
            above.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: "Contact and updates",
      body: (
        <>
          <div className="policy-contact">
            <h3>Contact the Foundation about a refund</h3>
            <p>
              Please include the details listed above so that we can find your
              payment quickly.
            </p>
            <p>
              Email: {contact.email}
              <br />
              Phone: {contact.phone}
              <br />
              Address: {contact.address}
            </p>
            <div className="policy-contact__actions">
              <a className="button button--primary" href={requestHref}>
                Email a refund request <Icon name="mail" size={17} />
              </a>
              <ButtonLink to="/donate" kind="light">
                Donate page
              </ButtonLink>
            </div>
          </div>
          <h3>Updates to this policy</h3>
          <p>
            We may update this policy when the way we accept donations changes,
            for example if a payment gateway is introduced, or when the law
            requires. The date at the top shows when it was last updated.
          </p>
          <p>
            Please read this policy together with our{" "}
            <AppLink to="/terms-and-conditions">Terms &amp; Conditions</AppLink>{" "}
            and <AppLink to="/privacy-policy">Privacy Policy</AppLink>.
          </p>
        </>
      ),
    },
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "A fair process",
        title: "Donations are voluntary. Genuine mistakes can still be put right.",
        summary:
          "Donations to Samriddhi Help Team Foundation are voluntary gifts and are generally non-refundable. If you paid twice, paid the wrong amount or had a payment problem, tell us and we will look into it.",
        scope:
          "This policy covers donations made using the details on the Donate page, and applications made on the Join us page.",
        updated: { dateTime: "2026-10", label: "October 2026" },
      }}
      glance={{
        label: "At a glance",
        title: "Refund requests",
        text: "What to expect if you need to ask for a refund.",
        facts: [
          ["Request window", `Within ${REQUEST_WINDOW} of the transaction`],
          ["Processing time", `Within ${PROCESSING_TIME} of approval`],
          ["Refunded to", "The original payment method"],
          ["Write to us", contact.email],
        ],
        link: { to: "/terms-and-conditions", label: "Terms & Conditions" },
      }}
      sections={sections}
    />
  )
}
