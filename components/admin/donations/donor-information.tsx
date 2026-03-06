"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, User } from "lucide-react"

interface DonorInformationProps {
  donor: {
    name: string
    email: string
    phone?: string | null
    message?: string | null
  }
}

export function DonorInformation({ donor }: DonorInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donor Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-sm font-medium text-muted-foreground">Name</div>
            <div className="text-sm">{donor.name}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <a
              href={`mailto:${donor.email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {donor.email}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-sm font-medium text-muted-foreground">Phone</div>
            {donor.phone ? (
              <a
                href={`tel:${donor.phone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {donor.phone}
              </a>
            ) : (
              <div className="text-sm text-muted-foreground">Not provided</div>
            )}
          </div>
        </div>

        {donor.message && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
            <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
              {donor.message}
            </div>
          </div>
        )}

        {!donor.message && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
            <div className="text-sm text-muted-foreground">No message provided</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
