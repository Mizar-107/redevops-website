/**
 * The section registry. Drives the header nav, the scroll indicator and every section label.
 * Section numbering must never be hard-coded anywhere else.
 */
export type SectionId = "home" | "services" | "results" | "intermission" | "process" | "faq" | "final" | "credits"

export type SectionMeta = { id: SectionId; num: string; name: string; cut: string; nav?: string }

export const SECTIONS: readonly SectionMeta[] = [
  { id: "home", num: "", name: "Home", cut: "" },
  { id: "services", num: "01", name: "Services", cut: "What we do", nav: "Services" },
  { id: "results", num: "02", name: "Outcomes", cut: "What changes", nav: "Outcomes" },
  { id: "intermission", num: "", name: "Free consult", cut: "30 minutes" },
  { id: "process", num: "03", name: "Process", cut: "How it works", nav: "Process" },
  { id: "faq", num: "04", name: "FAQ", cut: "Straight answers", nav: "FAQ" },
  { id: "final", num: "05", name: "Get started", cut: "Book a call" },
  { id: "credits", num: "", name: "At a glance", cut: "" },
]

export const NAV = SECTIONS.filter((s) => s.nav).map((s) => ({
  id: s.id,
  href: `#${s.id}`,
  label: s.nav!,
  num: s.num,
}))

export const section = (id: SectionId) => SECTIONS.find((s) => s.id === id)!

/** "01 / SERVICES" style label; unnumbered sections show just their name. */
export const sectionLabel = (id: SectionId) => {
  const s = section(id)
  return s.num ? `${s.num} / ${s.name.toUpperCase()}` : s.name.toUpperCase()
}
