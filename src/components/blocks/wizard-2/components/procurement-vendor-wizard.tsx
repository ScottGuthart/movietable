"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_WIZARD_VALUES,
  REGISTRATION_OPTIONS,
  WIZARD_STEPS,
  type DocumentId,
  type OwnerRecord,
  type WizardOption,
  type WizardStepId,
  type WizardValues,
} from "./data"
import {
  CompanyStepFields,
  DocumentsStepFields,
  OwnershipStepFields,
  type WizardErrors,
} from "./procurement-vendor-steps"
import { IconCheck, IconFlag, IconArrowLeft, IconArrowRight } from "@tabler/icons-react"

function createDefaultValues(): WizardValues {
  return {
    ...DEFAULT_WIZARD_VALUES,
    owners: DEFAULT_WIZARD_VALUES.owners.map((owner) => ({ ...owner })),
    documentIds: [...DEFAULT_WIZARD_VALUES.documentIds],
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getOptionLabel<TValue extends string>(
  options: WizardOption<TValue>[],
  value: TValue
) {
  return options.find((option) => option.value === value)?.label ?? "Not set"
}

function getStepErrors(stepId: WizardStepId, values: WizardValues) {
  const nextErrors: WizardErrors = {}

  if (stepId === "company") {
    if (!values.companyName.trim()) {
      nextErrors.companyName = "Enter the legal company name."
    }

    if (!isValidEmail(values.contactEmail)) {
      nextErrors.contactEmail = "Enter a valid procurement email."
    }
  }

  if (stepId === "ownership") {
    if (!values.taxId.trim()) {
      nextErrors.taxId = "Enter the Tax/VAT ID."
    }

    if (!values.incorporationDate.trim()) {
      nextErrors.incorporationDate = "Enter the incorporation date."
    }

    if (!values.owners.some((owner) => owner.name.trim())) {
      nextErrors.owners = "Add at least one beneficial owner."
    }

    if (!values.ownershipAttested) {
      nextErrors.ownershipAttested = "Confirm beneficial ownership review."
    }
  }

  if (stepId === "documents" && values.documentIds.length < 2) {
    nextErrors.documentIds = "Select at least two received documents."
  }

  return nextErrors
}

function getAllRequiredErrors(values: WizardValues) {
  return {
    ...getStepErrors("company", values),
    ...getStepErrors("ownership", values),
    ...getStepErrors("documents", values),
  }
}

function getFirstInvalidStep(values: WizardValues) {
  if (Object.keys(getStepErrors("company", values)).length > 0) return 1
  if (Object.keys(getStepErrors("ownership", values)).length > 0) return 2
  if (Object.keys(getStepErrors("documents", values)).length > 0) return 3

  return null
}

function DotSeparator() {
  return (
    <span
      className="size-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500"
      aria-hidden="true"
    />
  )
}

export function ProcurementVendorWizard() {
  const [currentStep, setCurrentStep] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [values, setValues] = useState<WizardValues>(createDefaultValues)
  const [errors, setErrors] = useState<WizardErrors>({})

  const currentStepConfig = useMemo(
    () =>
      WIZARD_STEPS.find((step) => step.step === currentStep) ?? WIZARD_STEPS[0],
    [currentStep]
  )

  const summary = useMemo(
    () => ({
      categoryLabel: getOptionLabel(CATEGORY_OPTIONS, values.category),
      countryLabel: getOptionLabel(COUNTRY_OPTIONS, values.country),
      registrationLabel: getOptionLabel(
        REGISTRATION_OPTIONS,
        values.registrationStatus
      ),
    }),
    [values.category, values.country, values.registrationStatus]
  )

  const handleValueChange = useCallback(
    (field: keyof WizardValues, value: WizardValues[keyof WizardValues]) => {
      setValues((current) => ({
        ...current,
        [field]: value,
      }))

      setErrors((current) => {
        if (!current[field]) {
          return current
        }

        const nextErrors = { ...current }
        delete nextErrors[field]
        return nextErrors
      })
    },
    []
  )

  const handleOwnerChange = useCallback(
    (id: string, field: keyof OwnerRecord, value: string) => {
      setValues((current) => ({
        ...current,
        owners: current.owners.map((owner) =>
          owner.id === id ? { ...owner, [field]: value } : owner
        ),
      }))

      setErrors((current) => {
        if (!current.owners) return current
        const nextErrors = { ...current }
        delete nextErrors.owners
        return nextErrors
      })
    },
    []
  )

  const handleAddOwner = useCallback(() => {
    setValues((current) => ({
      ...current,
      owners: [
        ...current.owners,
        {
          id: `owner-${Date.now()}`,
          name: "",
          address: "",
          share: "",
        },
      ],
    }))
  }, [])

  const handleRemoveOwner = useCallback((id: string) => {
    setValues((current) => ({
      ...current,
      owners: current.owners.filter((owner) => owner.id !== id),
    }))

    setErrors((current) => {
      if (!current.owners) return current
      const nextErrors = { ...current }
      delete nextErrors.owners
      return nextErrors
    })
  }, [])

  const handleDocumentToggle = useCallback(
    (documentId: DocumentId, checked: boolean) => {
      setValues((current) => ({
        ...current,
        documentIds: checked
          ? Array.from(new Set([...current.documentIds, documentId]))
          : current.documentIds.filter((id) => id !== documentId),
      }))

      setErrors((current) => {
        if (!current.documentIds) return current
        const nextErrors = { ...current }
        delete nextErrors.documentIds
        return nextErrors
      })
    },
    []
  )

  const handleBack = useCallback(() => {
    setCurrentStep((step) => Math.max(1, step - 1))
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isSubmitting) {
        return
      }

      if (currentStepConfig.id !== "documents") {
        const stepErrors = getStepErrors(currentStepConfig.id, values)

        if (Object.keys(stepErrors).length > 0) {
          setErrors((current) => ({ ...current, ...stepErrors }))
          return
        }

        const nextStep = Math.min(currentStep + 1, WIZARD_STEPS.length)
        setCurrentStep(nextStep)
        return
      }

      const requiredErrors = getAllRequiredErrors(values)
      const invalidStep = getFirstInvalidStep(values)

      if (Object.keys(requiredErrors).length > 0 && invalidStep !== null) {
        setErrors(requiredErrors)
        setCurrentStep(invalidStep)
        return
      }

      setIsSubmitting(true)
      window.setTimeout(() => {
        setIsSubmitting(false)
        toast.success("Vendor file submitted", {
          description: `${values.companyName} is ready for procurement review.`,
        })
      }, 900)
    },
    [currentStep, currentStepConfig.id, isSubmitting, values]
  )

  const isLastStep = currentStep === WIZARD_STEPS.length
  const canGoBack = currentStep > 1 && !isSubmitting

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl flex-col"
      aria-label="Procurement vendor onboarding wizard"
    >
      <Stepper
        value={currentStep}
        onValueChange={setCurrentStep}
        indicators={{
          completed: (
            <IconCheck className="size-3.5" aria-hidden="true" />
          ),
          loading: <Spinner className="size-3.5" />,
        }}
        className="w-full"
      >
        <Frame stacked={true} className="w-full">
          <FrameHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-px">
                <FrameTitle>Procurement Vendor Setup</FrameTitle>
                <FrameDescription className="inline-flex min-w-0 items-center gap-1.5 text-sm">
                  <span className="shrink-0">{values.portalId}</span>
                  <DotSeparator />
                  <span className="truncate">{summary.categoryLabel}</span>
                </FrameDescription>
              </div>
              <Badge variant="warning-light">Review file</Badge>
            </div>
          </FrameHeader>

          <FramePanel className="flex items-center overflow-x-auto">
            <StepperNav
              aria-label="Wizard progress"
              className="min-w-full items-center"
            >
              {WIZARD_STEPS.map((step, index) => (
                <StepperItem
                  key={step.id}
                  step={step.step}
                  loading={isSubmitting && step.step === currentStep}
                  className="relative min-w-0"
                >
                  <StepperTrigger
                    type="button"
                    className="min-w-0 justify-start gap-2 disabled:opacity-100"
                  >
                    <StepperIndicator className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=completed]:bg-primary data-[state=inactive]:border-border data-[state=inactive]:text-foreground data-[state=active]:before:border-primary relative isolate size-6 overflow-visible rounded-full border before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-full before:border before:border-dashed before:border-transparent before:content-[''] data-[state=active]:border-0 data-[state=active]:before:animate-[spin_8s_linear_infinite] motion-reduce:data-[state=active]:before:animate-none">
                      {index + 1}
                    </StepperIndicator>
                    <StepperTitle className="text-foreground hidden truncate text-sm capitalize sm:block">
                      {step.title}
                    </StepperTitle>
                  </StepperTrigger>

                  {WIZARD_STEPS.length > index + 1 ? (
                    <StepperSeparator className="bg-border group-data-[state=completed]/step:bg-primary mx-2" />
                  ) : null}
                </StepperItem>
              ))}
            </StepperNav>
          </FramePanel>

          <FramePanel>
            <StepperPanel className="text-sm">
              {WIZARD_STEPS.map((step) => (
                <StepperContent key={step.id} value={step.step}>
                  {step.id === "company" ? (
                    <CompanyStepFields
                      values={values}
                      errors={errors}
                      summary={summary}
                      onValueChange={handleValueChange}
                    />
                  ) : null}

                  {step.id === "ownership" ? (
                    <OwnershipStepFields
                      values={values}
                      errors={errors}
                      onValueChange={handleValueChange}
                      onOwnerChange={handleOwnerChange}
                      onAddOwner={handleAddOwner}
                      onRemoveOwner={handleRemoveOwner}
                    />
                  ) : null}

                  {step.id === "documents" ? (
                    <DocumentsStepFields
                      values={values}
                      errors={errors}
                      summary={summary}
                      onValueChange={handleValueChange}
                      onDocumentToggle={handleDocumentToggle}
                    />
                  ) : null}
                </StepperContent>
              ))}
            </StepperPanel>
          </FramePanel>

          <FrameFooter className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FrameDescription className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
              <IconFlag className="size-4 shrink-0" aria-hidden="true" />
              {currentStepConfig.description}
            </FrameDescription>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              {canGoBack ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
                  Previous
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shrink-0"
              >
                {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                {isLastStep ? "Submit" : "Next Step"}
                {!isLastStep && !isSubmitting ? (
                  <IconArrowRight data-icon="inline-end" aria-hidden="true" />
                ) : null}
              </Button>
            </div>
          </FrameFooter>
        </Frame>
      </Stepper>
    </form>
  )
}