#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getLeagues, getTeams, findAfconLeagues } = require('../services/apiFootballService');

async function main() {
  const seasonArg = parseInt(process.argv[2], 10) || 2025;

  try {
    console.log('\nSearching for AFCON-like leagues for season', seasonArg);
    const candidates = await findAfconLeagues(seasonArg);

    if (!candidates || candidates.length === 0) {
      console.log('No AFCON-like leagues found in API-Football for that season.');
      process.exit(0);
    }

    console.log(`Found ${candidates.length} candidate(s):`);
    for (const c of candidates) {
      const league = c.league || {};
      const country = c.country || {};
      console.log(`- ${league.name} (ID: ${league.id}) — Country: ${country.name} — Seasons: ${c.seasons.map(s=>s.year).join(',')}`);

      console.log('  Fetching teams...');
      const teams = await getTeams(league.id, seasonArg);
      console.log(`  Got ${teams.length} teams.`);

      const outDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `apifootball-teams-${league.id}-${seasonArg}.json`);
      fs.writeFileSync(outPath, JSON.stringify(teams, null, 2), 'utf8');
      console.log('  Saved to', outPath, '\n');
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
