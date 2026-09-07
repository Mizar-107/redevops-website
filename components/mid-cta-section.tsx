import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"
import {
  CALENDLY_URL,
  CALL_EXPECTATIONS,
  CONTACT_MAILTO,
  PRIMARY_CTA_LABEL,
} from "@/lib/contact"

export function MidCtaSection() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="mid-cta-heading">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 px-6 py-10 md:px-12 md:py-12 backdrop-blur-sm">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">
                Free 30-minute consult
              </p>
              <h2
                id="mid-cta-heading"
                className="text-2xl md:text-3xl font-bold tracking-tight text-balance text-gray-50"
              >
                See if ReDevOps is the right fit — in one call
              </h2>
              <ul className="mt-6 space-y-3">
                {CALL_EXPECTATIONS.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-300 text-sm md:text-base leading-relaxed">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 ring-1 ring-cyan-400/30">
                      <Check className="h-3 w-3 text-cyan-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button
                size="lg"
                asChild
                className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-xl shadow-cyan-500/20"
              >
                <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  {PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-gray-700 bg-gray-950/40 hover:bg-gray-900"
              >
                <Link href={CONTACT_MAILTO}>Prefer email? Write Recep</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
