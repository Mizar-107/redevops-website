const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // THROUGHLINE palette (dark-only site)
        ink: { 950: "#05060A", 900: "#0A0D14", 850: "#0E121B" },
        line: { DEFAULT: "#1C2230", strong: "#2A3242" },
        paper: { DEFAULT: "#ECEFF4", dim: "#9AA3B2", mute: "#5D6677" },
        signal: { DEFAULT: "#22D3EE", hot: "#7CF4FF", deep: "#0E7490" },
        violet: { DEFAULT: "#8B5CF6" },
        tungsten: { DEFAULT: "#FFB547" },
        alarm: { DEFAULT: "#FF4D5E" },
        go: { DEFAULT: "#34D399" },
        // shadcn semantic colours
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        display: [
          "clamp(2.6rem, 1.2rem + 6vw, 7.5rem)",
          { lineHeight: "0.92", letterSpacing: "-0.045em", fontWeight: "680" },
        ],
        h2: ["clamp(2.25rem, 1.35rem + 3.4vw, 4.5rem)", { lineHeight: "0.98", letterSpacing: "-0.035em", fontWeight: "640" }],
        h3: ["clamp(1.5rem, 1.1rem + 1.6vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "640" }],
        "h3-sm": ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        lede: ["clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)", { lineHeight: "1.6", letterSpacing: "-0.005em", fontWeight: "400" }],
        body: ["1rem", { lineHeight: "1.65", letterSpacing: "0", fontWeight: "400" }],
        slate: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.18em", fontWeight: "500" }],
        hud: ["0.625rem", { lineHeight: "1.2", letterSpacing: "0.14em", fontWeight: "500" }],
        numeral: ["clamp(4rem, 10vw, 9rem)", { lineHeight: "0.85", letterSpacing: "-0.04em", fontWeight: "300" }],
      },
      transitionTimingFunction: {
        title: "cubic-bezier(0.16, 1, 0.3, 1)",
        cut: "cubic-bezier(0.76, 0, 0.24, 1)",
        iris: "cubic-bezier(0.87, 0, 0.13, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)",
        clap: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        drift: "cubic-bezier(0.45, 0, 0.55, 1)",
        ui: "cubic-bezier(0.22, 1, 0.36, 1)",
        "spring-clap": "var(--spring-clap)",
        "spring-snap": "var(--spring-snap)",
      },
      transitionDuration: {
        f2: "83ms",
        f3: "125ms",
        f4: "167ms",
        f6: "250ms",
        f9: "375ms",
        f12: "500ms",
        f18: "750ms",
        f24: "1000ms",
        f36: "1500ms",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant }) => {
      // motion allowed (implies JS ran and motion is not reduced)
      addVariant("fx", 'html[data-motion="full"] &')
      // no JS, OR reduced motion / MOTION off
      addVariant("still", 'html:not([data-motion="full"]) &')
      addVariant("fine", "@media (hover: hover) and (pointer: fine)")
      addVariant("forced", "@media (forced-colors: active)")
    }),
  ],
}
