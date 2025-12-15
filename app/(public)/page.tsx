import Image from "next/image"
import Link from "next/link"
import { Heart, ArrowRight, GraduationCap, Users, MapPin, Stethoscope, UserRoundCheck, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/ui/section"
import { InitiativeCard } from "@/components/ui/initiative-card"
import { ProjectCard } from "@/components/ui/project-card"
import { getFeaturedProjects } from "@/lib/data/projects"

export default async function HomePage() {
  const projects = await getFeaturedProjects(3)

  return (
    <>
      {/* Hero Section */}
      <section className="w-full pt-8 pb-16 lg:pt-16 lg:pb-24 px-4 md:px-8 bg-background">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="text-primary font-bold tracking-widest uppercase text-xs">Est. 2014 • Kathmandu</span>
            </div>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-foreground leading-[1.05] tracking-tight text-balance">
              Hope for{" "}
              <span className="relative inline-block text-primary">
                Every
                <svg
                  className="absolute w-full h-3 bottom-1 left-0 text-primary/20 -z-10"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="12" />
                </svg>
              </span>{" "}
              Child.
            </h1>
            <p className="text-lg md:text-xl text-foreground-muted leading-relaxed font-medium max-w-lg text-pretty">
              We are rewriting the future of rural Nepal through education, healthcare, and community empowerment.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button asChild size="lg" className="rounded-full h-14 px-8 shadow-lg shadow-primary/25">
                <Link href="/donate">
                  Start Donating
                  <Heart className="ml-2 size-5 fill-current" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 bg-transparent">
                <Link href="/about">How We Work</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-border">
              <div className="flex -space-x-3">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7QgNEezbRHOt2MsvhmSehLCgOGp-3Um_oszh8418RlOSNyKzKOAhE5NsQkDGMiBytNLDU2yZh9PPHBg-AYg6BmnCa9iG8LQBC0_lkUqCrL4pJFU_So2-85IGkW34ZrQ6498mPet2J-ZYQLaHBN8o5wxwRN8c0jN5NXm81cUsCLvJIGZ-VL3p_FnKi-Nyw5LH9A9KrRzWbDzOsq255qtzgFx6N2X4ExaQ3QQWfCMH4LB-YcibEcm4plH8CXVi_GIywspD8opz3dl4"
                  alt="Donor"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-surface object-cover"
                />
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQzzIOZUDnI5i7x-Rnn2k4ELK3S1FCIb1F3EuSFxtUqWmskQ7-5WPPojjO-T1yebP4Zhgg-uFd3t4Hk6CSc5nT8xIoOsyxdpIQ5Zdyxboo1c4wL5UnBVoj1rY4vRO86yiTlhaheV6-PfvhGGWJWJVIHXp1jIfy84HkXDw5ZCKpkYujNgDoTCeJwKQNjZ9iLg_m-F0RkpFyF8pqHdtB7ydd2rNkidpGit3y_RPVuumO4GIzMhRneQ5STuJRSxMxhAG6TYvZBSVKoz4"
                  alt="Donor"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-surface object-cover"
                />
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-muted flex items-center justify-center text-xs font-bold text-foreground-muted">
                  +2k
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground-muted">
                Join 2,000+ monthly donors making a difference.
              </p>
            </div>
          </div>

          {/* Right Content - Image Grid */}
          <div className="lg:col-span-7 relative">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-100 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
            <div className="grid grid-cols-12 gap-4 h-full relative z-10">
              <div className="col-span-8 space-y-4">
                <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl h-[400px] lg:h-[500px]">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7xPA5ZcI6zKmXhschYT9kJF4AqJ9KYyAa5qyutl1ZWv5adO6OvYLgL0wZmsSvQmp5iq8EBildkvodJmW6nQOiy52WDTtHveVZgJcxx0_cw_pXOEkv2E8ngXc8S6exY0flcsgm65QruhCVLREAaOyUXoPaJssWLYw4Gq3TRXCA6np2SOBQgIml3lxCiJQAcTos1hfbuZ1VmD0z_I8NvTTPYtKaIPbfibEi2YEU4fAP01FwBiwW62SkaoM5YiSpdS6RRW8rx6YqKo8"
                    alt="Happy Nepali children"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Impact Story</p>
                    <p className="text-sm font-semibold text-foreground">Providing books to 500+ students in Gorkha.</p>
                  </div>
                </div>
              </div>
              <div className="col-span-4 space-y-4 pt-12">
                <div className="relative rounded-[2rem] overflow-hidden shadow-xl aspect-[3/4] group">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M"
                    alt="Women weaving"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-white font-bold text-sm">Skills</span>
                </div>
                <div className="relative rounded-[2rem] overflow-hidden shadow-xl aspect-square group">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVUER9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI"
                    alt="Classroom"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-16 border-y border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-surface p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <GraduationCap className="size-10 text-primary mb-4 relative z-10" />
              <div className="flex flex-col relative z-10">
                <span className="text-4xl font-black text-foreground tracking-tight">50+</span>
                <span className="text-sm font-bold text-foreground-muted uppercase tracking-wide mt-1">
                  Schools Built
                </span>
              </div>
            </div>
            <div className="bg-surface p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <Users className="size-10 text-blue-500 mb-4 relative z-10" />
              <div className="flex flex-col relative z-10">
                <span className="text-4xl font-black text-foreground tracking-tight">10k+</span>
                <span className="text-sm font-bold text-foreground-muted uppercase tracking-wide mt-1">
                  Lives Impacted
                </span>
              </div>
            </div>
            <div className="bg-surface p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <MapPin className="size-10 text-green-500 mb-4 relative z-10" />
              <div className="flex flex-col relative z-10">
                <span className="text-4xl font-black text-foreground tracking-tight">120</span>
                <span className="text-sm font-bold text-foreground-muted uppercase tracking-wide mt-1">
                  Villages Reached
                </span>
              </div>
            </div>
            <div className="bg-primary p-8 rounded-3xl shadow-lg flex flex-col justify-center items-start text-white relative overflow-hidden">
              <svg
                className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="font-bold text-xl mb-2">Be part of the stats</span>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                Your contribution adds to these numbers every single day.
              </p>
              <Button asChild variant="secondary" size="sm" className="rounded-full z-10">
                <Link href="/get-involved">Get Involved</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Initiatives Section */}
      <Section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Our Key Initiatives</h2>
            <p className="text-foreground-muted text-lg">
              We focus on holistic community development, creating sustainable ecosystems for growth.
            </p>
          </div>
          <Link
            href="/programs"
            className="group flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors"
          >
            View All Programs
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InitiativeCard
            title="Rural Education"
            description="Providing quality education, teacher training, and infrastructure to children in remote villages to ensure a brighter future."
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBmzOd9EzUlZkbuXEdlrotwYaDKUdIoq7etYPho3JMYsWZZcml-2Ntzj9cDdMOcO_GbE9La2Jq5GKGewwQ2Ousghkb6a8TYJ99fkfg2mqMwY_gBODE6RIBn5hn82xionJLCGc111edDh08deMwKzbRmyp5QebA1DpEedy6mRKGROhkEeBfSL2LrG-mHp1IR2YMBRVUER9NbBpCfJlC8WsU9U6Cu6zeVR1ACSJrfaWZTJ_ANEJYlR7oAG3lT40lHsF6JWKCLeO4zJEI"
            icon={GraduationCap}
            href="/programs?category=education"
          />
          <InitiativeCard
            title="Women's Empowerment"
            description="Creating sustainable livelihoods through vocational training, micro-finance support, and market access for rural women."
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBIbSVU06T05e97h5HGkLrHkYStnbYQkwzmRg7ALv-ZL5hNuclSRAIiEtnFyuI9cRH-YMtR-pZure02gYDVPziahnspKrlKVKaXMbZwUUn87yG0Efk7pm2WexkU4XJGmqjWZamzPnj45Hun2vsvOwqa0lUsvGBO1uGIZ796D8JQqWkcR3tIdmjcm6xeqh8ifKgxRXTvLl4uX2mp4jPYf579vKODNowVZQ9m6SJr6u6huslju1OStRG3SpoUa0QzyBJa-hz5q4oOb7M"
            icon={UserRoundCheck}
            href="/programs?category=empowerment"
          />
          <InitiativeCard
            title="Healthcare Access"
            description="Delivering essential medical supplies, hygiene kits, and health camps to underserved communities lacking basic care."
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuAxrqVdNPir00ETd2JGAA3WauwEortBglt0nkjxKl-h1paBM8Lyf8gz6ZR4jzKuqxDhy5hTLRwtxzQGVqQoNW0iDyruM6dQ0ZJzvKo3Ul_O7O6CGv2qaWbeX2RzxfwhD248WORkY1xyktY_CVlEGlyrGv9UOwjrkFMThkGr5zsMsLSNZ4wH837KT5JEXn_tHHCHeZebXhKoJ-IMW4tdrCoYqZKnL_dpOwtXj87UDokTrTFsT_PjSxzMkB0rLOgesdoaMY37jp_YqQg"
            icon={Stethoscope}
            href="/programs?category=health"
          />
        </div>
      </Section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-white relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ea2a33 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Take Action</span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-balance">
                Your Support Transforms Lives
              </h2>
              <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
                Every donation goes directly to communities in need. Together, we can create lasting change in Nepal.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full h-14 px-8">
                  <Link href="/donate">
                    Donate Now
                    <Heart className="ml-2 size-5 fill-current" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full h-14 px-8 bg-transparent border-gray-600 text-white hover:bg-white hover:text-foreground"
                >
                  <Link href="/get-involved">Become a Volunteer</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              {[
                { amount: "$25", impact: "School supplies for 5 kids" },
                { amount: "$50", impact: "Medical checkup for a village" },
                { amount: "$100", impact: "Teacher training workshop" },
              ].map((item) => (
                <div
                  key={item.amount}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="text-3xl font-black text-primary mb-2">{item.amount}</div>
                  <p className="text-sm text-gray-300">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Current Projects Section - Updated to use database projects */}
      <Section className="bg-muted">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Our Initiatives</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">Current Projects</h2>
          </div>
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/programs">View All Projects</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                image={project.image}
                icon={
                  project.category === "education"
                    ? GraduationCap
                    : project.category === "health"
                      ? Stethoscope
                      : project.category === "empowerment"
                        ? UserRoundCheck
                        : MapPin
                }
                iconColor={
                  project.category === "education"
                    ? "text-primary"
                    : project.category === "health"
                      ? "text-green-600"
                      : project.category === "empowerment"
                        ? "text-purple-600"
                        : "text-orange-600"
                }
                location={project.location}
                category={project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                status={project.status}
                raised={project.raised}
                goal={project.goal}
                metrics={project.metrics}
                href={`/programs/${project.slug}`}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-foreground-muted">
              <p>No projects available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </Section>

      {/* Newsletter Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <Mail className="size-16 mb-6 text-white/80 mx-auto" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-balance">Join Our Community</h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive updates on our projects, impact stories, and opportunities to get
            involved.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              required
              className="flex-grow h-14 px-6 rounded-full text-foreground border-0 focus:ring-4 focus:ring-white/30"
            />
            <Button type="submit" variant="secondary" size="lg" className="h-14 px-8 rounded-full">
              Subscribe Now
            </Button>
          </form>
        </div>
      </section>
    </>
  )
}
