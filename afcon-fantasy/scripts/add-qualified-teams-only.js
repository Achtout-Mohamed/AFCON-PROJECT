// add-qualified-teams-only.js
// ONLY ADDS teams - Run AFTER manually deleting teams collection

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  writeBatch, 
  doc,
  collection
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCELVwy1m5jsk3LUoh9b4lMAQiALHucTC0",
  authDomain: "afcon-fantasy-2025.firebaseapp.com",
  projectId: "afcon-fantasy-2025",
  storageBucket: "afcon-fantasy-2025.firebasestorage.app",
  messagingSenderId: "1068734937286",
  appId: "1:1068734937286:web:065eb1fbdbff54a1debfc7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const QUALIFIED_TEAMS = [
  { name: "Morocco", code: "MAR", group: "A", flag: "🇲🇦" },
  { name: "Mali", code: "MLI", group: "A", flag: "🇲🇱" },
  { name: "Zambia", code: "ZAM", group: "A", flag: "🇿🇲" },
  { name: "Comoros", code: "COM", group: "A", flag: "🇰🇲" },
  { name: "Egypt", code: "EGY", group: "B", flag: "🇪🇬" },
  { name: "South Africa", code: "RSA", group: "B", flag: "🇿🇦" },
  { name: "Angola", code: "ANG", group: "B", flag: "🇦🇴" },
  { name: "Zimbabwe", code: "ZIM", group: "B", flag: "🇿🇼" },
  { name: "Nigeria", code: "NGA", group: "C", flag: "🇳🇬" },
  { name: "Tunisia", code: "TUN", group: "C", flag: "🇹🇳" },
  { name: "Uganda", code: "UGA", group: "C", flag: "🇺🇬" },
  { name: "Tanzania", code: "TAN", group: "C", flag: "🇹🇿" },
  { name: "Senegal", code: "SEN", group: "D", flag: "🇸🇳" },
  { name: "DR Congo", code: "COD", group: "D", flag: "🇨🇩" },
  { name: "Benin", code: "BEN", group: "D", flag: "🇧🇯" },
  { name: "Botswana", code: "BOT", group: "D", flag: "🇧🇼" },
  { name: "Algeria", code: "ALG", group: "E", flag: "🇩🇿" },
  { name: "Burkina Faso", code: "BFA", group: "E", flag: "🇧🇫" },
  { name: "Equatorial Guinea", code: "EQG", group: "E", flag: "🇬🇶" },
  { name: "Sudan", code: "SUD", group: "E", flag: "🇸🇩" },
  { name: "Côte d'Ivoire", code: "CIV", group: "F", flag: "🇨🇮" },
  { name: "Cameroon", code: "CMR", group: "F", flag: "🇨🇲" },
  { name: "Gabon", code: "GAB", group: "F", flag: "🇬🇦" },
  { name: "Mozambique", code: "MOZ", group: "F", flag: "🇲🇿" }
];

async function addTeams() {
  console.log('\n✨ Adding 24 qualified AFCON 2025 teams...\n');
  
  const teamsRef = collection(db, 'teams');
  const batch = writeBatch(db);
  
  for (const team of QUALIFIED_TEAMS) {
    const docId = team.code.toLowerCase();
    const teamRef = doc(teamsRef, docId);
    
    batch.set(teamRef, {
      ...team,
      qualified: true,
      afcon_2025: true,
      created_at: new Date()
    });
    
    console.log(`✅ ${team.name} (${team.code})`);
  }
  
  await batch.commit();
  console.log(`\n🎉 Added all 24 teams!\n`);
  process.exit(0);
}

addTeams();