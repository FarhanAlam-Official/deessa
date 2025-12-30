import { FileText, Download, Award, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ResourceItem {
  title: string
  description: string
  file: string
  icon: typeof FileText
  type?: "pdf" | "jpg" | "png"
}

const resources: ResourceItem[] = [
  {
    title: "Organization Bio",
    description: "A comprehensive overview of deessa Foundation's mission and impact",
    file: "/deesa-resources/deessa Foundation_ Short Bio -2.pdf",
    icon: BookOpen,
    type: "pdf",
  },
  {
    title: "Concept Note",
    description: "General concept and strategic approach of our programs",
    file: "/deesa-resources/General Concept Note- deeSsa Foundation .pdf",
    icon: FileText,
    type: "pdf",
  },
  {
    title: "Brand Guidelines",
    description: "Official brand identity and usage guidelines for partners",
    file: "/deesa-resources/Deessa Brand Guidelines.pdf",
    icon: Download,
    type: "pdf",
  },
  {
    title: "SWC Registration",
    description: "Social Welfare Council registration certificate",
    file: "/deesa-resources/SWC.jpg",
    icon: Award,
    type: "jpg",
  },
]

interface ResourceDownloadsProps {
  variant?: "grid" | "list"
  showDescription?: boolean
  className?: string
  items?: ResourceItem[]
}

export function ResourceDownloads({
  variant = "grid",
  showDescription = true,
  className = "",
  items = resources,
}: ResourceDownloadsProps) {
  if (variant === "list") {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((resource) => {
          const Icon = resource.icon
          return (
            <div
              key={resource.title}
              className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{resource.title}</h3>
                  {showDescription && (
                    <p className="text-sm text-foreground-muted">{resource.description}</p>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href={resource.file} download className="flex items-center gap-2">
                  <Download className="size-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {items.map((resource) => {
        const Icon = resource.icon
        return (
          <Card key={resource.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="size-12 flex items-center justify-center bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <Icon className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{resource.title}</h3>
                  {showDescription && (
                    <p className="text-sm text-foreground-muted leading-relaxed">{resource.description}</p>
                  )}
                </div>
              </div>
              <Button asChild className="w-full" variant="outline">
                <a href={resource.file} download className="flex items-center justify-center gap-2">
                  <Download className="size-4" />
                  Download {resource.type?.toUpperCase()}
                </a>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Export specific resource groups for different use cases
export const legalResources = resources.filter((r) => r.icon === Award)
export const brandResources = resources.filter((r) => r.title.includes("Brand") || r.title.includes("Bio"))
export const allResources = resources
