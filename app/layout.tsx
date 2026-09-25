import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { cn } from "@/lib/utils"
import { CALENDLY_URL, CONTACT_EMAIL, SITE_URL } from "@/lib/contact"
import { MotionProvider } from "@/components/motion/motion-provider"

/**
 * Pre-paint boot (runs before first paint, before React):
 * - html.js; html[data-motion] = full | reduce (OS setting, overridden by the MOTION toggle in localStorage)
 * - html[data-intro] = play (first visit this session, motion full, no hash) | seen; any input during play → skip
 *   (Tab / modifier keys excepted, so the Skip intro button stays keyboard-reachable)
 * - window.__rdoIntro.t0 = the intro clock origin shared with CSS intro animations
 * - bfcache restores never replay the intro
 */
const BOOT = `(function(){var d=document.documentElement,m="full",i="seen";d.classList.add("js");
try{var p=localStorage.getItem("rdo:motion");var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;if(p==="off"||(rm&&p!=="on"))m="reduce"}catch(e){}
d.setAttribute("data-motion",m);
try{if(m==="full"&&!location.hash&&!sessionStorage.getItem("rdo:intro")){i="play";sessionStorage.setItem("rdo:intro","1")}}catch(e){}
d.setAttribute("data-intro",i);window.__rdoIntro={t0:performance.now(),mode:i};
if(i==="play"){var ev=["keydown","pointerdown","wheel","touchstart"],sk=function(e){if(e&&e.type==="keydown"&&/^(Tab|Shift|Control|Alt|Meta|CapsLock)$/.test(e.key))return;if(d.getAttribute("data-intro")==="play")d.setAttribute("data-intro","skip");off()},off=function(){ev.forEach(function(e){removeEventListener(e,sk,true)})};ev.forEach(function(e){addEventListener(e,sk,{capture:true,passive:true})});setTimeout(off,1500)}
addEventListener("pageshow",function(e){if(e.persisted&&d.getAttribute("data-intro")==="play")d.setAttribute("data-intro","seen")})})();`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ReDevOps | DevOps Consulting for Cloud Cost & Reliability",
    template: "%s | ReDevOps",
  },
  description:
    "ReDevOps helps growing product teams cut cloud waste, harden infrastructure, and ship with confidence. Hands-on DevOps consulting by Recep — AWS, GCP, Azure, CI/CD, and SRE.",
  keywords: [
    "DevOps consulting",
    "cloud cost optimization",
    "SRE",
    "CI/CD",
    "infrastructure reliability",
    "AWS",
    "GCP",
    "Azure",
    "ReDevOps",
  ],
  authors: [{ name: "Recep", url: SITE_URL }],
  creator: "ReDevOps",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ReDevOps",
    title: "ReDevOps | DevOps Consulting for Cloud Cost & Reliability",
    description:
      "Hands-on DevOps consulting that reduces cloud waste, improves reliability, and accelerates delivery — without disrupting your team.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReDevOps | DevOps Consulting for Cloud Cost & Reliability",
    description:
      "Hands-on DevOps consulting that reduces cloud waste, improves reliability, and accelerates delivery.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ReDevOps",
  description:
    "Hands-on DevOps consulting for cloud cost optimization, infrastructure reliability, and CI/CD.",
  url: SITE_URL,
  email: CONTACT_EMAIL,
  founder: {
    "@type": "Person",
    name: "Recep",
    email: CONTACT_EMAIL,
  },
  areaServed: "Worldwide",
  serviceType: ["DevOps consulting", "Cloud cost optimization", "SRE", "CI/CD"],
  potentialAction: {
    "@type": "ReserveAction",
    target: CALENDLY_URL,
    name: "Book a free consultation",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("dark", GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <head>
        <script id="rdo-boot" dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-screen bg-ink-950 font-sans text-paper antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-signal focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
