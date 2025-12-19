#!/usr/bin/env node
/**
 * Mark AFCON 2025 qualified teams in Firestore using Firebase Admin SDK.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=./serviceAccount.json node ./afcon-fantasy/scripts/mark-qualified-admin.js
 *
 * This will:
 * - Read `afcon-fantasy/tmp/afcon-2025-qualified-teams.json` for the list of qualified teams.
 * - For each document in the `teams` collection, set `qualified: true` and add `afcon-2025`
 *   to `qualifiedFor` if the team is in the list; otherwise remove `afcon-2025` from `qualifiedFor`
 *   and set `qualified: false` (if no other qualifiers exist).
 */

const fs = require('fs');
const path = require('path');

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

const inPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-qualified-teams.json');
if (!fs.existsSync(inPath)) {
  console.error('ERROR: Qualified teams JSON not found at', inPath);
  console.error('Ensure the file exists and contains the final list of qualified teams.');
  process.exit(4);
}

const raw = fs.readFileSync(inPath, 'utf8');
let qualifiedList = JSON.parse(raw);
if (!Array.isArray(qualifiedList)) {
  console.error('ERROR: Qualified teams file must be a JSON array of team names.');
  process.exit(5);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const qualifiedNames = new Set(qualifiedList.map(n => n.toLowerCase()));
const qualifiedSlugs = new Set(qualifiedList.map(n => slugify(n)));

async function main() {
  console.log(`Found ${qualifiedList.length} qualified teams; fetching teams collection...`);
  const snap = await db.collection('teams').get();
  if (snap.empty) {
    console.log('No teams found in Firestore `teams` collection.');
    process.exit(0);
  }

  const batchSize = 500;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const name = (data.name || '').toString().toLowerCase();
    const idSlug = doc.id.toString().toLowerCase();
    const isQualified = qualifiedNames.has(name) || qualifiedSlugs.has(idSlug);

    if (isQualified) {
      batch.set(doc.ref, { qualified: true, qualifiedFor: admin.firestore.FieldValue.arrayUnion('afcon-2025') }, { merge: true });
    } else {
      batch.set(doc.ref, { qualified: false, qualifiedFor: admin.firestore.FieldValue.arrayRemove('afcon-2025') }, { merge: true });
    }

    ops++;
    if (ops >= batchSize) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();

  console.log('Teams updated in Firestore.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
