#!/usr/bin/env node
(async () => {
  try {
    const fs = require('fs');
    const path = require('path');

    const { pathToFileURL } = require('url');
    const firebasePath = path.join(__dirname, '..', 'firebase.js');
    const firebaseMod = await import(pathToFileURL(firebasePath).href);
    const { db } = firebaseMod;

    const firestore = await import('firebase/firestore');
    const { doc, setDoc, serverTimestamp } = firestore;

    const inPath = path.join(__dirname, '..', 'tmp', 'wiki-afcon-teams-2025.json');
    if (!fs.existsSync(inPath)) {
      console.error('Teams JSON not found at', inPath);
      console.error('Run `npm run get:wiki:afcon:teams` first');
      process.exit(2);
    }

    const raw = fs.readFileSync(inPath, 'utf8');
    const teams = JSON.parse(raw);
    if (!Array.isArray(teams) || teams.length === 0) {
      console.error('No teams found in', inPath);
      process.exit(3);
    }

    console.log(`Writing ${teams.length} teams to Firestore using client SDK...`);

    for (const teamName of teams) {
      const id = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const teamRef = doc(db, 'teams', id);
      await setDoc(teamRef, {
        name: teamName,
        created_at: serverTimestamp(),
        source: 'wiki-approx-2025',
        qualified: true,
      }, { merge: true });

      const placeholderRef = doc(db, `teams/${id}/qualified_players`, '__placeholder');
      await setDoc(placeholderRef, { created_at: serverTimestamp(), note: 'placeholder' }, { merge: true });

      console.log('Wrote team:', teamName);
    }

    console.log('All teams written successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
