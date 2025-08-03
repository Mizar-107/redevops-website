import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-50">Ready to Optimize Your Cloud?</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
          Stop overspending and start building a more reliable, cost-efficient infrastructure today. Your first
          consultation is free.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild className="text-lg py-7 px-8">
            <Link href="https://calendly.com/eksiertu/30min" target="_blank">
              Schedule Your Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
