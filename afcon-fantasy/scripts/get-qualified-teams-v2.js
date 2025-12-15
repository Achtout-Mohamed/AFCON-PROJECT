// scripts/get-qualified-teams-v2.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

async function wikiParse(title) {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const res = await fetch(url).then(r => r.json());
  return res?.parse?.text?.['*'] || '';
}

function normalize(s){
  return s.normalize?.('NFD')?.replace(/\p{M}/gu,'')?.toLowerCase() || String(s).toLowerCase();
}

async function main(){
  const title = '2025_Africa_Cup_of_Nations';
  const html = await wikiParse(title);

  // load candidate country list (scraped fallback)
  const listPath = path.join(__dirname, '..', 'tmp', 'wiki-afcon-teams-2025.json');
  let candidates = [];
  try{
    const raw = await fs.readFile(listPath, 'utf8');
    candidates = JSON.parse(raw).map(s => normalize(s));
  }catch(e){
    console.warn('Could not read wiki-afcon-teams-2025.json — extractor will still try to match by heuristics');
  }

  // collect anchors only within the 'Qualified teams' section and match against scraped candidates
  const headRe = /<span[^>]*id="Qualified_teams"[^>]*>.*?<\/span>/i;
  const headMatch = headRe.exec(html);
  let secStart = headMatch ? headMatch.index + headMatch[0].length : html.indexOf('Qualified teams');
  if (secStart === -1) secStart = 0;
  const sectionHtml = html.slice(secStart, secStart + 10000);

  const aRe = /<a[^>]*href="\/wiki\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const found = new Map();
  let m;
  while ((m = aRe.exec(sectionHtml))) {
    const rawHref = m[1];
    if (/File:|Category:|Help:|Template:|Portal:|Wikipedia:|Talk:/i.test(rawHref)) continue;
    const href = decodeURIComponent(rawHref).replace(/_/g, ' ');
    const text = m[2].trim();
    const ntext = normalize(text);
    // only accept if it matches one of the scraped country names exactly (normalized)
    if (candidates.length && candidates.includes(ntext)) {
      if (!found.has(ntext)) found.set(ntext, { name: text, href });
    }
    if (found.size >= 24) break;
  }

  const teams = Array.from(found.values()).slice(0, 24).map(t => t.name);
  const outPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-qualified-teams.json');
  await fs.mkdir(path.join(__dirname,'..','tmp'), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(teams, null, 2), 'utf8');
  console.log(`Saved ${teams.length} teams to ${outPath}`);
  teams.forEach(t => console.log('- ' + t));
}

main().catch(err => { console.error(err); process.exit(2); });
