// scripts/get-qualified-teams.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

async function wikiParse(title) {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const r = await fetch(url).then(res => res.json());
  return r?.parse?.text?.['*'] || '';
}

function extractQualified(html) {
  // Find the 'Qualified teams' section
  const headRe = /<span[^>]*id="Qualified_teams"[^>]*>.*?<\/span>/i;
  const headMatch = headRe.exec(html);
  let start = 0;
  if (headMatch) start = headMatch.index + headMatch[0].length;
  // fallback: find 'Qualified teams' text
  if (!headMatch) {
    const idx = html.indexOf('Qualified teams');
    if (idx !== -1) start = idx;
  }
  if (start === 0) return [];

  // Look for the next <ul> or <table> after the heading
  const slice = html.slice(start, start + 8000);
  const ulMatch = /<ul[\s\S]*?<\/ul>/i.exec(slice);
  let block = ulMatch ? ulMatch[0] : null;
  if (!block) {
    const tableMatch = /<table[\s\S]*?<\/table>/i.exec(slice);
    block = tableMatch ? tableMatch[0] : '';
  }
  if (!block) return [];

  // extract anchor texts
  const teams = new Set();
  const aRe = /<a[^>]*href="\/wiki\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = aRe.exec(block))) {
    const text = m[2].trim();
    // filter common non-country words
    if (!text || /Group|Qualifiers|Host|Qualified|Team|Venue/i.test(text)) continue;
    teams.add(text);
    if (teams.size >= 24) break;
  }
  return Array.from(teams).slice(0,24);
}

async function main() {
  const title = '2025_Africa_Cup_of_Nations';
  const html = await wikiParse(title);
  const teams = extractQualified(html);
  const outPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-qualified-teams.json');
  await fs.mkdir(path.join(__dirname, '..', 'tmp'), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(teams, null, 2), 'utf8');
  console.log(`Saved ${teams.length} teams to ${outPath}`);
  teams.forEach(t => console.log('- ' + t));
}

main().catch(err => { console.error(err); process.exit(2); });
