/**
 * The reel registry. Drives the header nav, the scrub OSD and every slate.
 * Section numbering must never be hard-coded anywhere else.
 */
export type SectionId = "home" | "services" | "results" | "intermission" | "process" | "faq" | "final" | "credits"

export type SectionMeta = { id: SectionId; reel: string; name: string; cut: string; nav?: string }

export const SECTIONS: readonly SectionMeta[] = [
  { id: "home", reel: "01", name: "Title", cut: "Cold open" },
  { id: "services", reel: "02", name: "Services", cut: "The work", nav: "Services" },
  { id: "results", reel: "03", name: "Outcomes", cut: "Aftermath", nav: "Outcomes" },
  { id: "intermission", reel: "—", name: "Intermission", cut: "Free 30-minute consult" },
  { id: "process", reel: "04", name: "Process", cut: "The edit", nav: "Process" },
  { id: "faq", reel: "05", name: "FAQ", cut: "Commentary", nav: "FAQ" },
  { id: "final", reel: "06", name: "Final cut", cut: "Book" },
  { id: "credits", reel: "END", name: "Credits", cut: "End of reel" },
]

export const NAV = SECTIONS.filter((s) => s.nav).map((s) => ({
  id: s.id,
  href: `#${s.id}`,
  label: s.nav!,
  reel: s.reel,
}))

export const section = (id: SectionId) => SECTIONS.find((s) => s.id === id)!

/** "REEL 02 · SERVICES" style label; non-numeric reels ("—", "END") drop the REEL prefix. */
export const reelLabel = (id: SectionId) => {
  const s = section(id)
  return /^\d+$/.test(s.reel) ? `REEL ${s.reel} · ${s.name.toUpperCase()}` : s.name.toUpperCase()
}
