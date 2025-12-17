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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTfMn_PUEG4a1KDj3AFMHXBF1v_IJPW_L720huR7TChJeC5GpxHiQIqSHbrGSrcp7nbhNBqmHrOtfAwfOePW7deVTdhaqpW9p3RuHgNWAaKtVKLkIVbiWRgojNvsMTnh7gQw0ytUKGCw2fZw_ZCNSf3DABKQ7s4kl0MYDHj3Y3_zDUqnE6KaHOJPfh_OZjDEN7-qS3tWy0Q_pbCovZMi9z9WOr4xOlN35tu7iETQHqyap9HmtH3siRVhxHBPN6UM6hAxeHRSMP37E",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAWOxNmDccyhJpQd9LUQlRriS_EtEXOT7UKyHlJsAsDXbRp0J1-uraEX4Su-5YSVYwKbb9N6LB_wnAkL5oO5kcblIxbBZNU6toDkLafX-EuRVV3OfdxkifvrfpLKoN8bS9_-ZCftP7kXVoNpA8_7XVE6jqstjyPO7tCXJtBmiI3lmG9jUXhQmni_wwYsWiCqlcvwd-HVXzxHkVVZQj7YoLu9cnA64bB9ulMP1YEO7mRH_SVd54Y5iwSVrsmrp6tjV0WKOmsJ2cBHxc",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCX4oF6JVWW9dBXQfsbHL89ppsa_7oBLjeRmXXOXw-ks5SlvPi1XjtVsavZbm91LhiboktLA_e98BPftKBsEVZz6wK5gtRCzg7H44qcfjTsF66C1vwvo5JT6fCuLV2Xez-sqaXwN-Sqj97A8gD8Lyw01_qFYS3IiOM4qV4EB1eU2S9HDduPDoJPvxhY0SD6vGLu-8lqV_f1DAPtLTi29dNAYBkUOctB6MKxRl6OJ6CpW9Tg2ZQW-MD1rvdq4UkHBjd8-u8RFsW5skI",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuEEAnXb-p1Bn_Y-fywGH5T4I23gRh5Gi5XQd2s3e4qYlXIb3ortG0hrDCbVpNeUT0qlMsRSI0vZqNZCqdPhxAXF3flBISCm2w0yVuk6nuHtrg5Pt0Yi_DrHRHX-9F4_MIzDY4T_XHk7yrPHHVgr3JBOz3E-YJRfNvXpRD2ua4p4iLaT9wMWZ5SeMu2M288gqRahwG0V8mw6_Y8mopszkMymxEE7_-PGuAJjUZ1i1Tw63X4vld_Hp_gHkbOhAhvac1osYXV4FUah0",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBJKRZZwWg7rsx_-TflON-vC7mDqsxHgiz0DTP6CEFNpmAD1n2rqQgD3DLFc4m9I6tEGX8kmend8W0ZSPeQc8tc3KOu4jNStG8Ow6KYqeGYG0z8WbMrnyx3lROdYRSAi-kOdTlRbGm73KSx4Q-lSj5WnUgrjtYRydbc3qgUh-G1J3xS4pgk7q8RPoGRd-1Q-JY-2MN52q46HhL0U3hAmMDz7oRt6Z16pLAAmj88wruauYB3wOhV268BOqFIlXB3FYZUTo4Z-g8KUJE",
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHsR4GOwbA53coODAfSkl1j4XfaK7BivARIky5kqcqs_ikQN40Bw3H7gSp_7BjjCjopSp7eA-7EIMRBL7lcLhFE7YXL8pl-vRrNJckvImoFrR9HEw5zzD3G5ZjhUn3KcBMqMMlOfUYZzVBIijZBTLEXlyk8BMBitO3Qq9uPGiqBODowHwBtOIGecP6xEOQmbKygO6G5dzGmjtT0LnO-G4c-hmeS-CaSKvqePGp6mkOhwnqf4LcxJSP2QASp3sVf4VoNxNpAX_yOEQ",
    category: "Events",
    date: "Jul 20, 2023",
    readTime: "2 min read",
  },
]
