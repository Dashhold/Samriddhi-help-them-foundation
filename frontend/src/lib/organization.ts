import { defaultSiteContent } from "../cms/defaultContent"
import type { SiteContent } from "../cms/types"

export const ORGANIZATION_NAME = "Samriddhi Help Team Foundation"

/** Registration details for receipts and ID cards, read from the Documents CMS with safe defaults. */
export function organizationDetails(content: SiteContent) {
  const document = (id: string) =>
    content.documents.find((item) => item.id === id) ??
    defaultSiteContent.documents.find((item) => item.id === id)
  const reference = (id: string, prefix?: RegExp) => {
    const value = document(id)?.reference ?? ""
    return (prefix ? value.replace(prefix, "") : value).trim()
  }
  return {
    name: ORGANIZATION_NAME,
    address: content.contact.address || defaultSiteContent.contact.address,
    email: content.contact.email || defaultSiteContent.contact.email,
    phone: content.contact.phone || defaultSiteContent.contact.phone,
    cin: reference("certificate-incorporation", /^CIN\s*/i),
    licence: reference("section-8-licence", /^Licence\s*No\.?\s*/i),
    pan: reference("pan-card", /^PAN\s*/i),
    registration12ab: reference("12ab-registration", /^URN\s*/i),
    approval80g: reference("80g-approval", /^URN\s*/i),
    approval80gValidity: document("80g-approval")?.validThrough ?? "",
    csr: reference("csr-registration"),
  }
}

export type OrganizationDetails = ReturnType<typeof organizationDetails>
