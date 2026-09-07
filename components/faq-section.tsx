import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"

const faqs = [
  {
    question: "How fast will we see improvements?",
    answer:
      "It depends on your starting point. Many teams unlock quick wins (obvious idle spend, noisy alerts, brittle pipeline stages) within the first few weeks. Deeper reliability and delivery work usually lands over a short engagement with clear milestones — we set expectations on the first call.",
  },
  {
    question: "Will this disrupt our development workflow?",
    answer:
      "No. We design changes to run alongside your roadmap: small, reviewable steps, clear communication, and integration with the tools you already use. Product shipping stays the priority.",
  },
  {
    question: "What if we already have a DevOps or platform engineer?",
    answer:
      "Even better. ReDevOps works as a specialist partner — cost deep-dives, SRE practices, CI/CD hardening — so your existing engineer can stay focused on product-facing work while we tackle the thornier infrastructure problems together.",
  },
  {
    question: "Which clouds and stacks do you support?",
    answer:
      "AWS, Google Cloud, and Azure are all in scope, along with common Kubernetes, container, and CI platforms. The principles of lean spend and reliable delivery transfer; we adapt to your stack instead of forcing a rewrite.",
  },
  {
    question: "How do we get started?",
    answer:
      "Book a free 30-minute consultation on Calendly, or email eksiertu@gmail.com with a short note about your stack and what hurts most (cost, reliability, or delivery). We will reply with next steps.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">Questions teams usually ask</h2>
          <p className="mt-4 text-lg text-gray-400">
            Straight answers. Still unsure?{" "}
            <Link
              href="mailto:eksiertu@gmail.com?subject=ReDevOps%20question"
              className="text-cyan-400 hover:underline underline-offset-4"
            >
              Email Recep
            </Link>
            .
          </p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-gray-800">
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-cyan-400 hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 text-base leading-relaxed pb-5">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
