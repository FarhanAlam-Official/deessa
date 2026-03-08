export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
}

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Sharma",
    role: "Executive Director",
    bio: "Passionate about educational reform with 15 years of NGO experience.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "2",
    name: "Rajesh Thapa",
    role: "Head of Operations",
    bio: "Coordinates field logistics ensuring aid reaches the most remote areas.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "3",
    name: "Anjali Gurung",
    role: "Community Liaison",
    bio: "Works directly with village leaders to identify needs and build trust.",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=85",
  },
  {
    id: "4",
    name: "David Chen",
    role: "Finance Manager",
    bio: "Ensures transparency and accountability in every dollar donated.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=85",
  },
]
