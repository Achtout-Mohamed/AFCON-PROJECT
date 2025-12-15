// scripts/mark-qualified-teams-client.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';

function slugify(s){
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

async function main(){
  const inPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-qualified-teams.json');
  let teams = [];
  try{ teams = JSON.parse(await fs.readFile(inPath,'utf8')); } catch(e){ console.error('Could not read qualified teams file:', e.message); process.exit(1); }

  console.log(`Marking ${teams.length} teams as qualified for AFCON 2025 in Firestore...`);
  for(const name of teams){
    const slug = slugify(name);
    const ref = doc(db, 'teams', slug);
    try{
      await setDoc(ref, { name, qualifiedFor: ['afcon-2025'] }, { merge: true });
      console.log('Marked qualified:', name);
    }catch(err){
      console.error('Failed to mark', name, err.message);
    }
  }
  console.log('Done.');
}

main().catch(err=>{ console.error(err); process.exit(2); });
