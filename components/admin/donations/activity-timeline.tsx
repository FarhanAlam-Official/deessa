"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Cog,
  User,
  Zap,
  ArrowRight,
  FileText,
  Receipt,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/date-formatting"
import type { TimelineEvent } from "@/lib/utils/activity-timeline"

interface ActivityTimelineProps {
  events: TimelineEvent[]
}

export const ActivityTimeline = memo(function ActivityTimeline({ events }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<"all" | "system" | "admin" | "webhooks">("all")
  const [displayCount, setDisplayCount] = useState(50)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const getEventIcon = (type: string) => {
    switch (type) {
      case "system":
        return <Cog className="h-4 w-4 text-blue-600" />
      case "admin":
      case "status_change":
      case "note_added":
        return <User className="h-4 w-4 text-orange-600" />
      case "webhook":
        return <Zap className="h-4 w-4 text-purple-600" />
      case "receipt":
        return <Receipt className="h-4 w-4 text-green-600" />
      case "email":
        return <Mail className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "system":
        return "bg-blue-100"
      case "admin":
      case "status_change":
      case "note_added":
        return "bg-orange-100"
      case "webhook":
        return "bg-purple-100"
      case "receipt":
        return "bg-green-100"
      case "email":
        return "bg-blue-100"
      default:
        return "bg-gray-100"
    }
  }

  const filterEvents = (events: TimelineEvent[]) => {
    if (filter === "all") return events

    if (filter === "system") {
      return events.filter((e) => e.type === "system" || e.type === "receipt" || e.type === "email")
    }

    if (filter === "admin") {
      return events.filter(
        (e) => e.type === "admin" || e.type === "status_change" || e.type === "note_added"
      )
    }

    if (filter === "webhooks") {
      return events.filter((e) => e.type === "webhook")
    }

    return events
  }

  const toggleExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  // Render metadata in a beautiful, structured way
  const renderMetadata = (metadata: any, eventType: string) => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    // Status change metadata
    if (eventType === "status_change" && metadata.reason) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status Change:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {metadata.oldStatus}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-xs capitalize">
                {metadata.newStatus}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">Reason:</span>
            <p className="text-sm bg-background p-3 rounded border">{metadata.reason}</p>
          </div>
        </div>
      )
    }

    // Note added metadata
    if (eventType === "note_added" && metadata.noteText) {
      return (
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-1">Note:</span>
          <p className="text-sm bg-background p-3 rounded border whitespace-pre-wrap">
            {metadata.noteText}
          </p>
        </div>
      )
    }

    // Webhook metadata
    if (eventType === "webhook") {
      return (
        <div className="space-y-2">
          {metadata.event_type && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Event Type:</span>
              <Badge variant="secondary" className="text-xs">
                {metadata.event_type}
              </Badge>
            </div>
          )}
          {metadata.provider && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Provider:</span>
              <span className="text-xs capitalize">{metadata.provider}</span>
            </div>
          )}
          {metadata.status && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Status:</span>
              <Badge variant="outline" className="text-xs capitalize">
                {metadata.status}
              </Badge>
            </div>
          )}
          {/* Show raw data in collapsible section */}
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              View raw data
            </summary>
            <pre className="mt-2 text-xs bg-background p-2 rounded border overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </details>
        </div>
      )
    }

    // Generic metadata display
    return (
      <div className="space-y-2">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground capitalize min-w-[100px]">
              {key.replace(/_/g, " ")}:
            </span>
            <span className="text-xs flex-1">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const filteredEvents = filterEvents(events)
  const displayedEvents = filteredEvents.slice(0, displayCount)
  const hasMore = filteredEvents.length > displayCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline ({filteredEvents.length})</CardTitle>
        {/* Filter buttons - horizontally scrollable on mobile */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-shrink-0 touch-manipulation min-h-[44px]"
          >
            All
          </Button>
          <Button
            variant={filter === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("system")}
            className="flex-shrink-0 touch-manipulation min-h-[44px]"
          >
            System
          </Button>
          <Button
            variant={filter === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("admin")}
            className="flex-shrink-0 touch-manipulation min-h-[44px]"
          >
            Admin
          </Button>
          <Button
            variant={filter === "webhooks" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("webhooks")}
            className="flex-shrink-0 touch-manipulation min-h-[44px]"
          >
            Webhooks
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {displayedEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No events found</div>
        ) : (
          <div className="space-y-4">
            {displayedEvents.map((event, index) => {
              const isExpanded = expandedEvents.has(event.id)
              const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0

              return (
                <div key={event.id} className="flex gap-3 sm:gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`rounded-full p-2 ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    {index < displayedEvents.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Event content - full width on mobile */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{event.actor}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground break-words">{event.description}</div>

                        {/* Status change metadata - inline display */}
                        {event.type === "status_change" && event.metadata && event.metadata.reason && !isExpanded && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs capitalize bg-background">
                                {event.metadata.oldStatus}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs capitalize bg-background">
                                {event.metadata.newStatus}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Reason:</span> {event.metadata.reason}
                            </p>
                          </div>
                        )}

                        {/* Expandable metadata */}
                        {hasMetadata && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(event.id)}
                            className="mt-2 h-auto p-0 text-xs touch-manipulation hover:text-primary"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show details
                              </>
                            )}
                          </Button>
                        )}

                        {isExpanded && event.metadata && (
                          <div className="mt-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                            {renderMetadata(event.metadata, event.type)}
                          </div>
                        )}
                      </div>

                      <div
                        className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0"
                        title={formatAbsoluteTime(event.timestamp) || undefined}
                      >
                        {formatRelativeTime(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisplayCount((prev) => prev + 50)}
                className="w-full touch-manipulation min-h-[44px]"
              >
                Load More ({filteredEvents.length - displayCount} remaining)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
