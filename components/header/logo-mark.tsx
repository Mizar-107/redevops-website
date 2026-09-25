import { cn } from "@/lib/utils"

/** STUB (owned by W2): viewfinder bracket pair with a play triangle. */
export function LogoMark({ className }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <path d="M9 5H5v22h4" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
      <path d="M23 5h4v22h-4" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
      <path d="M13 11l8 5-8 5z" fill="#22D3EE" />
    </svg>
  )
}
