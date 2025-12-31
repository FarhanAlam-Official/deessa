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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7xPA5ZcI6zKmXhschYT9kJF4AqJ9KYyAa5qyutl1ZWv5adO6OvYLgL0wZmsSvQmp5iq8EBildkvodJmW6nQOiy52WDTtHveVZgJcxx0_cw_pXOEkv2E8ngXc8S6exY0flcsgm65QruhCVLREAaOyUXoPaJssWLYw4Gq3TRXCA6np2SOBQgIml3lxCiJQAcTos1hfbuZ1VmD0z_I8NvTTPYtKaIPbfibEi2YEU4fAP01FwBiwW62SkaoM5YiSpdS6RRW8rx6YqKo8",
    videoImage: "/Deesa-Intro .mp4",
    classroomImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVEUR9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI",
    donorImage1:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgNEezbRHOt2MsvhmSehLCgOGp-3Um_oszh8418RlOSNyKzKOAhE5NsQkDGMiBytNLDU2yZh9PPHBg-AYg6BmnCa9iG8LQBC0_lkUqCrL4pJFU_So2-85IGkW34ZrQ6498mPet2J-ZYQLaHBN8o5wxwRN8c0jN5NXm81cUsCLvJIGZ-VL3p_FnKi-Nyw5LH9A9KrRzWbDzOsq255qtzgFx6N2X4ExaQ3QQWfCMH4LB-YcibEcm4plH8CXVi_GIywspD8opz3dl4",
    donorImage2:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQzzIOZUDnI5i7x-Rnn2k4ELK3S1FCIb1F3EuSFxtUqWmskQ7-5WPPojjO-T1yebP4Zhgg-uFd3t4Hk6CSc5nT8xIoOsyxdpIQ5Zdyxboo1c4wL5UnBVoj1rY4vRO86yiTlhaheV6-PfvhGGWJWJVIHXp1jIfy84HkXDw5ZCKpkYujNgDoTCeJwKQNjZ9iLg_m-F0RkpFyF8pqHdtB7ydd2rNkidpGit3y_RPVuumO4GIzMhRneQ5STuJRSxMxhAG6TYvZBSVKoz4",
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
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVEUR9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI",
    },
    empowerment: {
      title: "Women's Empowerment",
      description:
        "Creating sustainable livelihoods through vocational training, micro-finance support, and market access for rural women.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M",
    },
    health: {
      title: "Healthcare Access",
      description:
        "Delivering essential medical supplies, hygiene kits, and health camps to underserved communities lacking basic care.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAxrqVdNPir00ETd2JGAA3WauwEortBglt0nkjxKl-h1paBM8Lyf8gz6ZR4jzKuqxDhy5hTLRwtxzQGVqQoNW0iDyruM6dQ0ZJzvKo3Ul_O7O6CGv2qaWbeX2RzxfwhD248WORkY1xyktY_CVlEGlyrGv9UOwjrkFMThkGr5zsMsLSNZ4wH837KT5JEXn_tHHCHeZebXhKoJ-IMW4tdrCoYqZKnL_dpOwtXj87UDokTrTFsT_PjSxzMkB0rLOgesdoaMY37jp_YqQg",
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
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek",
      title: "Our Story, Your Impact.",
      subtitle:
        "We are dedicated to bridging the gap between potential and opportunity in Nepal's most remote communities.",
      badge: "Since 2015",
      overlayOpacity: 0.6,
    },
    contact: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek",
      title: "Get in Touch",
      subtitle:
        "We'd love to hear from you. Reach out with questions, partnership opportunities, or just to say hello.",
      badge: "Contact Us",
      overlayOpacity: 0.7,
    },
    impact: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD7xPA5ZcI6zKmXhschYT9kJF4AqJ9KYyAa5qyutl1ZWv5adO6OvYLgL0wZmsSvQmp5iq8EBildkvodJmW6nQOiy52WDTtHveVZgJcxx0_cw_pXOEkv2E8ngXc8S6exY0flcsgm65QruhCVLREAaOyUXoPaJssWLYw4Gq3TRXCA6np2SOBQgIml3lxCiJQAcTos1hfbuZ1VmD0z_I8NvTTPYtKaIPbfibEi2YEU4fAP01FwBiwW62SkaoM5YiSpdS6RRW8rx6YqKo8",
      title: "Measuring What Matters",
      subtitle: "Every number tells a story. See the real impact of your support on communities across Nepal.",
      badge: "Transparency & Results",
      overlayOpacity: 0.7,
    },
    press: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC5xzHfv2hii0hZm5knPtqnBhBXuF43kiNX-3L6bPoaNWoNJhuaBEp0UnvkJbxD_8jxmQHLjE0b1j-TMOJq_VOIrW9983EZgYM46P8MAwn7PzfzaLz2HsWKlKvt5lKXcXf_b6vms2V8NcnXaz9-_X8SNQsr6s7_GyimSfmkpcQ4Oh5YRcHnl1A7tisgSR5H6pZkE2H_RJ7Ed4vN8OmKIZ2WhCp5LlGraRVM17Ryo2wWWdRDFec31aYUj8Kv479a7Hlv2NIwScl7Eek",
      title: "Press & Media Kit",
      subtitle:
        "Official brand resources, media materials, and press information for journalists, partners, and media professionals.",
      badge: "",
      overlayOpacity: 0.8,
    },
    programs: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVEUR9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI",
      title: "Our Programs",
      subtitle:
        "Empowering communities through education, healthcare, and sustainable development initiatives across Nepal.",
      badge: "Active Projects",
      overlayOpacity: 0.7,
    },
    stories: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTfMn_PUEG4a1KDj3AFMHXBF1v_IJPW_L720huR7TChJeC5GpxHiQIqSHbrGSrcp7nbhNBqmHrOtfAwfOePW7deVTdhaqpW9p3RuHgNWAaKtVKLkIVbiWRgojNvsMTnh7gQw0ytUKGCw2fZw_ZCNSf3DABKQ7s4kl0MYDHj3Y3_zDUqnE6KaHOJPfh_OZjDEN7-qS3tWy0Q_pbCovZMi9z9WOr4xOlN35tu7iETQHqyap9HmtH3siRVhxHBPN6UM6hAxeHRSMP37E",
      title: "Stories of Change",
      subtitle:
        "Real stories from the communities we serve, showcasing the transformative power of education and empowerment.",
      badge: "Impact Stories",
      overlayOpacity: 0.7,
    },
    events: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBoKtoVTzruG6gKPDBqOFn6sXswEYs8YYbbG-v2EGGbhON2BpX02eVTPd9aoriL-9H1k8EWyvMyMiwPmvaRMSjdeJUI22Exlld48BQpEVZF0JAPxSpPZAVgHGo0rs7nkFc9Ff6XNHjcFZ5OjqBG7dowxzlznYZOyA9Hmu0FFXggZzZJxb_rUB4DCTIE2YUpBthpEBpFDueXipv0tdyxcjGMwiC3QxRcbb57ENMyuIclrSbreZw2mTW7GZCg58sODpQxFtTkacxKPCo",
      title: "Upcoming Events",
      subtitle: "Join us at our fundraising events, community gatherings, and volunteer opportunities.",
      badge: "Events & Activities",
      overlayOpacity: 0.7,
    },
    get_involved: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M",
      title: "Join the Movement",
      subtitle: "Be part of the change. Volunteer with us and make a lasting impact on communities in need.",
      badge: "Get Involved",
      overlayOpacity: 0.7,
    },
    donate: {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgNEezbRHOt2MsvhmSehLCgOGp-3Um_oszh8418RlOSNyKzKOAhE5NsQkDGMiBytNLDU2yZh9PPHBg-AYg6BmnCa9iG8LQBC0_lkUqCrL4pJFU_So2-85IGkW34ZrQ6498mPet2J-ZYQLaHBN8o5wxwRN8c0jN5NXm81cUsCLvJIGZ-VL3p_FnKi-Nyw5LH9A9KrRzWbDzOsq255qtzgFx6N2X4ExaQ3QQWfCMH4LB-YcibEcm4plH8CXVi_GIywspD8opz3dl4",
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
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7xPA5ZcI6zKmXhschYT9kJF4AqJ9KYyAa5qyutl1ZWv5adO6OvYLgL0wZmsSvQmp5iq8EBildkvodJmW6nQOiy52WDTtHveVZgJcxx0_cw_pXOEkv2E8ngXc8S6exY0flcsgm65QruhCVLREAaOyUXoPaJssWLYw4Gq3TRXCA6np2SOBQgIml3lxCiJQAcTos1hfbuZ1VmD0z_I8NvTTPYtKaIPbfibEi2YEU4fAP01FwBiwW62SkaoM5YiSpdS6RRW8rx6YqKo8",
            caption: "Children at school",
            credit: "deessa Foundation",
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
