import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const siteUrl = "https://redevops.dev"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  authors: [{ name: "Recep", url: siteUrl }],
  creator: "ReDevOps",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
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
    canonical: siteUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>{children}</body>
    </html>
  )
}
