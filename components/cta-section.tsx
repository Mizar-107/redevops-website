import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Mail } from "lucide-react"
import {
  CALENDLY_URL,
  CALL_EXPECTATIONS,
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  PRIMARY_CTA_LABEL,
} from "@/lib/contact"

export function CtaSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-purple-500/15"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
      />
      <div className="container relative mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-50 text-balance">
          Ready for calmer infrastructure and clearer spend?
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300 text-pretty">
          Tell us where it hurts — cost, reliability, or delivery. Your first consultation is free, and you will leave
          with a concrete next step either way.
        </p>
        <ul className="mt-8 mx-auto max-w-xl space-y-3 text-left">
          {CALL_EXPECTATIONS.map((item) => (
            <li key={item} className="flex gap-3 text-gray-300 text-sm md:text-base leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 ring-1 ring-cyan-400/30">
                <Check className="h-3 w-3 text-cyan-400" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            asChild
            className="text-base py-6 px-8 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-xl shadow-cyan-500/20"
          >
            <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              {PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="text-base py-6 px-8 border-gray-600 bg-gray-950/50 hover:bg-gray-900"
          >
            <Link href={CONTACT_MAILTO}>
              <Mail className="mr-2 h-5 w-5" />
              {CONTACT_EMAIL}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
