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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoKtoVTzruG6gKPDBqOFn6sXswEYs8YYbbG-v2EGGbhON2BpX02eVTPd9aoriL-9H1k8EWyvMyMiwPmvaRMSjdeJUI22Exlld48BQpEVZF0JAPxSpPZAVgHGo0rs7nkFc9Ff6XNHjcFZ5OjqBG7dowxzlznYZOyA9Hmu0FFXggZzZJxb_rUB4DCTIE2YUpBthpEBpFDueXipv0tdyxcjGMwiC3QxRcbb57ENMyuIclrSbreZw2mTW7GZCg58sODpQxFtTkacxKPCo",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHXLuONySZShj6nfTBq25NeNcjyCJyGy0umCFXKNtGGCFeF4XmjEtDfG7KT9EA8faY-q17imYyiU7A5FIoEZeSQk6-wyQMpduNZJj1Nyo5MbzpD7Eu8l0e0EWcv4Z_6-Tdx_eGBNhTyaxlR1nRsqhK5m7LJzN3m8MXARnw_oAmoLr9tVQZu6ZIYVUA8vXeOoBF0LvXilUyGrsEviFjzTq8udKbKaOpmhWyu8DzZHNZFWbIk34G01q5dSe_RhfB0sri_cl6Da6jRdU",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7ROqeS47EhdVhrafDqH0T3YClRszb0KtRYtw5GLM_pCmCb1W1OpCUA8OVhwG-jLJcpOry_AhVIajh40N8vb_9eMw6RXcGdtdXNl8aTaEkVkmP3wkSzxsQRc0JteRJgfRLPrWvBZYzte5Dtiv0KW-nimx4n4_3ueqcsehtomKXBLQ7cUOzcW-syTxocC6rGEhYkK49SHbo3qqHssRpCtUr9Cr5M7SfWggS7GoO_m0h7PJ5zu2kNuHTxRVESMBZXBeziHGJ0zVaveY",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDwl3nQRBv9qp3K1p2A00PoFoJQtb1Wz5bzRJ5pDUMEOi1u2Yo05QWMB6zcgDJbHihLajghq4R-CV5A7MkS-l0be4fSwl2x8TtrQItwrCLytDVJ6lKuIAHgCBDsX7aB2cJDYBWepRF-nE8nznLVLHf5Ypzj6T7sql0smf-3zvmSL8rk9iK15YRECOj90evuWcvMK1fSi-O1gULPDHmvzPGGMq38KY9B7xHG-QA5SSCmKtcPK14moK_ASII_wSKrDlNO83yVHQjkwpU",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCeFAQeRKIPYg_r0JxnmaenGp9kIP6o_ezgY9x47dWk9sP5GeSJaLICgWjNlDHnxVvK9g3EortRQgpfoyC00vJEtw0AcK84lH_gm3rkX6JUZkXIj-gDxsB-45DCUBIFMArx8KKSnDMHKUOqorCSIsuE_UYpbD2JwHhjyd9uqs5yBwiikOgI63fWi_gTOrMUnpi0WcnuMGCnVbA2Z78icyipL5ipo8bOITgYxAWd094keVOcSXNE3PCMaHOjn4XcUW5WXwUUBH45c4k",
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
