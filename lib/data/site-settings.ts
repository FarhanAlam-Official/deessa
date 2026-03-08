"use server"

import { createClient } from "@/lib/supabase/server"

// Type definitions for site settings
export interface HeroSettings {
  image: string
  title?: string
  subtitle?: string
  badge?: string
  overlayOpacity?: number
}

export interface HomeHeroSettings {
  mainImage: string
  videoImage: string
  classroomImage: string
  donorImage1: string
  donorImage2: string
  title: string
  subtitle: string
  badge: string
}

export interface InitiativeSettings {
  education: {
    title: string
    description: string
    image: string
  }
  empowerment: {
    title: string
    description: string
    image: string
  }
  health: {
    title: string
    description: string
    image: string
  }
}

export interface PressGalleryImage {
  url: string
  caption?: string
  credit?: string
}

export interface PressGallerySettings {
  images: PressGalleryImage[]
}

export interface BrandingSettings {
  primaryLogo?: string
  secondaryLogo?: string
  favicon?: string
  ogImage?: string
  emailLogo?: string
}

/**
 * Get home hero settings with fallback to defaults
 */
export async function getHomeHeroSettings(): Promise<HomeHeroSettings> {
  const defaults: HomeHeroSettings = {
    mainImage:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1920&q=85",
    videoImage: "/Deesa-Intro .mp4",
    classroomImage:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=85",
    donorImage1:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=85",
    donorImage2:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=85",
    title: "Hope for Every Child.",
    subtitle:
      "We are rewriting the future of rural Nepal through education, healthcare, and community empowerment.",
    badge: "Est. 2014 • Kathmandu",
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_hero").single()

    if (error) {
      console.error("Error fetching home hero settings:", error)
      return defaults
    }

    if (!data || !data.value) {
      return defaults
    }

    const settings = data.value as HomeHeroSettings
    
    // Merge with defaults to ensure all fields exist
    return {
      ...defaults,
      ...settings,
    }
  } catch (error) {
    console.error("Exception fetching home hero settings:", error)
    return defaults
  }
}

/**
 * Get initiative card settings with fallback to defaults
 */
export async function getInitiativeSettings(): Promise<InitiativeSettings> {
  const defaults: InitiativeSettings = {
    education: {
      title: "Rural Education",
      description:
        "Providing quality education, teacher training, and infrastructure to children in remote villages to ensure a brighter future.",
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85",
    },
    empowerment: {
      title: "Women's Empowerment",
      description:
        "Creating sustainable livelihoods through vocational training, micro-finance support, and market access for rural women.",
      image:
        "https://images.unsplash.com/photo-1607748851687-ba9a10438559?auto=format&fit=crop&w=1200&q=85",
    },
    health: {
      title: "Healthcare Access",
      description:
        "Delivering essential medical supplies, hygiene kits, and health camps to underserved communities lacking basic care.",
      image:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85",
    },
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_initiatives").single()

    if (error) {
      console.error("Error fetching initiative settings:", error)
      return defaults
    }

    if (!data || !data.value) {
      return defaults
    }

    const settings = data.value as InitiativeSettings
    
    // Merge with defaults to ensure all fields exist
    return {
      education: { ...defaults.education, ...settings.education },
      empowerment: { ...defaults.empowerment, ...settings.empowerment },
      health: { ...defaults.health, ...settings.health },
    }
  } catch (error) {
    console.error("Exception fetching initiative settings:", error)
    return defaults
  }
}

/**
 * Get hero settings for a specific page with fallback to defaults
 */
export async function getPageHeroSettings(page: string): Promise<HeroSettings> {
  const defaultHeros: Record<string, HeroSettings> = {
    about: {
      image:
        "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1920&q=85",
      title: "Our Story, Your Impact.",
      subtitle:
        "We are dedicated to bridging the gap between potential and opportunity in Nepal's most remote communities.",
      badge: "Since 2015",
      overlayOpacity: 0.6,
    },
    contact: {
      image:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=85",
      title: "Get in Touch",
      subtitle:
        "We'd love to hear from you. Reach out with questions, partnership opportunities, or just to say hello.",
      badge: "Contact Us",
      overlayOpacity: 0.7,
    },
    impact: {
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1920&q=85",
      title: "Measuring What Matters",
      subtitle: "Every number tells a story. See the real impact of your support on communities across Nepal.",
      badge: "Transparency & Results",
      overlayOpacity: 0.7,
    },
    press: {
      image:
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=85",
      title: "Press & Media Kit",
      subtitle:
        "Official brand resources, media materials, and press information for journalists, partners, and media professionals.",
      badge: "",
      overlayOpacity: 0.8,
    },
    programs: {
      image:
        "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1920&q=85",
      title: "Our Programs",
      subtitle:
        "Empowering communities through education, healthcare, and sustainable development initiatives across Nepal.",
      badge: "Active Projects",
      overlayOpacity: 0.7,
    },
    stories: {
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=85",
      title: "Stories of Change",
      subtitle:
        "Real stories from the communities we serve, showcasing the transformative power of education and empowerment.",
      badge: "Impact Stories",
      overlayOpacity: 0.7,
    },
    events: {
      image:
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1920&q=85",
      title: "Upcoming Events",
      subtitle: "Join us at our fundraising events, community gatherings, and volunteer opportunities.",
      badge: "Events & Activities",
      overlayOpacity: 0.7,
    },
    get_involved: {
      image:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=85",
      title: "Join the Movement",
      subtitle: "Be part of the change. Volunteer with us and make a lasting impact on communities in need.",
      badge: "Get Involved",
      overlayOpacity: 0.7,
    },
    donate: {
      image:
        "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1920&q=85",
      title: "Make a Difference Today",
      subtitle: "Your donation directly supports education, healthcare, and community development in rural Nepal.",
      badge: "Donate Now",
      overlayOpacity: 0.7,
    },
  }

  try {
    const supabase = await createClient()
    const key = `${page}_hero`
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).single()

    if (error || !data) {
      return defaultHeros[page] || defaultHeros.about
    }

    return data.value as HeroSettings
  } catch (error) {
    console.error(`Error fetching ${page} hero settings:`, error)
    return defaultHeros[page] || defaultHeros.about
  }
}

/**
 * Get press gallery settings with fallback to defaults
 */
export async function getPressGallerySettings(): Promise<PressGallerySettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "press_gallery").single()

    if (error || !data) {
      return {
        images: [
          {
            url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85",
            caption: "Children at school",
            credit: "Unsplash",
          },
        ],
      }
    }

    return data.value as PressGallerySettings
  } catch (error) {
    console.error("Error fetching press gallery settings:", error)
    return { images: [] }
  }
}

/**
 * Get branding assets with fallback to defaults
 */
export async function getBrandingSettings(): Promise<BrandingSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "branding").single()

    if (error || !data) {
      return {}
    }

    return data.value as BrandingSettings
  } catch (error) {
    console.error("Error fetching branding settings:", error)
    return {}
  }
}
