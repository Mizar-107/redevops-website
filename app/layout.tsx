import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { CALENDLY_URL, CONTACT_EMAIL, SITE_URL } from "@/lib/contact"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

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
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
