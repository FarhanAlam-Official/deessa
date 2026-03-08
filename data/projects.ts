export interface Project {
  id: string
  title: string
  slug: string
  description: string
  longDescription?: string
  image: string
  category: "education" | "health" | "empowerment" | "relief"
  location: string
  status: "active" | "completed" | "urgent"
  raised?: number
  goal?: number
  metrics?: { label: string; value: string }[]
  timeline?: {
    phase: string
    date: string
    description: string
    status: "completed" | "current" | "upcoming"
  }[]
}

export const projects: Project[] = [
  {
    id: "1",
    title: "Rebuilding Shree Janakalyan School",
    slug: "rebuilding-shree-janakalyan-school",
    description:
      "Providing safe classrooms, furniture, and learning materials for over 200 students in the remote Dhading district after the earthquake damage.",
    image:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=85",
    category: "education",
    location: "Dhading District",
    status: "active",
    raised: 11250,
    goal: 15000,
  },
  {
    id: "2",
    title: "Women's Skill Development",
    slug: "womens-skill-development",
    description:
      "Creating sustainable income sources for marginalized women through vocational training in weaving, sewing, and handicrafts.",
    image:
      "https://images.unsplash.com/photo-1607748851687-ba9a10438559?auto=format&fit=crop&w=800&q=85",
    category: "empowerment",
    location: "Kathmandu Valley",
    status: "active",
    metrics: [
      { label: "Women Trained", value: "120+" },
      { label: "Status", value: "Ongoing" },
    ],
  },
  {
    id: "3",
    title: "Rural Health Camp 2023",
    slug: "rural-health-camp-2023",
    description:
      "A successful 3-day health camp providing free checkups, medicine distribution, and hygiene awareness to over 500 villagers.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=85",
    category: "health",
    location: "Karnali Province",
    status: "completed",
    metrics: [
      { label: "Patients Treated", value: "542" },
      { label: "Outcome", value: "Success" },
    ],
  },
  {
    id: "4",
    title: "Emergency Earthquake Relief",
    slug: "emergency-earthquake-relief",
    description:
      "Immediate distribution of tents, blankets, warm clothes, and food packets to families displaced by the recent earthquake.",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=85",
    category: "relief",
    location: "Jajarkot",
    status: "urgent",
    raised: 11250,
    goal: 25000,
  },
  {
    id: "5",
    title: "Empowering Women in Rural Gorkha",
    slug: "empowering-women-rural-gorkha",
    description:
      "Helping women in remote villages gain financial independence through sustainable agriculture and leadership workshops.",
    longDescription:
      "In the remote villages of Gorkha, following the devastation of the 2015 earthquake, economic recovery has been slow. Women are the backbone of these communities, yet they face significant barriers to financial independence.",
    image:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=85",
    category: "empowerment",
    location: "Sindhupalchowk, Nepal",
    status: "active",
    raised: 15240,
    goal: 20000,
    timeline: [
      {
        phase: "Community Assessment",
        date: "January 2023 - March 2023",
        description: "Conducted surveys in 12 villages to identify specific needs and select beneficiaries.",
        status: "completed",
      },
      {
        phase: "Training Workshops",
        date: "April 2023 - August 2023",
        description: "Running concurrent workshops in farming techniques and financial literacy.",
        status: "current",
      },
      {
        phase: "Market Integration",
        date: "September 2023 - December 2023",
        description: "Establishing supply chains to Kathmandu and monitoring initial sales data.",
        status: "upcoming",
      },
    ],
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getProjectsByCategory(category: string): Project[] {
  if (category === "all") return projects
  return projects.filter((p) => p.category === category)
}
