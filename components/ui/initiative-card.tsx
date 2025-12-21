import Image from "next/image"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InitiativeCardProps {
  title: string
  description: string
  image: string
  icon: LucideIcon
  href: string
  className?: string
}

export function InitiativeCard({ title, description, image, icon: Icon, href, className }: InitiativeCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-4xl bg-gray-100 transition-all duration-500 ease-out hover:shadow-2xl h-125",
        className,
      )}
    >
      <Image
        src={image || "/placeholder.svg"}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-30 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      <div className="absolute bottom-0 p-8 w-full translate-y-12 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
          <Icon className="size-5" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-200 text-sm leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {description}
        </p>
        <span className="inline-flex items-center text-white font-bold text-sm border-b-2 border-primary pb-1">
          Learn More <ArrowRight className="size-4 ml-1" />
        </span>
      </div>
    </Link>
  )
}
