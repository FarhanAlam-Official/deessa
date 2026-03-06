"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { copyToClipboard } from "@/lib/utils/clipboard"
import { notifications } from "@/lib/notifications"

interface PaymentTechnicalProps {
  payment: {
    payment_intent_id?: string | null
    session_id?: string | null
    subscription_id?: string | null
    customer_id?: string | null
    payment_id?: string | null
    verification_id?: string | null
  }
  provider: string
}

export function PaymentTechnical({ payment, provider }: PaymentTechnicalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedField(label)
      notifications.showSuccess({
        title: "Copied",
        description: `${label} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } else {
      notifications.showError({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
      })
    }
  }

  const TechnicalField = ({
    label,
    value,
    tooltip,
  }: {
    label: string
    value: string | null | undefined
    tooltip?: string
  }) => {
    if (!value) {
      return (
        <div>
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="text-sm text-muted-foreground font-mono">— Not Available —</div>
        </div>
      )
    }

    return (
      <div>
        <div className="text-sm font-medium text-muted-foreground" title={tooltip}>
          {label}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
            {value}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(value, label)}
            className="h-11 w-11 p-0 touch-manipulation flex-shrink-0"
            aria-label={`Copy ${label}`}
          >
            {copiedField === label ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Technical Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Financial Reference */}
        <TechnicalField
          label="Payment Intent ID"
          value={payment.payment_intent_id}
          tooltip="Stripe Payment Intent ID - Primary reference for refunds and disputes"
        />

        {/* Session Reference */}
        <TechnicalField
          label="Checkout Session ID"
          value={payment.session_id}
          tooltip="Stripe Checkout Session ID - Reference for checkout flow tracking"
        />

        {/* Subscription Reference (if applicable) */}
        {payment.subscription_id && (
          <TechnicalField
            label="Subscription ID"
            value={payment.subscription_id}
            tooltip="Stripe Subscription ID - Reference for recurring payment management"
          />
        )}

        {/* Customer Reference */}
        <TechnicalField
          label="Customer ID"
          value={payment.customer_id}
          tooltip="Stripe Customer ID - Reference for customer management"
        />

        {/* Legacy Payment ID */}
        <TechnicalField
          label="Payment ID (Legacy)"
          value={payment.payment_id}
          tooltip="Legacy payment identifier with provider prefix"
        />

        {/* Verification ID */}
        <TechnicalField
          label="Verification ID"
          value={payment.verification_id}
          tooltip="Public UUID for receipt verification"
        />

        <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
          <p><span className="font-medium">Provider:</span> <span className="capitalize">{provider}</span></p>
          <p className="text-xs mt-1">
            Payment Intent ID is the primary reference for financial operations (refunds, disputes).
            Session ID is used for checkout flow tracking and debugging.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
