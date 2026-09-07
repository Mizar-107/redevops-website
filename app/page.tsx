import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { ResultsSection } from "@/components/results-section"
import { MidCtaSection } from "@/components/mid-cta-section"
import { ProcessSection } from "@/components/process-section"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { ParticlesBackground } from "@/components/particles-background"

export default function LandingPage() {
  return (
    <div className="bg-gray-950 text-gray-50 antialiased selection:bg-cyan-500/30">
      <ParticlesBackground />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <ServicesSection />
        <ResultsSection />
        <MidCtaSection />
        <ProcessSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
