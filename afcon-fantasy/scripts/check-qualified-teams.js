// scripts/check-qualified-teams.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { db } from '../firebase.js';
import { doc, getDoc } from 'firebase/firestore';

function slugify(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

async function main(){
  const inPath = path.join(__dirname, '..', 'tmp', 'afcon-2025-qualified-teams.json');
  let teams = [];
  try{ teams = JSON.parse(await fs.readFile(inPath,'utf8')); } catch(e){ console.error('Could not read qualified teams file:', e.message); process.exit(1); }

  console.log(`Checking ${teams.length} team documents for 'qualifiedFor' field:`);
  for(const name of teams){
    const slug = slugify(name);
    const ref = doc(db, 'teams', slug);
    try{
      const snap = await getDoc(ref);
      if(!snap.exists()){
        console.log(`${name} -> MISSING doc (teams/${slug})`);
        continue;
      }
      const data = snap.data();
      console.log(`${name} -> exists; qualifiedFor: ${JSON.stringify(data.qualifiedFor || null)}; keys: ${Object.keys(data).join(', ')}`);
    }catch(err){
      console.error('Error reading', name, err.message);
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(2); });
