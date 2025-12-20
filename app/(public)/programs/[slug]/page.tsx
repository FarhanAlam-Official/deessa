import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, Heart, CheckCircle, Clock, Circle } from "lucide-react"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { getProjectBySlug, getPublishedProjectsStatic } from "@/lib/data/projects"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const projects = await getPublishedProjectsStatic()
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    return { title: "Project Not Found - Dessa Foundation" }
  }

  return {
    title: `${project.title} - Dessa Foundation`,
    description: project.description,
  }
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const progress = project.raised && project.goal ? Math.round((project.raised / project.goal) * 100) : 0

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[500px] relative overflow-hidden">
          <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="max-w-[1400px] mx-auto">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to Programs
              </Link>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    project.status === "urgent"
                      ? "bg-red-500 text-white"
                      : project.status === "active"
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                  }`}
                >
                  {project.status}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase">
                  {project.category}
                </span>
              </div>
              <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-4 max-w-3xl">
                {project.title}
              </h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="size-4" />
                <span className="font-medium">{project.location}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <Section className="bg-background">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">About This Project</h2>
              <p className="text-foreground-muted leading-relaxed text-lg">
                {project.long_description || project.description}
              </p>
            </div>

            {/* Timeline */}
            {project.timeline && project.timeline.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Project Timeline</h2>
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {project.timeline.map(
                      (item: { phase: string; date: string; description: string; status: string }, index: number) => (
                        <div key={index} className="relative flex gap-6 pl-10">
                          <div
                            className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              item.status === "completed"
                                ? "bg-green-500 text-white"
                                : item.status === "current"
                                  ? "bg-primary text-white"
                                  : "bg-muted text-foreground-muted"
                            }`}
                          >
                            {item.status === "completed" ? (
                              <CheckCircle className="size-4" />
                            ) : item.status === "current" ? (
                              <Clock className="size-4" />
                            ) : (
                              <Circle className="size-4" />
                            )}
                          </div>
                          <div className="flex-1 bg-surface p-5 rounded-xl border border-border">
                            <h3 className="font-bold text-foreground">{item.phase}</h3>
                            <p className="text-sm text-primary font-medium mt-1">{item.date}</p>
                            <p className="text-foreground-muted mt-2">{item.description}</p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metrics */}
            {project.metrics && project.metrics.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Impact Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {project.metrics.map((metric: { value: string; label: string }, index: number) => (
                    <div key={index} className="bg-surface p-6 rounded-xl border border-border text-center">
                      <div className="text-3xl font-black text-primary">{metric.value}</div>
                      <div className="text-sm font-medium text-foreground-muted mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Donation Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-surface rounded-2xl border border-border overflow-hidden shadow-lg">
              {project.raised && project.goal && (
                <>
                  <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-3xl font-black text-foreground">${project.raised.toLocaleString()}</span>
                        <span className="text-foreground-muted"> raised</span>
                      </div>
                      <span className="text-sm font-bold text-foreground-muted">
                        of ${project.goal.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">{progress}% of goal reached</p>
                  </div>
                </>
              )}
              <div className="p-6">
                <Button asChild size="lg" className="w-full rounded-full h-14 shadow-lg shadow-primary/25">
                  <Link href="/donate">
                    <Heart className="mr-2 size-5 fill-current" />
                    Support This Project
                  </Link>
                </Button>
                <p className="text-xs text-center text-foreground-muted mt-4">
                  100% of your donation goes directly to this project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
