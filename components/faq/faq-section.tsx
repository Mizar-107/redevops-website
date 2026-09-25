import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Hairline } from "@/components/motion/hairline"
import { CONTACT_MAILTO } from "@/lib/contact"

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

/** STUB (owned by W8). */
export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-24 md:py-32">
      <div className="shell lg:grid lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <Slate section="faq" />
          <h2 id="faq-title" className="mt-6 text-h2 text-balance">
            <SplitText text="Questions teams usually ask" />
          </h2>
          <p className="mt-6 text-lede text-paper-dim">
            Straight answers. Still unsure?{" "}
            <a href={CONTACT_MAILTO} className="text-signal underline-offset-4 hover:underline">
              Email Recep
            </a>
            .
          </p>
        </div>
        <div className="mt-10 lg:mt-0">
          {faqs.map((f, i) => (
            <details key={f.question} name="faq" className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-baseline gap-4 py-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-hud text-paper-mute">Q0{i + 1}</span>
                {f.question}
              </summary>
              <p className="pb-6 text-paper-dim">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <Hairline draw="center" className="absolute inset-x-0 bottom-0" />
    </section>
  )
}
