import type { Metadata } from "next"
import ImpactClientPage from "./ImpactClientPage"

export const metadata: Metadata = {
  title: "Our Impact | Deessa Foundation — 10 Years of Change in Nepal",
  description:
    "From the Himalayas to the Terai plains — explore how Deessa Foundation has touched 10,000+ lives across education, healthcare, autism support, and women's empowerment in Nepal since 2014.",
  openGraph: {
    title: "Our Impact | Deessa Foundation",
    description: "10,000+ lives transformed across 25+ districts in Nepal. Explore a decade of impact.",
    type: "website",
  },
}

export default function ImpactPage() {
  return <ImpactClientPage />
}
