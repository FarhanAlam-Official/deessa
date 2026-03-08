export interface Event {
  id: string
  title: string
  slug: string
  description: string
  image: string
  date: { month: string; day: string; full: string }
  time: string
  location: string
  category: string
  type: "upcoming" | "past"
  verified?: boolean
}

export const events: Event[] = [
  {
    id: "1",
    title: "Kathmandu Literacy Drive",
    slug: "kathmandu-literacy-drive",
    description:
      "Join us for a day of reading, storytelling, and distributing educational materials to underprivileged schools in the valley.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=85",
    date: { month: "Oct", day: "12", full: "October 12, 2024" },
    time: "10:00 AM - 4:00 PM",
    location: "Thamel, Kathmandu",
    category: "Education",
    type: "upcoming",
    verified: true,
  },
  {
    id: "2",
    title: "Women's Skill Workshop",
    slug: "womens-skill-workshop",
    description:
      "A 3-day intensive workshop focused on teaching sewing and handicraft skills to empower local women in Pokhara.",
    image:
      "https://images.unsplash.com/photo-1607748851687-ba9a10438559?auto=format&fit=crop&w=800&q=85",
    date: { month: "Oct", day: "18", full: "October 18, 2024" },
    time: "2:00 PM - 5:00 PM",
    location: "Lakeside, Pokhara",
    category: "Empowerment",
    type: "upcoming",
    verified: true,
  },
  {
    id: "3",
    title: "Winter Cloth Distribution",
    slug: "winter-cloth-distribution",
    description: "Distributed warm clothes to over 500 families in Upper Mustang.",
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=85",
    date: { month: "Dec", day: "20", full: "December 20, 2023" },
    time: "All Day",
    location: "Upper Mustang",
    category: "Relief",
    type: "past",
  },
  {
    id: "4",
    title: "School Reconstruction",
    slug: "school-reconstruction",
    description: "Completed the rebuilding of Shree Janakalyan Secondary School.",
    image:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=85",
    date: { month: "Nov", day: "05", full: "November 5, 2023" },
    time: "All Day",
    location: "Dhading",
    category: "Education",
    type: "past",
  },
  {
    id: "5",
    title: "Rural Health Camp",
    slug: "rural-health-camp",
    description: "Free health checkups for 1,200 villagers in remote Gorkha.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=85",
    date: { month: "Sep", day: "12", full: "September 12, 2023" },
    time: "All Day",
    location: "Gorkha",
    category: "Health",
    type: "past",
  },
]

export function getUpcomingEvents(): Event[] {
  return events.filter((e) => e.type === "upcoming")
}

export function getPastEvents(): Event[] {
  return events.filter((e) => e.type === "past")
}
