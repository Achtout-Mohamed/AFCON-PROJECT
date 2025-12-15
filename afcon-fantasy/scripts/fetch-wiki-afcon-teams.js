#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Minimal list of African countries to match against the page HTML
const AFRICAN_COUNTRIES = [
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cabo Verde','Cameroon','Central African Republic',
  'Chad','Comoros','Congo','DR Congo','Congo DR','Ivory Coast','Côte d\'Ivoire','Djibouti','Egypt','Equatorial Guinea',
  'Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia','Libya',
  'Madagascar','Malawi','Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda',
  'Sao Tome and Principe','Senegal','Seychelles','Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania',
  'Togo','Tunisia','Uganda','Zambia','Zimbabwe','Cape Verde','Cabo Verde','DR Congo','Republic of the Congo'
];

async function fetchPage(title) {
  const url = 'https://en.wikipedia.org/w/api.php';
  const params = {
    action: 'parse',
    page: title,
    prop: 'text',
    format: 'json',
    redirects: 1
  };

  // Provide a descriptive User-Agent to avoid being blocked by Wikimedia
  const headers = {
    'User-Agent': 'AFCON-Fantasy-App/1.0 (dev@yourdomain.example)',
    'Accept': 'application/json'
  };

  const res = await axios.get(url, { params, timeout: 15000, headers });
  return res.data;
}

async function main() {
  const title = '2025 Africa Cup of Nations';
  try {
    console.log('\nFetching Wikipedia page via API:', title);
    const json = await fetchPage(title);
    const html = (json.parse && json.parse.text && json.parse.text['*']) || '';

    // Match country names from our list
    const found = new Set();
    const lowerHtml = html.toLowerCase();
    AFRICAN_COUNTRIES.forEach(country => {
      const key = country.toLowerCase();
      if (lowerHtml.includes(key)) found.add(country);
    });

    const teams = Array.from(found).sort();

    if (teams.length === 0) {
      console.log('No African country names found on the page. Saving raw HTML for inspection.');
      const outDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'afcon-wiki-raw.html'), html, 'utf8');
      console.log('Saved raw HTML to tmp/afcon-wiki-raw.html');
      process.exit(0);
    }

    const outDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `wiki-afcon-teams-2025.json`);
    fs.writeFileSync(outPath, JSON.stringify(teams, null, 2), 'utf8');

    console.log(`\nFound ${teams.length} countries (approximate):`);
    teams.forEach(t => console.log(' -', t));
    console.log('\nSaved list to', outPath);
  } catch (err) {
    // If the API returns 403 (or other restrictions), try fetching the page HTML directly
    console.warn('API fetch failed:', err.message || err);
    if (err.response && err.response.status === 403) {
      try {
        console.log('Attempting direct page fetch as fallback...');
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
        const headers = { 'User-Agent': 'AFCON-Fantasy-App/1.0 (dev@yourdomain.example)', 'Accept': 'text/html' };
        const res = await axios.get(pageUrl, { timeout: 15000, headers });
        const html = res.data || '';

        // Save raw HTML for inspection and attempt the same country lookup
        const outDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const rawPath = path.join(outDir, 'afcon-wiki-raw.html');
        fs.writeFileSync(rawPath, html, 'utf8');
        console.log('Saved raw HTML to', rawPath);

        // continue with parsing using the saved HTML
        const lowerHtml = html.toLowerCase();
        const found = new Set();
        AFRICAN_COUNTRIES.forEach(country => {
          const key = country.toLowerCase();
          if (lowerHtml.includes(key)) found.add(country);
        });

        const teams = Array.from(found).sort();
        const outPath = path.join(outDir, `wiki-afcon-teams-2025.json`);
        fs.writeFileSync(outPath, JSON.stringify(teams, null, 2), 'utf8');
        console.log(`\nFound ${teams.length} countries (approximate):`);
        teams.forEach(t => console.log(' -', t));
        console.log('\nSaved list to', outPath);
        process.exit(0);
      } catch (err2) {
        console.error('Direct page fetch also failed:', err2.message || err2);
        process.exit(1);
      }
    }

    console.error('Error fetching/parsing Wikipedia page:', err.message || err);
    process.exit(1);
  }
}

main();
