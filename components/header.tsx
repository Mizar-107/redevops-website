"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#results", label: "Results" },
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
        isScrolled ? "bg-gray-950/80 backdrop-blur-lg border-b border-gray-800" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="#home"
          className="flex items-center gap-2 font-bold text-lg"
          onClick={(e) => handleNavClick(e, "#home")}
          prefetch={false}
        >
          <Code className="h-6 w-6 text-cyan-400" />
          <span>ReDevOps</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
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
        <div className="hidden md:block">
          <Button asChild>
            <Link href="https://calendly.com/eksiertu/30min" target="_blank">
              Schedule a Call
            </Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden bg-transparent">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-950/90 border-gray-800">
            <div className="grid gap-4 p-4">
              <SheetClose asChild>
                <Link href="#home" className="flex items-center gap-2 font-bold text-lg" prefetch={false}>
                  <Code className="h-6 w-6 text-cyan-400" />
                  <span>ReDevOps</span>
                </Link>
              </SheetClose>
              <nav className="grid gap-2 mt-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-lg font-medium hover:text-cyan-400 transition-colors py-2"
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <Button asChild className="w-full mt-4">
                <Link href="https://calendly.com/eksiertu/30min" target="_blank">
                  Schedule a Call
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
