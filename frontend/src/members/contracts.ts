import { withBase } from "../lib/router"

export type MemberType = "individual" | "organization"
export type MemberStatus = "pending" | "approved" | "rejected"

export type PublicMember = {
  memberCode: string
  memberType: MemberType
  name: string
  organizationName: string
  designation: string
  photoUrl: string
  city: string
  state: string
  memberSince: string
  validUntil: string
}

export type AdminMember = {
  id: string
  memberType: MemberType
  status: MemberStatus
  name: string
  organizationName: string
  email: string
  phone: string
  city: string
  state: string
  details: Record<string, string>
  photoUrl: string
  memberCode: string
  designation: string
  showOnTeam: boolean
  approvedAt: string
  validUntil: string
  adminNote: string
  createdAt: string
}

export type MemberUpdate = {
  status?: MemberStatus
  designation?: string
  showOnTeam?: boolean
  validUntil?: string
  adminNote?: string
}

type Option = readonly [string, string]
type Options = ReadonlyArray<Option>

export const joinAsOptions = [
  ["volunteer", "Volunteer"],
  ["member", "Member"],
  ["professional", "Skilled volunteer / professional"],
  ["fundraiser", "Fundraising volunteer"],
  ["other", "Other"],
] as const satisfies Options

export const availabilityOptions = [
  ["", "Not sure yet"],
  ["weekdays", "Weekdays"],
  ["weekends", "Weekends"],
  ["flexible", "Flexible"],
  ["occasional", "Occasionally / for events"],
] as const satisfies Options

export const genderOptions = [
  ["", "Prefer not to say"],
  ["female", "Female"],
  ["male", "Male"],
  ["other", "Other"],
] as const satisfies Options

export const organizationTypeOptions = [
  ["private-limited", "Private limited company"],
  ["public-limited", "Public limited company"],
  ["llp", "LLP / partnership firm"],
  ["proprietorship", "Proprietorship"],
  ["trust-society", "Trust / society / NGO"],
  ["educational", "Educational institution"],
  ["government", "Government body / PSU"],
  ["other", "Other"],
] as const satisfies Options

export const collaborationOptions = [
  ["csr", "CSR partnership"],
  ["sponsorship", "Event or programme sponsorship"],
  ["volunteering", "Employee volunteering"],
  ["in-kind", "In-kind support"],
  ["other", "Other collaboration"],
] as const satisfies Options

export function optionLabel(options: Options, value: string) {
  return options.find(([key]) => key === value)?.[1] ?? value
}

type DetailField = {
  key: string
  label: string
  options?: Options
}

export const memberDetailFields: Record<MemberType, DetailField[]> = {
  individual: [
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "gender", label: "Gender", options: genderOptions },
    { key: "occupation", label: "Occupation" },
    { key: "address", label: "Address" },
    { key: "pincode", label: "PIN code" },
    { key: "joinAs", label: "Wants to join as", options: joinAsOptions },
    {
      key: "availability",
      label: "Availability",
      options: availabilityOptions,
    },
    { key: "skills", label: "Skills & interests" },
    { key: "motivation", label: "Why they want to join" },
  ],
  organization: [
    {
      key: "organizationType",
      label: "Organisation type",
      options: organizationTypeOptions,
    },
    { key: "registrationNumber", label: "Registration no. / CIN" },
    { key: "gstin", label: "GSTIN" },
    { key: "pan", label: "PAN" },
    { key: "website", label: "Website" },
    { key: "contactDesignation", label: "Contact person's designation" },
    { key: "address", label: "Registered address" },
    { key: "pincode", label: "PIN code" },
    {
      key: "collaboration",
      label: "Type of collaboration",
      options: collaborationOptions,
    },
    { key: "about", label: "About the organisation / proposal" },
  ],
}

export function memberDisplayName(member: {
  memberType: MemberType
  name: string
  organizationName: string
}) {
  return member.memberType === "organization" && member.organizationName
    ? member.organizationName
    : member.name
}

export function idCardPath(code: string) {
  return `/team/${encodeURIComponent(code)}`
}

export function idCardUrl(code: string) {
  return `${window.location.origin}${withBase(idCardPath(code))}`
}

export function toPublicMember(member: AdminMember): PublicMember {
  return {
    memberCode: member.memberCode,
    memberType: member.memberType,
    name: member.name,
    organizationName: member.organizationName,
    designation: member.designation,
    photoUrl: member.photoUrl,
    city: member.city,
    state: member.state,
    memberSince: member.approvedAt,
    validUntil: member.validUntil,
  }
}
