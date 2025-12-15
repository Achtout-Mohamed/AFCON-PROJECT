#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;
const CODE_ENV = process.env.EXPO_PUBLIC_AFCON_CODE || '';
const BASE = 'https://api.football-data.org/v4';

async function main() {
  const codeArg = process.argv[2];
  const code = (codeArg || CODE_ENV || '').trim();

  if (!API_KEY) {
    console.error('ERROR: Missing EXPO_PUBLIC_FOOTBALL_DATA_API_KEY in .env');
    process.exit(2);
  }

  if (!code) {
    console.error('ERROR: No competition code provided. Pass it as argument or set EXPO_PUBLIC_AFCON_CODE in .env');
    console.error('   Example: node ./scripts/get-competition-teams.js CAF');
    process.exit(3);
  }

  console.log(`Fetching teams for competition code: ${code} ...`);

  try {
    const res = await axios.get(`${BASE}/competitions/${code}/teams`, {
      headers: { 'X-Auth-Token': API_KEY },
      timeout: 10000,
    });

    const teams = res.data.teams || [];
    if (!teams.length) {
      console.log('No teams returned for this competition code.');
      process.exit(0);
    }

    console.log(`Found ${teams.length} teams:`);
    teams.forEach(t => console.log(`   - ${t.name} (${t.tla || t.shortName || ''})`));

    // write to tmp
    const outDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `teams-${code}.json`);
    fs.writeFileSync(outPath, JSON.stringify(teams, null, 2), 'utf8');
    console.log(`\nTeams saved to ${outPath}`);
  } catch (err) {
    if (err.response) {
      console.error('\nAPI Error:', err.response.status, err.response.data?.message || '');
      if (err.response.status === 403) console.error('   - Invalid API key or access not enabled for this competition.');
      if (err.response.status === 404) console.error('   - Competition not found (server does not have this competition).');
    } else {
      console.error('\nError:', err.message || err);
    }
    process.exit(1);
  }
}

main();
