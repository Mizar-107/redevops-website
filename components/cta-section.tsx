import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail } from "lucide-react"

const CONTACT_MAILTO =
  "mailto:eksiertu@gmail.com?subject=ReDevOps%20consultation&body=Hi%20Recep%2C%0A%0AI%27d%20like%20to%20talk%20about%20..."

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
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            asChild
            className="text-base py-6 px-8 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-xl shadow-cyan-500/20"
          >
            <Link href="https://calendly.com/eksiertu/30min" target="_blank" rel="noopener noreferrer">
              Book a free consultation <ArrowRight className="ml-2 h-5 w-5" />
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
              eksiertu@gmail.com
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
