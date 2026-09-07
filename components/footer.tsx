import Link from "next/link"
import { Code2, Mail } from "lucide-react"

const footerLinks = [
  { href: "#services", label: "Services" },
  { href: "#results", label: "Outcomes" },
  { href: "#process", label: "Process" },
  { href: "#faq", label: "FAQ" },
]

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/80">
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-cyan-400/30">
                <Code2 className="h-4 w-4 text-cyan-400" />
              </span>
              <span>
                Re<span className="text-cyan-400">Dev</span>Ops
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hands-on DevOps consulting by Recep — cloud cost, reliability, and delivery for growing product teams.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                prefetch={false}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="mailto:eksiertu@gmail.com?subject=ReDevOps%20consultation"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition-colors"
          >
            <Mail className="h-4 w-4" />
            eksiertu@gmail.com
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} ReDevOps. All rights reserved.</p>
          <p className="text-xs text-gray-600">Built for clarity — no fake logos, no invented metrics.</p>
        </div>
      </div>
    </footer>
  )
}
