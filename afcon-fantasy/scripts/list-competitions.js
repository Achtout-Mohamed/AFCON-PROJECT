#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;
const BASE = 'https://api.football-data.org/v4';

async function list() {
  console.log('\n📋 Listing competitions from football-data.org (server-side)\n');

  if (!API_KEY) {
    console.error('❌ EXPO_PUBLIC_FOOTBALL_DATA_API_KEY is missing in .env');
    process.exit(2);
  }

  try {
    const res = await axios.get(`${BASE}/competitions`, {
      headers: { 'X-Auth-Token': API_KEY },
      timeout: 10000,
    });

    const comps = res.data.competitions || [];
    if (!comps.length) {
      console.log('No competitions returned');
      process.exit(0);
    }

    console.log(`Found ${comps.length} competitions. Showing first 200 with likely AFCON matches marked:\n`);

    comps.slice(0, 200).forEach(c => {
      const name = (c.name || '').trim();
      const code = (c.code || '').trim();
      const id = c.id;
      const lower = name.toLowerCase();
      const likely = (lower.includes('africa') || lower.includes('afcon') || code === 'CAF' || code === 'AFCON');
      console.log(`${likely ? '🔎' : '  '} ${name} — Code: ${code} — ID: ${id}`);
    });

    console.log('\n✅ Pick the competition code for AFCON (example: CAF, AFCON, or other) and add to .env as EXPO_PUBLIC_AFCON_CODE=CODE');
  } catch (err) {
    if (err.response) {
      console.error('\n❌ API Error:', err.response.status, err.response.data?.message || '');
    } else {
      console.error('\n❌ Error:', err.message || err);
    }
    process.exit(1);
  }
}

list();
