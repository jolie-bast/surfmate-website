/**
 * Prepares the legacy static pages (under public/) for clients that do not
 * run JavaScript. The homepage and spot pages are server-rendered by Next.js
 * at build time and do not need this step.
 *
 * Without --deploy:
 *   refreshes llms-full.txt from includes/faq.html
 *
 * With --deploy (GitHub Pages workflow):
 *   also inlines includes/*.html into every legacy page so crawlers see the
 *   copy that browsers otherwise fetch after load.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const includesDir = path.join(publicDir, "includes");
const deploy = process.argv.includes("--deploy");

const INCLUDE_RE = /<div\b([^>]*?)\sdata-include="([^"]+)"([^>]*)>\s*<\/div>/g;

const FULL_BRIEF_INTRO = `# Surfmate

> Surfmate is the social surf platform to remember every surf, organize spots, discover events, and connect with other surfers. Tagline: Your Surf. Your Story.

Surfmate is a community app for iOS and Android, made by Jolie Bast in Hamburg. More than 2,000 surfers use it.

The app helps surfers:

- Log sessions: spot, date and time, duration, rating, up to 3 photos, notes, conditions, emotions, vibes, and highlights
- Share spotchecks with friends instead of group-chat spam
- Organize spots, including webcam links, tide, and wave type, while secret spots stay private
- Discover contests, festivals, and meetups, and see who is going
- Follow other surfers, keep a profile, and scroll a social feed without ads
- Keep a personal journal of the surf journey

Download:

- App Store: https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082
- Google Play: https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp

Website: https://surfmate.eu/
Events: https://surfmate.eu/events/
Partners: https://surfmate.eu/partners/
Creators: https://surfmate.eu/creators/
Team: https://surfmate.eu/team.html
Join: https://surfmate.eu/join/
Shop: https://surfmate.eu/shop/
Support: https://surfmate.eu/support/
Contact: info@surf-mate.de

Story, in short: Jolie fell in love with surfing at 18 in Hamburg, a city without a surf community, and paddled out alone for three years. Surfmate exists so no surfer has to start alone — find surfers nearby, help each other out, and keep every session. What started as one surfer’s story is now a community of more than 2,000.

## FAQ
`;

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html) {
  const withBreaks = html
    .replace(/\s*<li>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(p|ul|ol|h\d)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(stripped)
    .replace(/[ \t]*\n[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFaqItems(faqHtml) {
  const items = [];

  for (const part of faqHtml.split('<div class="faq-item">').slice(1)) {
    const questionMatch = part.match(/<button[\s\S]*?<span>([^<]+)<\/span>/);
    const answerMatch = part.match(/<div class="faq-answer">([\s\S]*?)<\/div>/);
    if (!questionMatch || !answerMatch) continue;

    items.push({
      question: decodeEntities(questionMatch[1].trim()),
      answer: htmlToText(answerMatch[1]),
    });
  }

  if (items.length < 10) {
    throw new Error(`Expected the Surfmate FAQ, found ${items.length} items`);
  }

  return items;
}

function listHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "includes" || entry.name === "node_modules") continue;
      listHtmlFiles(full, out);
      continue;
    }

    if (entry.name.endsWith(".html")) out.push(full);
  }

  return out;
}

function readInclude(file) {
  if (!/^[\w.-]+$/.test(file)) {
    throw new Error(`Unsafe include name: ${file}`);
  }

  const full = path.join(includesDir, file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing include: ${file}`);
  }

  return fs.readFileSync(full, "utf8").trim();
}

function inlineIncludes(html, filePath) {
  let next = html;
  let guard = 0;

  while (true) {
    INCLUDE_RE.lastIndex = 0;
    if (!INCLUDE_RE.test(next)) break;

    if (++guard > 20) {
      throw new Error(`Include recursion in ${filePath}`);
    }

    INCLUDE_RE.lastIndex = 0;
    next = next.replace(INCLUDE_RE, (_, before, file, after) => {
      return `<div${before}${after}>\n${readInclude(file)}\n</div>`;
    });
  }

  if (next.includes("data-include=")) {
    throw new Error(`Unresolved include in ${filePath}`);
  }

  return next;
}

const faqItems = extractFaqItems(
  fs.readFileSync(path.join(includesDir, "faq.html"), "utf8"),
);

const faqMarkdown = faqItems
  .map((item) => `### ${item.question}\n\n${item.answer}`)
  .join("\n\n");

fs.writeFileSync(
  path.join(publicDir, "llms-full.txt"),
  `${FULL_BRIEF_INTRO}\n${faqMarkdown}\n`,
);

if (!deploy) {
  console.log(`Refreshed llms-full.txt (${faqItems.length} FAQ answers).`);
  process.exit(0);
}

let pages = 0;
let inlined = 0;

for (const filePath of listHtmlFiles(publicDir)) {
  const html = fs.readFileSync(filePath, "utf8");
  const matches = html.match(/data-include="/g);
  if (!matches) continue;

  fs.writeFileSync(filePath, inlineIncludes(html, filePath));
  pages += 1;
  inlined += matches.length;
}

console.log(`Inlined ${inlined} includes across ${pages} pages.`);
