"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { retryReceiptGeneration, resolveReceiptFailure } from "./actions"

interface ReceiptFailure {
  id: string
  donation_id: string
  error_type: string
  error_message: string
  error_stack: string | null
  attempt_count: number
  last_attempt_at: string
  created_at: string
  donations: {
    id: string
    amount: number
    currency: string
    donor_name: string
    donor_email: string
    created_at: string
    payment_status: string
  } | null
}

interface FailedReceiptsClientProps {
  failures: ReceiptFailure[]
}

export function FailedReceiptsClient({ failures: initialFailures }: FailedReceiptsClientProps) {
  const [failures, setFailures] = useState(initialFailures)
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set())

  const handleRetry = async (failure: ReceiptFailure) => {
    if (!failure.donations) {
      toast.error("Cannot retry: Donation not found")
      return
    }

    setRetryingIds((prev) => new Set(prev).add(failure.id))

    try {
      const result = await retryReceiptGeneration(failure.donation_id)

      if (result.success) {
        // Mark as resolved
        await resolveReceiptFailure(failure.id, "Manually retried successfully from admin dashboard")

        // Remove from list
        setFailures((prev) => prev.filter((f) => f.id !== failure.id))

        toast.success("Receipt generated successfully!")
      } else {
        toast.error(`Retry failed: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Retry failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev)
        next.delete(failure.id)
        return next
      })
    }
  }

  const getErrorTypeBadge = (errorType: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline"> = {
      generation_failed: "destructive",
      storage_failed: "secondary",
      rpc_failed: "destructive",
      unexpected_error: "outline",
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
          No failed receipts found. All receipts have been generated successfully!
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
        const isRetrying = retryingIds.has(failure.id)
        const donation = failure.donations

        return (
          <Card key={failure.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {donation?.donor_name || "Unknown Donor"}
                  </CardTitle>
                  <CardDescription>
                    {donation?.donor_email || "No email"} •{" "}
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
                  <p className="font-medium">Payment Status:</p>
                  <p className="text-muted-foreground capitalize">
                    {donation?.payment_status || "Unknown"}
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
                onClick={() => handleRetry(failure)}
                disabled={isRetrying || !donation}
                size="sm"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Now
                  </>
                )}
              </Button>

              {!donation && (
                <Alert variant="destructive" className="flex-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Donation not found - cannot retry
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
