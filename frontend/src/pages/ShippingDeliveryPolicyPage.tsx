import { useCms } from "../cms/CmsProvider"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import LegalPage, { type LegalSection } from "../components/LegalPage"
import { ButtonLink, Icon } from "../components/ui"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "Legal compliance",
  title: "Shipping and Delivery Policy",
  body: "Our commitment to shipping and delivery policy.",
  imageUrl: images.classroom,
  imageAlt: "Open books representing clear and fair shipping and delivery policy",
}

export default function ShippingDeliveryPolicyPage() {
  const { content } = useCms()
  const { contact } = content

  const sections: LegalSection[] = [
    {
      id: "no-retail-shipping-for-donations",
      title: "No retail shipping for donations",
      body: (
          <p>Samriddhi Help Team Foundation currently accepts charitable donations and applications through its website and does not operate an online shop. A money donation does not purchase a physical product. Consequently, retail dispatch, courier delivery charges, cash on delivery and merchandise shipping timelines do not apply to these donations.</p>
      ),
    },
    {
      id: "donation-acknowledgements-and-certificates",
      title: "Donation acknowledgements and certificates",
      body: (
          <>
            <p>We issue an acknowledgement after verifying receipt of funds and the information needed for the record. A prepared verification request or payment screenshot is not an acknowledgement. Where an acknowledgement or appreciation certificate is issued electronically, it is provided through the agreed email or other official communication channel. A tax certificate, where applicable, follows the relevant statutory process and is distinct from an appreciation certificate.</p>
            <p>No routine physical delivery of receipts, certificates or member ID cards is promised. A physical copy, if specifically agreed, will have its method, address, expected timeframe and any charge confirmed before dispatch.</p>
          </>
      ),
    },
    {
      id: "distribution-of-charitable-materials",
      title: "Distribution of charitable materials",
      body: (
          <>
            <p>Uniforms, learning materials and saplings distributed through approved activities are charitable assistance, rather than online purchases by donors. Beneficiary selection, distribution location and dates are communicated for the relevant activity and depend on available resources and local arrangements.</p>
            <p>A donation does not entitle the donor to have materials delivered to their own address or to a particular beneficiary unless the Foundation has expressly accepted that arrangement. No specific school term, wedding date, plantation site or delivery date is guaranteed by a general donation.</p>
          </>
      ),
    },
    {
      id: "in-kind-donations-and-delivery-problems",
      title: "In-kind donations and delivery problems",
      body: (
          <>
            <p>Contact us before sending uniforms, educational materials, saplings or other goods. We must agree the suitability, quantity, receiving location and transport arrangements. Do not send goods or book a collection without agreement. If agreed materials arrive damaged, are missing or are unsuitable, contact us promptly so that we can assess an appropriate remedy.</p>
            <p>If the Foundation introduces retail sales or a regular postal service, the relevant delivery and returns terms will be published before payments are accepted for that service.</p>
          </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
          <p>Email: {contact.email}. Phone: {contact.phone}. Address: {contact.address}</p>
      ),
    }
  ]

  return (
    <LegalPage
      banner={banner}
      overview={{
        eyebrow: "Legal compliance",
        title: "Shipping and Delivery Policy",
        summary: "Our shipping and delivery policy as of 4 November 2026.",
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
