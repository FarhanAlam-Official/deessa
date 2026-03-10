"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { toast } from "sonner"
import { resendReceiptEmail, resolveEmailFailure } from "./actions"

interface EmailFailure {
  id: string
  donation_id: string
  error_type: string
  error_message: string
  error_stack: string | null
  recipient_email: string | null
  attempt_count: number
  last_attempt_at: string
  created_at: string
  donations: {
    id: string
    amount: number
    currency: string
    donor_name: string
    donor_email: string
    confirmed_at: string
    payment_status: string
    receipt_number: string | null
  } | null
}

interface FailedEmailsClientProps {
  failures: EmailFailure[]
}

export function FailedEmailsClient({ failures: initialFailures }: FailedEmailsClientProps) {
  const [failures, setFailures] = useState(initialFailures)
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set())

  const handleResend = async (failure: EmailFailure) => {
    if (!failure.donations) {
      toast.error("Cannot resend: Donation not found")
      return
    }

    if (!failure.donations.receipt_number) {
      toast.error("Cannot resend: Receipt not generated yet")
      return
    }

    setResendingIds((prev) => new Set(prev).add(failure.id))

    try {
      const result = await resendReceiptEmail(failure.donation_id)

      if (result.success) {
        // Mark as resolved
        await resolveEmailFailure(failure.id, "Manually resent successfully from admin dashboard")

        // Remove from list
        setFailures((prev) => prev.filter((f) => f.id !== failure.id))

        toast.success("Email sent successfully!")
      } else {
        toast.error(`Resend failed: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Resend failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev)
        next.delete(failure.id)
        return next
      })
    }
  }

  const getErrorTypeBadge = (errorType: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline" | "default"> = {
      smtp_failed: "destructive",
      timeout: "secondary",
      auth_failed: "destructive",
      network_error: "outline",
      unexpected_error: "default",
    }

    return (
      <Badge variant={variants[errorType] || "outline"}>
        {errorType.replace(/_/g, " ").toUpperCase()}
      </Badge>
    )
  }

  if (failures.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          No failed emails found. All receipt emails have been sent successfully!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {failures.length} unresolved failure{failures.length !== 1 ? "s" : ""}
        </p>
      </div>

      {failures.map((failure) => {
        const isResending = resendingIds.has(failure.id)
        const donation = failure.donations
        const canResend = donation && donation.receipt_number

        return (
          <Card key={failure.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {donation?.donor_name || "Unknown Donor"}
                  </CardTitle>
                  <CardDescription>
                    {failure.recipient_email || donation?.donor_email || "No email"} •{" "}
                    {donation?.amount} {donation?.currency}
                  </CardDescription>
                </div>
                {getErrorTypeBadge(failure.error_type)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Error Message:</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {failure.error_message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Attempts:</p>
                  <p className="text-muted-foreground">{failure.attempt_count}</p>
                </div>
                <div>
                  <p className="font-medium">Last Attempt:</p>
                  <p className="text-muted-foreground">
                    {new Date(failure.last_attempt_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium">First Failed:</p>
                  <p className="text-muted-foreground">
                    {new Date(failure.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Receipt Number:</p>
                  <p className="text-muted-foreground">
                    {donation?.receipt_number || "Not generated"}
                  </p>
                </div>
              </div>

              {failure.error_stack && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-1">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                    {failure.error_stack}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button
                onClick={() => handleResend(failure)}
                disabled={isResending || !canResend}
                size="sm"
              >
                {isResending ? (
                  <>
                    <Mail className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Email
                  </>
                )}
              </Button>

              {!donation && (
                <Alert variant="destructive" className="flex-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Donation not found - cannot resend
                  </AlertDescription>
                </Alert>
              )}

              {donation && !donation.receipt_number && (
                <Alert variant="destructive" className="flex-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Receipt not generated - generate receipt first
                  </AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
