/** Shared contact + CTA constants for the marketing site. */

export const SITE_URL = "https://redevops.dev"
export const CONTACT_EMAIL = "eksiertu@gmail.com"
export const CALENDLY_URL = "https://calendly.com/eksiertu/30min"

export const PRIMARY_CTA_LABEL = "Book a free consultation"
export const PRIMARY_CTA_LABEL_SHORT = "Book free consult"

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "ReDevOps consultation",
)}&body=${encodeURIComponent("Hi Recep,\n\nI'd like to talk about ...")}`

export const CALL_EXPECTATIONS = [
  "Clarify the biggest cost, reliability, or delivery pain",
  "Leave with a concrete next step — whether we work together or not",
  "No pitch deck; 30 minutes, focused on your stack",
] as const
