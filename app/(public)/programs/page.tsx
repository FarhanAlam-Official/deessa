import type { Metadata } from "next"
import Link from "next/link"
import { GraduationCap, Stethoscope, UserRoundCheck, MapPin, AlertTriangle } from "lucide-react"
import { Section } from "@/components/ui/section"
import { ProjectCard } from "@/components/ui/project-card"
import { Button } from "@/components/ui/button"
import { getProjectsByCategory } from "@/lib/data/projects"

export const metadata: Metadata = {
  title: "Programs - Dessa Foundation",
  description: "Explore our programs in education, healthcare, women's empowerment, and disaster relief across Nepal.",
}

const categories = [
  { id: "all", label: "All Programs", icon: null },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "health", label: "Healthcare", icon: Stethoscope },
  { id: "empowerment", label: "Empowerment", icon: UserRoundCheck },
  { id: "relief", label: "Relief", icon: AlertTriangle },
]

function getCategoryIcon(category: string) {
  switch (category) {
    case "education":
      return GraduationCap
    case "health":
      return Stethoscope
    case "empowerment":
      return UserRoundCheck
    case "relief":
      return AlertTriangle
    default:
      return MapPin
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "education":
      return "text-primary"
    case "health":
      return "text-green-600"
    case "empowerment":
      return "text-purple-600"
    case "relief":
      return "text-orange-600"
    default:
      return "text-primary"
  }
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const activeCategory = params.category || "all"
  const filteredProjects = await getProjectsByCategory(activeCategory)

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[400px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVUER9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI")`,
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
            <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Making a Difference
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Our Programs & Initiatives
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-2xl leading-relaxed">
              Sustainable solutions for education, healthcare, and community development across Nepal.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <Section className="bg-surface border-b border-border py-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.id === "all" ? "/programs" : `/programs?category=${cat.id}`}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-background text-foreground-muted hover:bg-muted border border-border"
              }`}
            >
              {cat.icon && <cat.icon className="inline-block size-4 mr-2" />}
              {cat.label}
            </Link>
          ))}
        </div>
      </Section>

      {/* Projects Grid */}
      <Section className="bg-background">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                image={project.image}
                icon={getCategoryIcon(project.category)}
                iconColor={getCategoryColor(project.category)}
                location={project.location}
                category={project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                status={project.status}
                raised={project.raised}
                goal={project.goal}
                metrics={project.metrics}
                href={`/programs/${project.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-foreground-muted text-lg">No programs found in this category.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/programs">View All Programs</Link>
            </Button>
          </div>
        )}
      </Section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Want to Support a Specific Program?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Your targeted donation ensures maximum impact in the area you care about most.
          </p>
          <Button asChild variant="secondary" size="lg" className="rounded-full h-12 px-8">
            <Link href="/donate">Make a Donation</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
