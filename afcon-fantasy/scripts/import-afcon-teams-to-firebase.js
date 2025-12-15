#!/usr/bin/env node
/**
 * Import AFCON teams JSON into Firestore using Firebase Admin SDK.
 *
 * Requirements:
 * - Create a Firebase service account JSON and set env var `FIREBASE_SERVICE_ACCOUNT` to its path
 *   or set `GOOGLE_APPLICATION_CREDENTIALS` to the JSON path.
 * - Ensure the service account has Firestore permissions.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./serviceAccount.json node ./scripts/import-afcon-teams-to-firebase.js
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const servicePath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!servicePath) {
    console.error('ERROR: No Firebase service account path provided.');
    console.error('Set FIREBASE_SERVICE_ACCOUNT=./path/serviceAccount.json or GOOGLE_APPLICATION_CREDENTIALS=...');
    process.exit(2);
  }

  if (!fs.existsSync(servicePath)) {
    console.error('ERROR: Service account file not found at', servicePath);
    process.exit(3);
  }

  const admin = require('firebase-admin');
  const serviceAccount = require(path.resolve(servicePath));

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const inPath = path.join(__dirname, '..', 'tmp', 'wiki-afcon-teams-2025.json');
  if (!fs.existsSync(inPath)) {
    console.error('ERROR: Teams JSON not found at', inPath);
    console.error('Run `npm run get:wiki:afcon:teams` first to create the file.');
    process.exit(4);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  const teams = JSON.parse(raw);

  if (!Array.isArray(teams) || teams.length === 0) {
    console.error('No teams found in', inPath);
    process.exit(5);
  }

  console.log(`Importing ${teams.length} teams into Firestore (collection: teams)...`);

  const batch = db.batch();
  const coll = db.collection('teams');

  teams.forEach((teamName) => {
    const id = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const ref = coll.doc(id);
    batch.set(ref, {
      name: teamName,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      source: 'wiki-approx-2025',
      qualified: true,
    }, { merge: true });

    // create empty subcollection placeholder
    const subRef = ref.collection('qualified_players').doc('__placeholder');
    batch.set(subRef, { created_at: admin.firestore.FieldValue.serverTimestamp(), note: 'placeholder' });
  });

  await batch.commit();
  console.log('Import complete. Teams written to Firestore under collection `teams`.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
