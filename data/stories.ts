export interface Story {
  id: string
  title: string
  slug: string
  excerpt: string
  image: string
  category: string
  date: string
  readTime: string
}

export const stories: Story[] = [
  {
    id: "1",
    title: "Sita's Journey: From School Drop-out to Community Teacher",
    slug: "sitas-journey",
    excerpt: "How a small scholarship changed the trajectory of an entire village in the Gandaki province.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=85",
    category: "Education",
    date: "Oct 12, 2023",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Building Resilience: Post-Earthquake Reconstruction",
    slug: "building-resilience",
    excerpt: "Restoring homes and hope in affected rural areas through community-led building initiatives.",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=85",
    category: "Relief",
    date: "Sep 28, 2023",
    readTime: "4 min read",
  },
  {
    id: "3",
    title: "Health Camp in Gandaki: 500 Villagers Treated",
    slug: "health-camp-gandaki",
    excerpt: "Providing essential medical care, eye checkups, and medicine to remote communities.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=85",
    category: "Health",
    date: "Sep 15, 2023",
    readTime: "3 min read",
  },
  {
    id: "4",
    title: "Empowering Women Through Skill Development",
    slug: "empowering-women-skills",
    excerpt: "Tailoring workshops helping women gain financial independence and support their families.",
    image:
      "https://images.unsplash.com/photo-1607748851687-ba9a10438559?auto=format&fit=crop&w=800&q=85",
    category: "Empowerment",
    date: "Aug 30, 2023",
    readTime: "6 min read",
  },
  {
    id: "5",
    title: "Clean Water Project: A New Life for Ram's Family",
    slug: "clean-water-project",
    excerpt: "Access to clean water reduces disease by 40% in the targeted village districts.",
    image:
      "https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?auto=format&fit=crop&w=800&q=85",
    category: "Infrastructure",
    date: "Aug 12, 2023",
    readTime: "4 min read",
  },
  {
    id: "6",
    title: "Annual Charity Run: Join Us in Kathmandu",
    slug: "charity-run-kathmandu",
    excerpt: "Run for a cause. Our annual marathon raises awareness and funds for education.",
    image:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=85",
    category: "Events",
    date: "Jul 20, 2023",
    readTime: "2 min read",
  },
]
