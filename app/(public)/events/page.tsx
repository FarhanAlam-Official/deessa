"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, CheckCircle, ArrowRight } from "lucide-react"
import { Section } from "@/components/ui/section"
import { EventCard } from "@/components/ui/event-card"
import { Button } from "@/components/ui/button"
import { EventRegistrationModal } from "@/components/event-registration-modal"
import { createClient } from "@/lib/supabase/client"

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [pastEvents, setPastEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string
    title: string
    date: string
    time: string
    location: string
  } | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient()
      const today = new Date().toISOString().split("T")[0]

      const { data: upcoming } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true })

      const { data: past } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .lt("event_date", today)
        .order("event_date", { ascending: false })
        .limit(6)

      setUpcomingEvents(upcoming || [])
      setPastEvents(past || [])
      setLoading(false)
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[350px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBoKtoVTzruG6gKPDBqOFn6sXswEYs8YYbbG-v2EGGbhON2BpX02eVTPd9aoriL-9H1k8EWyvMyMiwPmvaRMSjdeJUI22Exlld48BQpEVZF0JAPxSpPZAVgHGo0rs7nkFc9Ff6XNHjcFZ5OjqBG7dowxzlznYZOyA9Hmu0FFXggZzZJxb_rUB4DCTIE2YUpBthpEBpFDueXipv0tdyxcjGMwiC3QxRcbb57ENMyuIclrSbreZw2mTW7GZCg58sODpQxFtTkacxKPCo")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Community Events
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Join Us in Making Change
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Participate in our events, workshops, and community gatherings across Nepal.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <Section className="bg-surface">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Upcoming Events</h2>
            <p className="text-foreground-muted mt-1">Mark your calendar and join us!</p>
          </div>
          <Calendar className="size-8 text-primary" />
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid gap-8">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-background rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all"
              >
                <div className="grid md:grid-cols-3 gap-0">
                  <div className="aspect-[16/10] md:aspect-auto relative overflow-hidden">
                    <Image
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {event.verified && (
                      <div className="absolute top-4 left-4 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        <CheckCircle className="size-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        {event.category}
                      </span>
                      <span className="text-foreground-muted text-sm font-medium">
                        {new Date(event.event_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-foreground-muted mb-4">{event.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted mb-6">
                      <span className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {event.event_time || "TBA"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {event.location}
                      </span>
                    </div>
                    <div>
                      <Button
                        className="rounded-full"
                        onClick={() =>
                          setSelectedEvent({
                            id: event.id,
                            title: event.title,
                            date: new Date(event.event_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }),
                            time: event.event_time || "TBA",
                            location: event.location,
                          })
                        }
                      >
                        Register Now
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-background rounded-2xl border border-border">
            <Calendar className="size-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Upcoming Events</h3>
            <p className="text-foreground-muted">Check back soon for new events or subscribe to our newsletter.</p>
          </div>
        )}
      </Section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Section className="bg-background">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Past Events</h2>
            <p className="text-foreground-muted mt-1">See what we&apos;ve accomplished together.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                description={event.description}
                image={event.image}
                date={{
                  day: new Date(event.event_date).getDate().toString(),
                  month: new Date(event.event_date).toLocaleString("en-US", { month: "short" }),
                  full: new Date(event.event_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                }}
                time={event.event_time || ""}
                location={event.location}
                category={event.category}
                isPast
              />
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Want to Host an Event With Us?</h2>
          <p className="text-white/80 mb-8">Partner with Dessa Foundation to organize impactful community events.</p>
          <Button asChild variant="secondary" size="lg" className="rounded-full h-12 px-8">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>

      <EventRegistrationModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent || { id: "", title: "", date: "", time: "", location: "" }}
      />
    </>
  )
}
