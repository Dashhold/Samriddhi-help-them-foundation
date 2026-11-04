import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Donation Refund Cancellation and Return Policy",
  body: "Our commitment to donation refund cancellation and return policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair donation refund cancellation and return policy",
}

export default function RefundCancellationPolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "scope-and-general-position",
      title: "Scope and general position",
      body: (
          <>
            <p>This policy covers donations made to Samriddhi Help Team Foundation, withdrawal of volunteer or member applications and questions about physical returns. Donations are voluntary contributions to our charitable activities and are generally non-refundable once received and verified. A change of mind does not automatically entitle a donor to a refund.</p>
            <p>This does not prevent correction of a genuine payment mistake or restrict a refund or other remedy required by law. We do not operate an online retail store through the current website.</p>
          </>
      ),
    },
    {
      id: "when-we-will-review-a-refund",
      title: "When we will review a refund",
      body: (
          <>
            <p>We review duplicate donations, an incorrect amount transferred by mistake, money sent to the Foundation in error, suspected unauthorised transactions and other payment errors. We may also review an unspent restricted donation if its agreed purpose cannot be fulfilled. An investigation does not itself guarantee approval, and any legal or banking requirements must be followed.</p>
            <p>We do not promise a refund merely because a donor expected a personal benefit, a particular beneficiary was not selected or programme outcomes differed from an estimate. Accepted written restrictions and rights under applicable law continue to apply.</p>
          </>
      ),
    },
    {
      id: "how-and-when-to-request-a-refund",
      title: "How and when to request a refund",
      body: (
          <>
            <p>Please email {contact.email} with the subject “Donation refund request”, preferably within 7 calendar days of the transaction. Include:</p>
            <ul>
              <li>The donor's name and a contact number or email.</li>
              <li>The date, amount and mode of payment.</li>
              <li>The UTR or transaction reference and the receipt number, if issued.</li>
              <li>The reason for the request and relevant evidence, with unrelated information redacted.</li>
              <li>The originating UPI ID or last four digits of the account, where needed to trace the payment.</li>
            </ul>
            <p>We may request further information reasonably needed to verify the payment and claimant. Never share an OTP, PIN, CVV or banking password. A delayed request will be assessed on its circumstances; the 7-day request period does not override statutory rights or prevent reporting suspected fraud or an unauthorised payment.</p>
          </>
      ),
    },
    {
      id: "verification-and-refund-method",
      title: "Verification and refund method",
      body: (
          <>
            <p>We check our bank records before making a decision and communicate the outcome and any reason for refusal. We can refund only funds actually received by the Foundation. Funds committed to a programme do not excuse correction of an unauthorised or erroneous payment where a refund is legally required.</p>
            <p>An approved refund will be initiated within 7 working days of approval. Working days exclude Saturdays, Sundays and bank or public holidays in Haryana. Refunds ordinarily go to the original remitting account or UPI source through an appropriate banking route. Any exception requires verified ownership and compliance with banking and legal requirements; we do not send refunds to an unrelated person or account.</p>
            <p>Your financial service may take additional time to display the credit. We provide the refund reference when available. We do not impose a Foundation refund penalty. Any unavoidable third-party deduction must be lawful, documented and explained before processing; verified duplicate or unauthorised payments will not be reduced by an arbitrary administration fee.</p>
          </>
      ),
    },
    {
      id: "failed-or-pending-transfers",
      title: "Failed or pending transfers",
      body: (
          <>
            <p>If your account is debited but a transfer is pending or failed, contact your bank or UPI provider with the transaction reference. Its reversal and dispute process applies where funds have not reached us. Check the transaction status before retrying to avoid a duplicate payment. We will assist by checking our own records.</p>
            <p>A missing acknowledgement does not necessarily mean a payment failed. Send us the reference for verification. For suspected unauthorised transactions, notify your payment provider promptly as well as contacting us.</p>
          </>
      ),
    },
    {
      id: "receipts-and-recurring-instructions",
      title: "Receipts and recurring instructions",
      body: (
          <>
            <p>After a refund, the related acknowledgement or receipt will be cancelled or corrected and any necessary tax reporting adjustment will be made. A donor must not use a cancelled receipt to claim a deduction.</p>
            <p>The current website does not offer an integrated recurring donation mandate. If you created a standing instruction in your bank or UPI app, cancel it with that provider; cancellation stops future instructions according to its process and does not automatically refund earlier contributions.</p>
          </>
      ),
    },
    {
      id: "applications-and-physical-returns",
      title: "Applications and physical returns",
      body: (
          <>
            <p>The current online volunteer or member application is free, so withdrawing it creates no fee refund. Contact us to withdraw an application or cancel participation. An associated public profile or ID verification status will be updated as appropriate; necessary private records may still be retained under our Privacy Policy.</p>
            <p>Money donations cannot be “returned” as merchandise. In-kind donations must be agreed with us in advance. Once accepted and distributed, items may no longer be recoverable. If goods are unsuitable, incorrectly delivered or require an agreed exchange, contact us before arranging collection. No beneficiary should send back assistance merely because they cannot pay a charge or participate in publicity.</p>
          </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
          <p>Email: {contact.email}. Phone: {contact.phone}. Address: {contact.address} Unresolved requests may be escalated under our Grievance Redressal Policy.</p>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Donation Refund Cancellation and Return Policy",
        summary: "Our donation refund cancellation and return policy as of 4 November 2026.",
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
