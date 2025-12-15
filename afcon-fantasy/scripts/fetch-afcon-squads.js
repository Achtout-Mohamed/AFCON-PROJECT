// scripts/fetch-afcon-squads.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

async function wikiSearch(query) {
  const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const res = await fetch(url);
  return res.json();
}

async function wikiParse(title) {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const res = await fetch(url);
  return res.json();
}

function extractPlayersFromHtml(html) {
  const names = new Set();

  // match anchor text inside table rows (common in squad tables)
  const trRegex = /<tr[\s\S]*?<td[\s\S]*?>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = trRegex.exec(html))) {
    const name = m[1].trim();
    if (name && name.length > 1 && !/\d+/.test(name)) names.add(name);
  }

  // fallback: list items
  const liRegex = /<li[\s\S]*?>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
  while ((m = liRegex.exec(html))) {
    const name = m[1].trim();
    if (name && name.length > 1 && !/\d+/.test(name)) names.add(name);
  }

  return Array.from(names).slice(0, 40);
}

async function fetchSquadForCountry(country) {
  // Try searching for "<Country> 2025 Africa Cup of Nations squad"
  const candidates = [];
  const searchQueries = [
    `${country} 2025 Africa Cup of Nations squad`,
    `${country} squad 2025`,
    `${country} national football team squad`,
    `${country} national football team`
  ];

  for (const q of searchQueries) {
    try {
      const r = await wikiSearch(q);
      if (r?.query?.search?.length) {
        for (const s of r.query.search.slice(0, 3)) candidates.push(s.title);
        if (candidates.length) break;
      }
    } catch (err) {
      // continue
    }
  }

  if (!candidates.length) return { country, players: [], source: null };

  // try parse each candidate until we find players
  for (const title of candidates) {
    try {
      const parsed = await wikiParse(title);
      const html = parsed?.parse?.text?.['*'];
      if (!html) continue;
      const players = extractPlayersFromHtml(html);
      if (players.length >= 11) {
        return { country, players, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` };
      }
      // accept even small lists as best-effort
      if (players.length > 0) return { country, players, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` };
    } catch (err) {
      continue;
    }
  }

  return { country, players: [], source: candidates[0] || null };
}

async function main() {
  const inputPath = path.join(__dirname, '..', 'tmp', 'wiki-afcon-teams-2025.json');
  const outPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-squads.json');

  let countries;
  try {
    const raw = await fs.readFile(inputPath, 'utf8');
    countries = JSON.parse(raw);
  } catch (err) {
    console.error('Could not read team list:', err.message);
    process.exit(1);
  }

  const results = [];
  for (const country of countries) {
    process.stdout.write(`Fetching squad for ${country}... `);
    try {
      const res = await fetchSquadForCountry(country);
      results.push(res);
      console.log(`found ${res.players.length}` + (res.source ? ` (source: ${res.source})` : ''));
    } catch (err) {
      console.log('error');
      results.push({ country, players: [], source: null, error: String(err) });
    }
    // small delay to be polite
    await new Promise(r => setTimeout(r, 400));
  }

  await fs.mkdir(path.join(__dirname, '..', 'tmp'), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved squads to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
