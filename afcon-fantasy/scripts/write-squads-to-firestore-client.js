// scripts/write-squads-to-firestore-client.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import client firebase app
import { db } from '../firebase.js';
import { collection, doc, setDoc } from 'firebase/firestore';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const inPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-squads.json');
  let raw;
  try {
    raw = await fs.readFile(inPath, 'utf8');
  } catch (err) {
    console.error('Could not read squads JSON:', err.message);
    process.exit(1);
  }

  const data = JSON.parse(raw);
  console.log(`Writing squads for ${data.length} teams to Firestore...`);
  for (const item of data) {
    const teamName = item.country || item.team || item.name;
    if (!teamName) continue;
    const teamSlug = slugify(teamName);
    const teamRef = doc(db, 'teams', teamSlug);
    try {
      // ensure team doc exists (merge)
      await setDoc(teamRef, { name: teamName }, { merge: true });
    } catch (err) {
      console.warn('Failed to ensure team doc:', teamName, err.message);
    }

    // write players as subcollection documents
    const players = item.players || [];
    for (const p of players) {
      const playerSlug = slugify(p);
      const docRef = doc(db, 'teams', teamSlug, 'qualified_players', playerSlug);
      await setDoc(docRef, { name: p, addedAt: new Date().toISOString() });
    }
    console.log(`Wrote ${players.length} players for ${teamName}`);
  }
  console.log('Done writing squads.');
}

main().catch(err => { console.error(err); process.exit(2); });
