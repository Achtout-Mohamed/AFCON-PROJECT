// scripts/fetch-afcon-groups-and-squads.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

async function wikiParse(title) {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
  const res = await fetch(url);
  return res.json();
}

function extractTeamsFromGroupHtml(html, groupLabel, countries) {
  // Locate the group heading (prefer human-readable "Group A")
  const humanLabel = groupLabel.replace('_', ' ');
  let startIdx = html.indexOf(humanLabel);
  if (startIdx === -1) {
    const idLabel = `id=\"${groupLabel}\"`;
    startIdx = html.indexOf(idLabel);
  }
  if (startIdx === -1) return [];

  // Find the next table after heading and parse links inside it
  const tableStart = html.indexOf('<table', startIdx);
  if (tableStart === -1) return [];
  const tableEnd = html.indexOf('</table>', tableStart);
  if (tableEnd === -1) return [];
  const tableHtml = html.slice(tableStart, tableEnd + 8);

  const countriesLower = (countries || []).map(c => c.toLowerCase());
  const teams = [];
  const aRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = aRegex.exec(tableHtml))) {
    const href = m[1];
    const name = m[2].trim();
    if (!href || !href.startsWith('/wiki/')) continue;
    if (href.includes(':')) continue;
    if (!name || name.length < 2) continue;
    // normalize name and check if it matches scraped country list (flexible)
    const normalize = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const low = normalize(name);
    const matched = countriesLower.find(c => normalize(c) === low || normalize(c).includes(low) || low.includes(normalize(c)));
    if (!matched) continue;
    // capture wiki title portion for direct page fetch
    const title = decodeURIComponent(href.replace('/wiki/', '')).replace(/ /g, '_');
    if (!teams.find(t => t.team === name)) teams.push({ team: name, title });
    if (teams.length >= 4) break;
  }
  return teams;
}

function extractPlayersFromHtml(html) {
  // Find table blocks and pick the one that looks like a squad table (has header 'Player' or 'No' or 'Pos')
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  let m;
  while ((m = tableRegex.exec(html))) {
    const tableHtml = m[0];
    if (!/(<th[^>]*>\s*(Player|No|Number|Pos|Position)\s*<\/th>)/i.test(tableHtml)) continue;
    const names = new Set();
    const aRegex = /<a[^>]*>([^<]+)<\/a>/gi;
    let a;
    while ((a = aRegex.exec(tableHtml))) {
      const name = a[1].trim();
      if (name && name.length > 1 && !/\d+/.test(name)) names.add(name);
    }
    // fallback: capture text-looking names in td without links
    const tdRegex = /<td[^>]*>\s*([^<][^<]{2,}?)\s*<\/td>/gi;
    while ((a = tdRegex.exec(tableHtml))) {
      const cand = a[1].replace(/<[^>]+>/g, '').trim();
      if (cand && cand.length > 1 && /[A-Za-z]/.test(cand) && !/\d+/.test(cand)) names.add(cand);
    }
    return Array.from(names).slice(0, 26);
  }

  // fallback: try list items
  const names = new Set();
  const liRegex = /<li[\s\S]*?>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
  while ((m = liRegex.exec(html))) {
    const name = m[1].trim();
    if (name && name.length > 1 && !/\d+/.test(name)) names.add(name);
  }
  return Array.from(names).slice(0, 26);
}

async function fetchSquadForTeam(entry) {
  // entry: { team, title }
  if (entry?.title) {
    try {
      const parsed = await wikiParse(entry.title);
      const html = parsed?.parse?.text?.['*'];
      if (html) {
        const players = extractPlayersFromHtml(html);
        return { team: entry.team, players, source: `https://en.wikipedia.org/wiki/${entry.title}` };
      }
    } catch (err) {
      // fall through to search fallback
    }
  }

  // Fallback: search by team name
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entry.team + ' national football team')}&format=json&origin=*`;
  try {
    const sr = await fetch(searchUrl).then(r => r.json());
    const title = sr?.query?.search?.[0]?.title;
    if (title) {
      const parsed = await wikiParse(title);
      const html = parsed?.parse?.text?.['*'];
      const players = html ? extractPlayersFromHtml(html) : [];
      return { team: entry.team, players, source: title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` : null };
    }
  } catch (err) {
    // ignore
  }
  return { team: entry.team, players: [], source: null };
}

async function main() {
  const outPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-groups-squads.json');
  // parse tournament page
  const title = '2025_Africa_Cup_of_Nations';
  const parsed = await wikiParse(title);
  const html = parsed?.parse?.text?.['*'] || '';
  const groups = ['Group_A','Group_B','Group_C','Group_D','Group_E','Group_F'];
  const result = { groups: {} };
  // load scraped country list to filter actual country names
  const countriesPath = path.join(__dirname, '..', 'tmp', 'wiki-afcon-teams-2025.json');
  let countries = [];
  try {
    const raw = await fs.readFile(countriesPath, 'utf8');
    countries = JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read wiki-afcon-teams-2025.json, falling back to simple extraction');
  }

  for (const g of groups) {
    const groupTextLabel = g.replace('_', ' ');
    const teams = extractTeamsFromGroupHtml(html, groupTextLabel, countries);
    result.groups[g] = teams;
  }

  // flatten teams (unique) and fetch squads using the wiki title if available
  const teamsList = [];
  for (const g of Object.keys(result.groups)) {
    for (const t of result.groups[g]) {
      teamsList.push({ group: g, team: t.team, title: t.title });
    }
  }

  const squadsByGroup = {};
  for (const g of Object.keys(result.groups)) squadsByGroup[g] = [];

  for (const entry of teamsList) {
    process.stdout.write(`Fetching squad for ${entry.team}... `);
    const squad = await fetchSquadForTeam(entry);
    squadsByGroup[entry.group].push(squad);
    console.log(`found ${squad.players.length}` + (squad.source ? ` (src: ${squad.source})` : ''));
    await new Promise(r => setTimeout(r, 300));
  }

  await fs.mkdir(path.join(__dirname, '..', 'tmp'), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(squadsByGroup, null, 2), 'utf8');
  console.log(`Saved groups+sqads to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(2); });
