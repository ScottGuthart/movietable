export type WizardStepId = "company" | "ownership" | "documents"
export type RegistrationStatus = "registered" | "invited" | "new"
export type VendorCategory = "software" | "services" | "data" | "hardware"
export type VendorCountry = "us" | "gb" | "de" | "uz" | "sg"
export type DocumentId =
  | "certificate"
  | "tax-letter"
  | "ownership-chart"
  | "bank-letter"

export interface WizardStep {
  id: WizardStepId
  step: number
  title: string
  description: string
}

export interface WizardOption<TValue extends string = string> {
  value: TValue
  label: string
  description?: string
}

export interface OwnerRecord {
  id: string
  name: string
  address: string
  share: string
}

export interface DocumentRequirement {
  id: DocumentId
  title: string
  description: string
  status: "Ready" | "Needs upload" | "Review"
}

export interface WizardValues {
  companyName: string
  registrationStatus: RegistrationStatus
  portalId: string
  category: VendorCategory
  country: VendorCountry
  contactEmail: string
  website: string
  owners: OwnerRecord[]
  taxId: string
  incorporationDate: string
  ownershipAttested: boolean
  documentIds: DocumentId[]
  submissionNotes: string
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "company",
    step: 1,
    title: "Company Details",
    description: "Vendor identity and procurement profile.",
  },
  {
    id: "ownership",
    step: 2,
    title: "Compliance",
    description: "Owners and tax IDs.",
  },
  {
    id: "documents",
    step: 3,
    title: "Submit",
    description: "Review and submit.",
  },
]

export const REGISTRATION_OPTIONS: WizardOption<RegistrationStatus>[] = [
  {
    value: "registered",
    label: "Yes",
    description: "Vendor record already exists in the portal.",
  },
  {
    value: "invited",
    label: "Invited",
    description: "Invitation sent, registration is pending.",
  },
  {
    value: "new",
    label: "No",
    description: "Create a fresh procurement record.",
  },
]

export const CATEGORY_OPTIONS: WizardOption<VendorCategory>[] = [
  {
    value: "software",
    label: "Software subscription",
    description: "SaaS, licenses, and usage-based software.",
  },
  {
    value: "services",
    label: "Professional services",
    description: "Implementation, advisory, and support work.",
  },
  {
    value: "data",
    label: "Data provider",
    description: "Market data, enrichment, and data feeds.",
  },
  {
    value: "hardware",
    label: "Hardware supplier",
    description: "Devices, equipment, and physical goods.",
  },
]

export const COUNTRY_OPTIONS: WizardOption<VendorCountry>[] = [
  {
    value: "us",
    label: "United States",
  },
  {
    value: "gb",
    label: "United Kingdom",
  },
  {
    value: "de",
    label: "Germany",
  },
  {
    value: "uz",
    label: "Uzbekistan",
  },
  {
    value: "sg",
    label: "Singapore",
  },
]

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "certificate",
    title: "Certificate of incorporation",
    description: "Legal entity proof.",
    status: "Ready",
  },
  {
    id: "tax-letter",
    title: "Tax residency letter",
    description: "Needed for payment release.",
    status: "Needs upload",
  },
  {
    id: "ownership-chart",
    title: "Ownership chart",
    description: "Confirms ownership threshold.",
    status: "Review",
  },
  {
    id: "bank-letter",
    title: "Bank verification letter",
    description: "Verifies payee details.",
    status: "Ready",
  },
]

export const DEFAULT_WIZARD_VALUES: WizardValues = {
  companyName: "ReUI Labs",
  registrationStatus: "registered",
  portalId: "VEN-2048",
  category: "software",
  country: "us",
  contactEmail: "procurement@reui.dev",
  website: "https://reui.dev",
  owners: [
    {
      id: "owner-1",
      name: "Maya Chen",
      address: "214 Mission Street, San Francisco, CA",
      share: "52%",
    },
    {
      id: "owner-2",
      name: "Kai Morgan",
      address: "18 King Street, Seattle, WA",
      share: "28%",
    },
  ],
  taxId: "US-82-4917721",
  incorporationDate: "08/08/2025",
  ownershipAttested: true,
  documentIds: ["certificate", "bank-letter"],
  submissionNotes:
    "Route final review to finance once tax residency is uploaded.",
}