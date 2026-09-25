import { Fragment, type CSSProperties, type ReactNode } from "react"
import { Slate } from "@/components/motion/slate"
import { SplitText } from "@/components/motion/split-text"
import { Hairline } from "@/components/motion/hairline"
import { Reveal } from "@/components/motion/reveal"
import { cn } from "@/lib/utils"
import { fms } from "@/lib/motion/tokens"
import { CALENDLY_URL, CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact"
import s from "./faq.module.css"

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

/** Words in the answers that become links, without changing the words. */
const LINKS: Record<string, { href: string; external?: boolean }> = {
  Calendly: { href: CALENDLY_URL, external: true },
  [CONTACT_EMAIL]: { href: CONTACT_MAILTO },
}

const idx = (i: number) => String(i + 1).padStart(2, "0")

/** One whitespace token. A linkable core keeps its trailing punctuation inside the same unbreakable box. */
function Token({ token }: { token: string }) {
  const m = /^(.*?)([,.;:!?)]*)$/.exec(token)
  const core = m?.[1] ?? token
  const trail = m?.[2] ?? ""
  const link = LINKS[core]
  let body: ReactNode = token
  if (link) {
    body = (
      <>
        <a
          href={link.href}
          className={s.inlineLink}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {core}
        </a>
        {trail}
      </>
    )
  }
  return <span className={s.wd}>{body}</span>
}

/**
 * The answer as subtitles: split by sentence on the server (the real text, in the SSR HTML, never
 * duplicated). Sentences stay inline so the paragraph flows normally; each word is an inline-block so
 * a whole sentence can rise as one unit (transforms don't apply to inline boxes). Sentence i starts
 * at i·f3 when its <details> opens, then never moves again.
 */
function Answer({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  return (
    <p className={s.answer}>
      {sentences.map((sentence, i) => {
        const tokens = sentence.split(" ")
        return (
          <Fragment key={i}>
            <span className={s.sent} style={{ "--sent": i } as CSSProperties}>
              {tokens.map((t, j) => (
                <Fragment key={j}>
                  <Token token={t} />
                  {j < tokens.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>
            {i < sentences.length - 1 ? " " : null}
          </Fragment>
        )
      })}
    </p>
  )
}

/**
 * FAQ: the Commentary reel, the calmest section. Server component; native <details name="faq">
 * (exclusive open where supported, independent elsewhere), so it works without JS and every answer
 * is in the SSR HTML. Nothing moves unless touched, apart from the one-time entrance.
 * The section closes on a full-bleed hairline seam: the line the final horizon field unfolds from.
 */
export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-24 md:py-32">
      <div className="shell lg:grid lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Slate section="faq" className={s.slateFit} />
          <h2 id="faq-title" className="mt-6 text-h2 text-balance text-paper">
            <SplitText text="Questions teams usually ask" delay={fms(3)} />
          </h2>
          <Reveal as="p" delay={fms(9)} className="mt-6 max-w-[34ch] text-lede text-paper-dim">
            Straight answers. Still unsure?{" "}
            <a href={CONTACT_MAILTO} className={s.ghostLink}>
              Email Recep
            </a>
            .
          </Reveal>
        </div>

        <div data-reveal="custom" className={cn(s.list, "mt-12 lg:mt-1")}>
          <span aria-hidden="true" className={s.topRule} />
          {faqs.map((f, i) => {
            const n = idx(i)
            const tc = `00:${n}:00:00`
            return (
              <div key={f.question} className={s.row} style={{ "--row": i } as CSSProperties}>
                <details name="faq" className={cn("group", s.item)}>
                  <summary className={s.summary}>
                    <span aria-hidden="true" className={s.qn}>
                      Q{n}
                    </span>
                    <span aria-hidden="true" className={s.tc}>
                      {tc}
                    </span>
                    <span className={s.question}>{f.question}</span>
                    <span aria-hidden="true" className={s.plus}>
                      <span />
                      <span />
                    </span>
                  </summary>
                  <div className={s.answerWrap}>
                    <span aria-hidden="true" className={s.rule} />
                    <Answer text={f.answer} />
                  </div>
                </details>
                <span aria-hidden="true" className={s.rowRule} />
                <span aria-hidden="true" className={s.scan} />
              </div>
            )
          })}
        </div>
      </div>
      {/* z-[2]: the next section paints later; keep the seam's glow whole on both sides of the cut */}
      <Hairline draw="center" className="absolute inset-x-0 bottom-0 z-[2]" />
    </section>
  )
}
