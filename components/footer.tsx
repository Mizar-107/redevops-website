import Link from "next/link"
import { Code, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-cyan-400" />
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} ReDevOps. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" prefetch={false}>
            <Github className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" prefetch={false}>
            <Twitter className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" prefetch={false}>
            <Linkedin className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
