import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  DOCUMENT_REQUIREMENTS,
  REGISTRATION_OPTIONS,
  type DocumentId,
  type OwnerRecord,
  type VendorCategory,
  type VendorCountry,
  type WizardOption,
  type WizardValues,
} from "./data"
import { IconInfoCircle, IconTrash, IconPlus } from "@tabler/icons-react"

export type WizardErrors = Partial<Record<keyof WizardValues, string>>

type WizardValueChange = (
  field: keyof WizardValues,
  value: WizardValues[keyof WizardValues]
) => void

interface WizardSummary {
  categoryLabel: string
  countryLabel: string
  registrationLabel: string
}

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function FieldLabelHint({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor?: string
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div className="flex w-fit items-center gap-1.5 leading-snug">
      <FieldLabel htmlFor={htmlFor}>{children}</FieldLabel>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label={`${label} hint`}
            />
          }
        >
          <IconInfoCircle className="size-3.5" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56 text-xs text-balance">
          {hint}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function WizardSelectField<TValue extends string>({
  id,
  value,
  options,
  placeholder,
  onValueChange,
}: {
  id: string
  value: TValue
  options: WizardOption<TValue>[]
  placeholder: string
  onValueChange: (value: TValue) => void
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? null

  return (
    <Select
      value={selectedOption}
      items={options}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue.value)
        }
      }}
    >
      <SelectTrigger id={id} className="w-full [&_small]:hidden">
        <SelectValue>
          {(item: WizardOption<TValue> | null) => item?.label ?? placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option}>
              {option.description ? (
                <span className="flex min-w-0 flex-col items-start gap-px">
                  <span className="truncate font-medium">{option.label}</span>
                  <small className="text-muted-foreground truncate text-xs">
                    {option.description}
                  </small>
                </span>
              ) : (
                option.label
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0 text-right font-medium break-words">
        {value}
      </dd>
    </div>
  )
}

function SummarySection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={[
        "border-border/70 flex min-w-0 flex-col gap-3 rounded-md border p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function RemoveRowButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive justify-self-start sm:justify-self-end"
      aria-label={label}
      onClick={onClick}
    >
      <IconTrash className="size-4" aria-hidden="true" />
    </Button>
  )
}

function OwnerRows({
  owners,
  error,
  onOwnerChange,
  onAddOwner,
  onRemoveOwner,
}: {
  owners: OwnerRecord[]
  error?: string
  onOwnerChange: (id: string, field: keyof OwnerRecord, value: string) => void
  onAddOwner: () => void
  onRemoveOwner: (id: string) => void
}) {
  return (
    <Field data-invalid={Boolean(error)} className="gap-3 sm:col-span-2">
      <div className="flex flex-col gap-2">
        {owners.map((owner, index) => (
          <div
            key={owner.id}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_5rem_auto]"
          >
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`${owner.id}-name`} className="sr-only">
                Owner {index + 1} name
              </FieldLabel>
              <Input
                id={`${owner.id}-name`}
                value={owner.name}
                onChange={(event) =>
                  onOwnerChange(owner.id, "name", event.target.value)
                }
                placeholder="Owner full name"
                autoComplete="name"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`${owner.id}-address`} className="sr-only">
                Owner {index + 1} address
              </FieldLabel>
              <Input
                id={`${owner.id}-address`}
                value={owner.address}
                onChange={(event) =>
                  onOwnerChange(owner.id, "address", event.target.value)
                }
                placeholder="Registered address"
                autoComplete="street-address"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`${owner.id}-share`} className="sr-only">
                Owner {index + 1} share
              </FieldLabel>
              <Input
                id={`${owner.id}-share`}
                value={owner.share}
                onChange={(event) =>
                  onOwnerChange(owner.id, "share", event.target.value)
                }
                placeholder="Share"
                inputMode="numeric"
              />
            </Field>
            <RemoveRowButton
              label={`Remove owner ${index + 1}`}
              onClick={() => onRemoveOwner(owner.id)}
            />
          </div>
        ))}
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-auto"
          onClick={onAddOwner}
        >
          <IconPlus data-icon="inline-start" aria-hidden="true" />
          Add owner
        </Button>
      </div>
    </Field>
  )
}

function AttestationCheckbox({
  id,
  checked,
  label,
  description,
  error,
  onCheckedChange,
}: {
  id: string
  checked: boolean
  label: string
  description: string
  error?: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field
      data-invalid={Boolean(error)}
      orientation="horizontal"
      className="gap-3"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
        aria-invalid={Boolean(error)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

export function CompanyStepFields({
  values,
  errors,
  summary,
  onValueChange,
}: {
  values: WizardValues
  errors: WizardErrors
  summary: WizardSummary
  onValueChange: WizardValueChange
}) {
  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="wizard-2-company-title"
    >
      <SectionHeading
        id="wizard-2-company-title"
        title="Company Details"
        description="Identify the vendor record before compliance review."
      />

      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.companyName)} className="gap-2">
          <FieldLabelHint
            htmlFor="wizard-2-company"
            label="Legal Company Name"
            hint="Match the registered legal entity name."
          >
            Legal Company Name <RequiredMark />
          </FieldLabelHint>
          <Input
            id="wizard-2-company"
            value={values.companyName}
            onChange={(event) =>
              onValueChange("companyName", event.target.value)
            }
            aria-invalid={Boolean(errors.companyName)}
            autoComplete="organization"
          />
          {errors.companyName ? (
            <FieldError>{errors.companyName}</FieldError>
          ) : null}
        </Field>

        <Field className="gap-2">
          <FieldLabelHint
            htmlFor="wizard-2-registration"
            label="Portal Registration"
            hint="Use the status from the vendor portal."
          >
            Portal Registration
          </FieldLabelHint>
          <WizardSelectField
            id="wizard-2-registration"
            value={values.registrationStatus}
            options={REGISTRATION_OPTIONS}
            placeholder="Select status"
            onValueChange={(value) =>
              onValueChange("registrationStatus", value)
            }
          />
          <FieldDescription>{summary.registrationLabel}</FieldDescription>
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="wizard-2-category">Category</FieldLabel>
          <WizardSelectField<VendorCategory>
            id="wizard-2-category"
            value={values.category}
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
            onValueChange={(value) => onValueChange("category", value)}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="wizard-2-country">Country</FieldLabel>
          <WizardSelectField<VendorCountry>
            id="wizard-2-country"
            value={values.country}
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            onValueChange={(value) => onValueChange("country", value)}
          />
        </Field>

        <Field data-invalid={Boolean(errors.contactEmail)} className="gap-2">
          <FieldLabel htmlFor="wizard-2-email">
            Vendor Email <RequiredMark />
          </FieldLabel>
          <Input
            id="wizard-2-email"
            value={values.contactEmail}
            onChange={(event) =>
              onValueChange("contactEmail", event.target.value)
            }
            aria-invalid={Boolean(errors.contactEmail)}
            type="email"
            autoComplete="email"
          />
          {errors.contactEmail ? (
            <FieldError>{errors.contactEmail}</FieldError>
          ) : null}
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="wizard-2-website">Website</FieldLabel>
          <Input
            id="wizard-2-website"
            value={values.website}
            onChange={(event) => onValueChange("website", event.target.value)}
            autoComplete="url"
          />
        </Field>
      </FieldGroup>
    </section>
  )
}

export function OwnershipStepFields({
  values,
  errors,
  onValueChange,
  onOwnerChange,
  onAddOwner,
  onRemoveOwner,
}: {
  values: WizardValues
  errors: WizardErrors
  onValueChange: WizardValueChange
  onOwnerChange: (id: string, field: keyof OwnerRecord, value: string) => void
  onRemoveOwner: (id: string) => void
  onAddOwner: () => void
}) {
  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="wizard-2-ownership-title"
    >
      <SectionHeading
        id="wizard-2-ownership-title"
        title="Compliance"
        description="Confirm ownership and tax records."
      />

      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <OwnerRows
          owners={values.owners}
          error={errors.owners}
          onOwnerChange={onOwnerChange}
          onAddOwner={onAddOwner}
          onRemoveOwner={onRemoveOwner}
        />

        <Field data-invalid={Boolean(errors.taxId)} className="gap-2">
          <FieldLabelHint
            htmlFor="wizard-2-tax"
            label="Tax/VAT ID"
            hint="Enter the identifier finance will validate."
          >
            Tax/VAT ID <RequiredMark />
          </FieldLabelHint>
          <Input
            id="wizard-2-tax"
            value={values.taxId}
            onChange={(event) => onValueChange("taxId", event.target.value)}
            aria-invalid={Boolean(errors.taxId)}
            placeholder="Enter tax number"
          />
          {errors.taxId ? <FieldError>{errors.taxId}</FieldError> : null}
        </Field>

        <Field
          data-invalid={Boolean(errors.incorporationDate)}
          className="gap-2"
        >
          <FieldLabelHint
            htmlFor="wizard-2-incorporated"
            label="Date Incorporated"
            hint="Use the date from the registration record."
          >
            Date Incorporated <RequiredMark />
          </FieldLabelHint>
          <Input
            id="wizard-2-incorporated"
            value={values.incorporationDate}
            onChange={(event) =>
              onValueChange("incorporationDate", event.target.value)
            }
            aria-invalid={Boolean(errors.incorporationDate)}
            placeholder="MM/DD/YYYY"
          />
          {errors.incorporationDate ? (
            <FieldError>{errors.incorporationDate}</FieldError>
          ) : null}
        </Field>

        <AttestationCheckbox
          id="wizard-2-ownership-attested"
          checked={values.ownershipAttested}
          label="Ownership reviewed"
          description="Records match company documents."
          error={errors.ownershipAttested}
          onCheckedChange={(checked) =>
            onValueChange("ownershipAttested", checked)
          }
        />
      </FieldGroup>
    </section>
  )
}

export function DocumentsStepFields({
  values,
  errors,
  summary,
  onValueChange,
  onDocumentToggle,
}: {
  values: WizardValues
  errors: WizardErrors
  summary: WizardSummary
  onValueChange: WizardValueChange
  onDocumentToggle: (documentId: DocumentId, checked: boolean) => void
}) {
  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="wizard-2-documents-title"
    >
      <SectionHeading
        id="wizard-2-documents-title"
        title="Submit"
        description="Review files and confirm."
      />

      <FieldGroup className="grid gap-6">
        <Field data-invalid={Boolean(errors.documentIds)} className="gap-3">
          <FieldLabelHint
            label="Required Documents"
            hint="Select files already received from the vendor."
          >
            Required Documents
          </FieldLabelHint>
          <FieldGroup className="grid gap-2 sm:grid-cols-2">
            {DOCUMENT_REQUIREMENTS.map((document) => (
              <FieldLabel key={document.id}>
                <Field orientation="horizontal">
                  <Checkbox
                    checked={values.documentIds.includes(document.id)}
                    onCheckedChange={(checked) =>
                      onDocumentToggle(document.id, checked === true)
                    }
                  />
                  <FieldContent>
                    <FieldTitle>{document.title}</FieldTitle>
                    <FieldDescription>{document.description}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </FieldGroup>
          {errors.documentIds ? (
            <FieldError>{errors.documentIds}</FieldError>
          ) : null}
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="wizard-2-notes">Reviewer Notes</FieldLabel>
          <Textarea
            id="wizard-2-notes"
            value={values.submissionNotes}
            onChange={(event) =>
              onValueChange("submissionNotes", event.target.value)
            }
            className="min-h-24 resize-none"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummarySection title="Vendor">
            <dl className="flex flex-col gap-2.5">
              <SummaryLine label="Company" value={values.companyName} />
              <SummaryLine label="Category" value={summary.categoryLabel} />
              <SummaryLine label="Country" value={summary.countryLabel} />
            </dl>
          </SummarySection>

          <SummarySection title="Compliance">
            <dl className="flex flex-col gap-2.5">
              <SummaryLine label="Tax/VAT" value={values.taxId} />
              <SummaryLine label="Owners" value={values.owners.length} />
              <SummaryLine label="Status" value="Reviewed" />
            </dl>
          </SummarySection>
        </div>
      </FieldGroup>
    </section>
  )
}