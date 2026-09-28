// Αυτόματος έλεγχος προσβασιμότητας όλων των σελίδων.
// Τρέχει axe-core (WCAG 2.0/2.1 A & AA + best practices) και HTML_CodeSniffer (WCAG2AA,
// ο ίδιος κινητήρας κανόνων που χρησιμοποιούν εργαλεία τύπου AChecker/pa11y).
//
// Χρήση:  npm install   και μετά   npm test
// (ξεκινά μόνο του έναν τοπικό server για τον φάκελο src/)
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const PAGES = ["/", "/consortium/", "/media/", "/news/", "/contact/", "/accessibility/", "/404.html"];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(ROOT, p);
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("not found"); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const axeSrc = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const htmlcsSrc = await readFile(require.resolve("html_codesniffer/build/HTMLCS.js"), "utf8");

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
let failures = 0;

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport });
  // Εξωτερικά iframes (YouTube, Google Forms) δεν φορτώνονται στον έλεγχο – ελέγχεται μόνο το δικό μας HTML.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.addScriptTag({ content: axeSrc });
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      });
      return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(" ")) })),
               incomplete: r.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })) };
    });
    await page.addScriptTag({ content: htmlcsSrc });
    const htmlcs = await page.evaluate(() => new Promise(resolve => {
      window.HTMLCS.process("WCAG2AA", document, () => {
        const msgs = window.HTMLCS.getMessages();
        resolve(msgs.filter(m => m.type === 1 /* ERROR */).map(m => ({ code: m.code, msg: m.msg,
          el: m.element && m.element.outerHTML ? m.element.outerHTML.slice(0, 120) : "" })));
      });
    }));
    const label = `${path} @${viewport.width}px`;
    if (axe.violations.length || htmlcs.length) {
      failures += axe.violations.length + htmlcs.length;
      console.log(`✗ ${label}`);
      for (const v of axe.violations) console.log(`   axe  [${v.impact}] ${v.id}: ${v.help}\n        ${v.nodes.join("\n        ")}`);
      for (const m of htmlcs) console.log(`   HTMLCS ${m.code}\n        ${m.msg}\n        ${m.el}`);
    } else {
      console.log(`✓ ${label}  (axe: 0 violations, HTML_CodeSniffer: 0 errors; axe "needs review": ${axe.incomplete.map(i => i.id).join(", ") || "—"})`);
    }
  }
  await page.close();
}

await browser.close();
server.close();
if (failures) { console.log(`\n${failures} πρόβλημα(τα) βρέθηκαν.`); process.exit(1); }
console.log("\nΌλες οι σελίδες πέρασαν τον έλεγχο.");
