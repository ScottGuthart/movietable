import { ProcurementVendorWizard } from "./components/procurement-vendor-wizard"

export function Page() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-4 sm:p-6 lg:p-10">
      <ProcurementVendorWizard />
    </div>
  )
}