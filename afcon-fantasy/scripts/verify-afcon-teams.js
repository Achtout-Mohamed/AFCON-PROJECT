// scripts/verify-afcon-teams.js
import { db } from '../firebase.js';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function main() {
  try {
    const q = query(collection(db, 'teams'), limit(5));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} documents (showing up to 5):`);
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name || doc.id}`);
    });
  } catch (err) {
    console.error('Error reading teams from Firestore:', err);
    process.exitCode = 2;
  }
}

main();
