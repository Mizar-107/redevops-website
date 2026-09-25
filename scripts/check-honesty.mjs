#!/usr/bin/env node
/**
 * Honesty check: the site's promise is "no fake logos, no invented metrics".
 *
 * Parses every .ts/.tsx file under components/ and lib/ with the TypeScript compiler and inspects
 * VISIBLE text only: JSX text, string values of text-bearing JSX attributes, string literals used
 * as JSX children, and string values of text-bearing object properties / text arrays.
 *
 * FAILS (exit 1) on percentages, currency amounts, "N× faster"-style multipliers and metric-like
 * magnitudes (12k, 3M, 200ms, 4hrs). WARNS on any other digit that isn't an allow-listed form
 * (reel/scene/step indices, timecodes, "30 MIN", aspect ratios, track names, ©).
 */
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const ROOTS = ["components", "lib"]
const SKIP_DIRS = new Set(["ui", "node_modules"])
const SKIP_FILES = new Set(["lib/utils.ts"])
const TEXT_ATTRS = new Set([
  "aria-label",
  "aria-valuetext",
  "aria-description",
  "title",
  "alt",
  "label",
  "text",
  "placeholder",
  "cut",
  "caption",
])
const TEXT_KEYS =
  /^(title|description|body|label|question|answer|text|caption|name|cut|nav|ariaLabel|heading|lede|tag|tags|beats|lines|log|items|role|credit|credits|note|subtitle|eyebrow|cta)$/i
const TEXT_ARRAY_NAMES = /(beats|tags|lines|log|items|labels|credits|faqs|steps|outcomes|services|expectations)/i

const FAIL = [
  { re: /\d+(\.\d+)?\s?%/, why: "percentage" },
  { re: /[$€£]\s?\d/, why: "currency amount" },
  { re: /\d+(\.\d+)?\s?(x|×)\s?(faster|cheaper|fewer|more|less|quicker)/i, why: "multiplier claim" },
  { re: /\b\d+(\.\d+)?\s?(k|K|M|B|ms|hrs?|hours|days|weeks)\b/, why: "metric-like magnitude" },
]

const ALLOW = [
  /\bREEL \d\d\b/g,
  /\bSC 0\d\s?\/\s?0\d\b/g,
  /\b0\d\s?\/\s?0\d\b/g,
  /\bQ0\d\b/g,
  /\bCLIP 0\d\b/g,
  /\bOUTCOME 0\d\b/g,
  /\bSTAGE 0\d\b/g,
  /\bSCENE [AB]\b/g,
  /\bTC\b[^\n]*/g,
  /\b\d\d:\d\d:\d\d:\d\d\b/g,
  /\b24 FPS\b/g,
  /\b2\.39:1\b/g,
  /\b1\.78:1\b/g,
  /\b30[ -]?MIN(UTE)?\b/gi,
  /\b30-minute\b/gi,
  /\b30 minutes\b/gi,
  /\bA1\b/g,
  /\bV[1-3]\b/g,
  /©/g,
  /\b0[1-9]\b/g, // two-digit indices: 01 · SPEND, 02 SERVICES …
]

function* walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name))
    } else if (/\.(tsx?|mts)$/.test(e.name) && !e.name.endsWith(".d.ts") && !SKIP_FILES.has(path.join(dir, e.name))) yield path.join(dir, e.name)
  }
}

const failures = []
const warnings = []

function check(text, file, sf, node, ctx) {
  const t = text.replace(/\s+/g, " ").trim()
  if (!t || !/\d/.test(t)) return
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
  const where = `${file}:${line + 1}`
  for (const f of FAIL) {
    if (f.re.test(t)) {
      failures.push(`${where}  [${f.why}] (${ctx}) ${JSON.stringify(t.slice(0, 140))}`)
      return
    }
  }
  let rest = t
  for (const a of ALLOW) rest = rest.replace(a, " ")
  if (/\d/.test(rest)) warnings.push(`${where}  (${ctx}) ${JSON.stringify(t.slice(0, 140))}`)
}

const strOf = (n) =>
  ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
    ? n.text
    : ts.isTemplateExpression(n)
      ? [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(" ")
      : null

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, "utf8")
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const visit = (node) => {
      if (ts.isJsxText(node)) check(node.text, file, sf, node, "jsx text")
      else if (ts.isJsxAttribute(node) && node.initializer) {
        const name = node.name.getText(sf)
        if (TEXT_ATTRS.has(name)) {
          const init = node.initializer
          const s = strOf(init) ?? (ts.isJsxExpression(init) && init.expression ? strOf(init.expression) : null)
          if (s != null) check(s, file, sf, node, `attr ${name}`)
        }
      } else if (ts.isJsxExpression(node) && node.expression && ts.isJsxElement(node.parent)) {
        const s = strOf(node.expression)
        if (s != null) check(s, file, sf, node, "jsx child")
      } else if (ts.isPropertyAssignment(node)) {
        const key = node.name.getText(sf).replace(/["']/g, "")
        if (TEXT_KEYS.test(key)) {
          const s = strOf(node.initializer)
          if (s != null) check(s, file, sf, node, `prop ${key}`)
          else if (ts.isArrayLiteralExpression(node.initializer)) {
            for (const el of node.initializer.elements) {
              const es = strOf(el)
              if (es != null) check(es, file, sf, el, `prop ${key}[]`)
            }
          }
        }
      } else if (ts.isVariableDeclaration(node) && node.initializer && TEXT_ARRAY_NAMES.test(node.name.getText(sf))) {
        let init = node.initializer
        while (ts.isAsExpression(init) || ts.isSatisfiesExpression?.(init)) init = init.expression
        if (ts.isArrayLiteralExpression(init)) {
          for (const el of init.elements) {
            const es = strOf(el)
            if (es != null) check(es, file, sf, el, `array ${node.name.getText(sf)}`)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
}

if (warnings.length) {
  console.log(`\nhonesty: ${warnings.length} digit(s) in visible text to review (allowed forms excluded):`)
  for (const w of warnings) console.log("  warn  " + w)
}
if (failures.length) {
  console.error(`\nhonesty: FAILED — ${failures.length} metric-like claim(s) in visible text:`)
  for (const f of failures) console.error("  FAIL  " + f)
  process.exit(1)
}
console.log(`honesty: OK (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`)
