import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form"
import { getPaymentMode, getPaymentSettings, isProviderEnvConfigured, type PaymentProvider } from "@/lib/payments/config"

export default async function PaymentSettingsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    redirect("/admin")
  }

  const settings = await getPaymentSettings()
  const mode = getPaymentMode()

  const providers: PaymentProvider[] = ["stripe", "khalti", "esewa"]
  const envConfigured = providers.reduce<Record<PaymentProvider, boolean>>((acc, provider) => {
    acc[provider] = isProviderEnvConfigured(provider)
    return acc
  }, {} as Record<PaymentProvider, boolean>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure which payment providers are visible to donors. Secrets and live mode are controlled via
          environment variables.
        </p>
      </div>
      <PaymentSettingsForm settings={settings} paymentMode={mode} envConfigured={envConfigured} />
    </div>
  )
}


