import Image from "next/image"
import { cn } from "@/lib/utils"

interface TeamMemberCardProps {
  name: string
  role: string
  bio: string
  image: string
  className?: string
}

export function TeamMemberCard({ name, role, bio, image, className }: TeamMemberCardProps) {
  return (
    <div className={cn("flex flex-col items-center text-center group", className)}>
      <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden border-4 border-surface shadow-md">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <h3 className="text-lg font-bold text-foreground">{name}</h3>
      <p className="text-primary text-sm font-medium mb-2">{role}</p>
      <p className="text-foreground-muted text-sm px-4">{bio}</p>
    </div>
  )
}
