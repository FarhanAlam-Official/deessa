"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, CreditCard, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PaymentSettings, PaymentProvider } from "@/lib/payments/config"
import { updatePaymentSettings } from "@/lib/actions/admin-payments"

interface PaymentSettingsFormProps {
  settings: PaymentSettings
  paymentMode: "mock" | "live"
  envConfigured: Record<PaymentProvider, boolean>
}

export function PaymentSettingsForm({ settings, paymentMode, envConfigured }: PaymentSettingsFormProps) {
  const router = useRouter()
  const [enabledProviders, setEnabledProviders] = useState<PaymentProvider[]>(settings.enabledProviders)
  const [primaryProvider, setPrimaryProvider] = useState<PaymentProvider>(settings.primaryProvider)
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "NPR">(settings.defaultCurrency)
  const [allowRecurring, setAllowRecurring] = useState(settings.allowRecurring)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleProvider = (provider: PaymentProvider) => {
    setEnabledProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider],
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!enabledProviders.includes(primaryProvider)) {
      setError("Primary provider must be enabled.")
      setIsSubmitting(false)
      return
    }

    const result = await updatePaymentSettings({
      enabledProviders,
      primaryProvider,
      defaultCurrency,
      allowRecurring,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess("Payment settings updated successfully.")
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const providerLabel: Record<PaymentProvider, string> = {
    stripe: "Stripe",
    khalti: "Khalti",
    esewa: "eSewa",
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-600 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Providers
          </CardTitle>
          <CardDescription>
            Enable or disable payment providers. API keys and webhook secrets are configured via environment
            variables only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(providerLabel) as PaymentProvider[]).map((provider) => {
              const enabled = enabledProviders.includes(provider)
              const configured = envConfigured[provider]
              const effectivelyAvailable = paymentMode === "mock" || (enabled && configured)

              return (
                <div key={provider} className="flex flex-col justify-between rounded-lg border p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">{providerLabel[provider]}</Label>
                      <Switch checked={enabled} onCheckedChange={() => toggleProvider(provider)} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {provider === "stripe" && "Cards / international (Stripe Checkout)."}
                      {provider === "khalti" && "Digital wallet for Nepal (Khalti)."}
                      {provider === "esewa" && "Digital wallet / bank for Nepal (eSewa)."}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mode:{" "}
                    <span className="font-semibold uppercase">
                      {paymentMode}
                      {paymentMode === "mock" ? " (sandbox, no real charges)" : ""}
                    </span>
                    <br />
                    Env:{" "}
                    <span className={configured ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                      {configured ? "keys configured" : "missing keys"}
                    </span>
                    <br />
                    Effective:{" "}
                    <span className={effectivelyAvailable ? "text-green-700 font-medium" : "text-yellow-700 font-medium"}>
                      {effectivelyAvailable ? "available to donors" : "hidden from donors"}
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Defaults
          </CardTitle>
          <CardDescription>Control default currency and primary provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary provider</Label>
              <Select value={primaryProvider} onValueChange={(value) => setPrimaryProvider(value as PaymentProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {providerLabel[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This provider will be preselected on the public donation form.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Default currency (Stripe)</Label>
              <Select
                value={defaultCurrency}
                onValueChange={(value) => setDefaultCurrency(value as "USD" | "NPR")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="NPR">NPR</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Local gateways (Khalti, eSewa) always use NPR; this only affects Stripe.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="allowRecurring">Allow recurring (monthly) donations</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, donors will only be able to make one-time donations.
              </p>
            </div>
            <Switch
              id="allowRecurring"
              checked={allowRecurring}
              onCheckedChange={(checked) => setAllowRecurring(checked)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <span className="mr-2 h-4 w-4 animate-spin border-b-2 border-white rounded-full" />}
              Save Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


