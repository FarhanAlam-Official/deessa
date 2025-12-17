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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsUWCYaFPG7GyS64bfWSRDbrDhn5tu3xPWGK0XpCFvTIxpdqKQGubVCAU9eS_wV7Ib0Vj4jVxpg07qs6CCPp7z9ZG-j78jRQ-9oMwVxadXP9Y-d0Vh_lNm4yMyw9lJsLo66qzdp11-ZLyCI0kWyIXQ3Ykb3Xtze-SVoxvjfjEOwdGmN8B0t7uhk8jZ-SL5aoM0LLNBTurYxCyCVQNnNbe4e1ix5XRPDzmLj_wMf4S-xVAtIn6elgL0twCno-p0LJ8iux7-FZhuXko",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDlIvwxjjVIs5a1JDqRwOpujVb3YiFh4IrSNIMDT1rwlyWBeGtN9wXsmJldkg-BUG45Bk_RUjoC6kXr_0DTZCfyY7arejjW8tPE9e2Ax05aB4s88VRcXFcKlZj1DPsYzphkd5VmwvAl6aXRvx8WHQH-nADSDm9kFWpBQrup6pNSDP-afqSywSUVC0cj8n_36pdGqcJpA0kXFeSCA_FSL08Ac-1mN3f8JCu6rMWU2lf4Uz4OCJONPJsyUCbSxM7BsuRQzUCdJT2F1A",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYHktbxMpMcFhM1Ij9H4p1i8VFrhGGQehbPVsrJLYKfvPHHZSn1BSRtk8DyBncxRyms3FIYD0O9j6nE9tmin7dJpdBznrXnZoJh3yfTep0cAGFYtO3PU8uiyXeHm71Jt0mWMVJg4PUwlZQ3MDiFFyWXqrDCOAbn0BahrIua2EMV1Ue1K0QiXdGaRKUExsybiqu7PATWUQP9U9MoJXX8ojQUttoIiQgYO2bQP6RXimuMpqpG6nJs83V4V8KdT721ymYGv5Msfh89N4",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDr9-q79k8WxNSj6mqLaGGrNwvUteRXyzVl6qlm0T4JiJUiIrZlXVxiO1judXHvJURkIv44qbkGLrh3G2ahUwVVX1XBMaUY9ldK1i5ZlRkY4HpkizN636q81y0wNrrqCpa1INz70kpfg3Bnxn7ZH6n1JTmav8bxRapJlVsb_13GDr8jYLaX7sWsxuj97mLj5RqjCTP1ChCQswSFz8mi1YgD8JSILQIEpsGyfMV63Rs6QgOmac0mjSQpnWHq5YnVpoodcHzxq6lj79g",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdWCJ2YGpQahpu1U62Eh5srfNW45c2MvDLLpwbJPqSuEBPEWzlnLU-iNxXSfm23cr7khPB5cvGEMX7Y12nzCroSOtnIWIzgtxWKcVpipKHDu-0gZ9YusWFaHvtdnpx5A3jaHIcqlOk3FBvag--U9iFNweK1MT9QFcrCqU8_aLTJfl-7-K2Yxqb86aduskNapQL7LNFFcRcpxiisQde_nz84Prk8uipuVCRbTHriic8BNWCI-yizwO7dHuoGRKzKLnv72_OAyitE",
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
