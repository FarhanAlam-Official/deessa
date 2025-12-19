"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Eye, CheckCircle, XCircle } from "lucide-react"
import { updateVolunteerStatus } from "@/lib/actions/admin-volunteers"
import { useToast } from "@/hooks/use-toast"
import type { VolunteerApplication } from "@/lib/types/admin"

interface VolunteerActionsProps {
  volunteer: VolunteerApplication
}

export function VolunteerActions({ volunteer }: VolunteerActionsProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleStatusChange(status: string) {
    setIsLoading(true)
    const result = await updateVolunteerStatus(volunteer.id, status)
    setIsLoading(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Status updated",
        description: `Application ${status === "approved" ? "approved" : "rejected"} successfully.`,
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDetails(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {volunteer.status !== "approved" && (
            <DropdownMenuItem onClick={() => handleStatusChange("approved")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Approve
            </DropdownMenuItem>
          )}
          {volunteer.status !== "rejected" && (
            <DropdownMenuItem onClick={() => handleStatusChange("rejected")}>
              <XCircle className="mr-2 h-4 w-4 text-red-600" />
              Reject
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Volunteer Application</DialogTitle>
            <DialogDescription>Details for {volunteer.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{volunteer.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{volunteer.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                <p>{volunteer.occupation || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Availability</p>
                <p>{volunteer.availability}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-1">
                {volunteer.skills?.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-muted rounded text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Interests</p>
              <div className="flex flex-wrap gap-1">
                {volunteer.interests?.map((interest: string) => (
                  <span key={interest} className="px-2 py-1 bg-muted rounded text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            {volunteer.message && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                <p className="text-sm">{volunteer.message}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
