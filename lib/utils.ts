import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge must know the custom type-scale tokens (tailwind.config.js fontSize), otherwise it
 * classifies `text-hud` / `text-h2` … as text colours and silently drops them next to `text-paper`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h2", "h3", "h3-sm", "lede", "body", "slate", "hud", "numeral"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
