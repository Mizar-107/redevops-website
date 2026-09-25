import { ColdOpen } from "@/components/cold-open/cold-open"
import { Header } from "@/components/header/header"
import { HeroSection } from "@/components/hero/hero-section"
import { ServicesSection } from "@/components/reel/services-section"
import { ResultsSection } from "@/components/results/results-section"
import { MidCtaSection } from "@/components/intermission/mid-cta-section"
import { ProcessSection } from "@/components/process/process-section"
import { FaqSection } from "@/components/faq/faq-section"
import { CtaSection } from "@/components/final/cta-section"
import { Footer } from "@/components/footer/footer"
import { ChromeLayer } from "@/components/chrome/chrome-layer"

export default function LandingPage() {
  return (
    <>
      <ColdOpen />
      {/* fixed chrome (grain, scrub OSD, MOTION pill) sits early in the DOM so the MOTION toggle is an
          early Tab stop for motion-sensitive visitors */}
      <ChromeLayer />
      <Header />
      <main id="main" tabIndex={-1} className="relative outline-none">
        <HeroSection />
        <ServicesSection />
        <ResultsSection />
        <MidCtaSection />
        <ProcessSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
