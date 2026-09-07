"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, Menu, Mail } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

const CONTACT_MAILTO =
  "mailto:eksiertu@gmail.com?subject=ReDevOps%20consultation&body=Hi%20Recep%2C%0A%0AI%27d%20like%20to%20talk%20about%20..."

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#results", label: "Outcomes" },
  { href: "#process", label: "Process" },
  { href: "#faq", label: "FAQ" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault()
    const targetId = href.replace(/.*#/, "")
    const elem = document.getElementById(targetId)
    elem?.scrollIntoView({
      behavior: "smooth",
    })
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-gray-950/85 backdrop-blur-xl border-b border-gray-800/80 shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="#home"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
          onClick={(e) => handleNavClick(e, "#home")}
          prefetch={false}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-cyan-400/30">
            <Code2 className="h-4 w-4 text-cyan-400" />
          </span>
          <span>
            Re<span className="text-cyan-400">Dev</span>Ops
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-cyan-400">
            <Link href={CONTACT_MAILTO}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Link>
          </Button>
          <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold shadow-lg shadow-cyan-500/20">
            <Link href="https://calendly.com/eksiertu/30min" target="_blank" rel="noopener noreferrer">
              Book a call
            </Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden bg-transparent border-gray-700">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-950/95 border-gray-800">
            <div className="grid gap-4 p-4">
              <SheetClose asChild>
                <Link href="#home" className="flex items-center gap-2.5 font-bold text-lg" prefetch={false}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-cyan-400/30">
                    <Code2 className="h-4 w-4 text-cyan-400" />
                  </span>
                  <span>
                    Re<span className="text-cyan-400">Dev</span>Ops
                  </span>
                </Link>
              </SheetClose>
              <nav className="grid gap-1 mt-4" aria-label="Mobile">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-lg font-medium hover:text-cyan-400 transition-colors py-2.5 border-b border-gray-800/60"
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <Button asChild className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold">
                <Link href="https://calendly.com/eksiertu/30min" target="_blank" rel="noopener noreferrer">
                  Book a call
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-gray-700">
                <Link href={CONTACT_MAILTO}>Email Recep</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
