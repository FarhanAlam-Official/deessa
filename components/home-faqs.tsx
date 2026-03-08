"use client"

import { Section } from "@/components/ui/section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-animations"

const faqs = [
  {
    question: "What is Deessa Foundation?",
    answer:
      "Deessa Foundation is a non-profit organization based in Kathmandu, Nepal, dedicated to empowering marginalized communities through education, healthcare, shelter, and freedom programs since 2014.",
  },
  {
    question: "How can I donate to Deessa Foundation?",
    answer:
      "You can donate through our website's Donate page using various payment methods including eSewa, Khalti, and international transfers. Every contribution directly supports our programs.",
  },
  {
    question: "Can I volunteer with Deessa Foundation?",
    answer:
      "Yes! We welcome volunteers from Nepal and around the world. Visit our Get Involved page to learn about current volunteer opportunities and how you can make a difference.",
  },
  {
    question: "Where does Deessa Foundation work?",
    answer:
      "We operate across Nepal, with programs reaching 120+ villages in 25+ districts. Our main areas of focus include the Gandaki province, Kathmandu Valley, and underserved regions of the Terai.",
  },
  {
    question: "How is my donation used?",
    answer:
      "We ensure maximum impact with every donation. The majority of funds go directly to our programs — education, healthcare, shelter, and empowerment initiatives. We maintain full transparency through annual reports.",
  },
  {
    question: "Does Deessa Foundation have partnerships?",
    answer:
      "Yes, we partner with numerous national and international organizations, local communities, and government bodies to maximize our reach and impact across Nepal.",
  },
  {
    question: "How can I stay updated on Deessa's work?",
    answer:
      "Follow us on social media, subscribe to our newsletter, or listen to our podcast for regular updates on our programs, impact stories, and upcoming events.",
  },
]

export function HomeFAQs() {
  return (
    <Section className="bg-background texture-diagonal">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Find answers to common questions about Deessa Foundation and how you can get involved.
            </p>
          </div>
        </ScrollReveal>
        <Accordion type="single" collapsible className="space-y-3 accordion-smooth">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} animation="fade-up" delay={i * 80}>
              <AccordionItem
                value={`faq-${i}`}
                className="bg-muted rounded-2xl border border-border px-6 overflow-hidden data-[state=open]:border-l-4 data-[state=open]:border-l-primary transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-bold text-foreground py-5 text-base hover:no-underline [&[data-state=open]>div>.accordion-chevron]:rotate-180">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="size-5 text-primary shrink-0" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 leading-relaxed pb-5 pl-8 animate-fade-in-up">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
