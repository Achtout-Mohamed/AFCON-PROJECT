// update-teams-only.js
// Update ONLY teams collection with qualified AFCON 2025 teams

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  deleteDoc
} from 'firebase/firestore';

// Firebase config
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

// ==========================================
// QUALIFIED AFCON 2025 TEAMS (24 TEAMS ONLY)
// ==========================================
const QUALIFIED_TEAMS = [
  // GROUP A
  { name: "Morocco", code: "MAR", group: "A", flag: "🇲🇦" },
  { name: "Mali", code: "MLI", group: "A", flag: "🇲🇱" },
  { name: "Zambia", code: "ZAM", group: "A", flag: "🇿🇲" },
  { name: "Comoros", code: "COM", group: "A", flag: "🇰🇲" },
  
  // GROUP B
  { name: "Egypt", code: "EGY", group: "B", flag: "🇪🇬" },
  { name: "South Africa", code: "RSA", group: "B", flag: "🇿🇦" },
  { name: "Angola", code: "ANG", group: "B", flag: "🇦🇴" },
  { name: "Zimbabwe", code: "ZIM", group: "B", flag: "🇿🇼" },
  
  // GROUP C
  { name: "Nigeria", code: "NGA", group: "C", flag: "🇳🇬" },
  { name: "Tunisia", code: "TUN", group: "C", flag: "🇹🇳" },
  { name: "Uganda", code: "UGA", group: "C", flag: "🇺🇬" },
  { name: "Tanzania", code: "TAN", group: "C", flag: "🇹🇿" },
  
  // GROUP D
  { name: "Senegal", code: "SEN", group: "D", flag: "🇸🇳" },
  { name: "DR Congo", code: "COD", group: "D", flag: "🇨🇩" },
  { name: "Benin", code: "BEN", group: "D", flag: "🇧🇯" },
  { name: "Botswana", code: "BOT", group: "D", flag: "🇧🇼" },
  
  // GROUP E
  { name: "Algeria", code: "ALG", group: "E", flag: "🇩🇿" },
  { name: "Burkina Faso", code: "BFA", group: "E", flag: "🇧🇫" },
  { name: "Equatorial Guinea", code: "EQG", group: "E", flag: "🇬🇶" },
  { name: "Sudan", code: "SUD", group: "E", flag: "🇸🇩" },
  
  // GROUP F
  { name: "Côte d'Ivoire", code: "CIV", group: "F", flag: "🇨🇮" },
  { name: "Cameroon", code: "CMR", group: "F", flag: "🇨🇲" },
  { name: "Gabon", code: "GAB", group: "F", flag: "🇬🇦" },
  { name: "Mozambique", code: "MOZ", group: "F", flag: "🇲🇿" }
];

// ==========================================
// DELETE ALL TEAMS
// ==========================================
async function deleteAllTeams() {
  console.log('\n🗑️  STEP 1: Deleting ALL existing teams...\n');
  
  const teamsRef = collection(db, 'teams');
  const snapshot = await getDocs(teamsRef);
  
  if (snapshot.empty) {
    console.log('ℹ️  No existing teams to delete\n');
    return;
  }
  
  console.log(`📋 Found ${snapshot.size} teams to delete...`);
  console.log('🔄 Deleting one by one...\n');
  
  let deleteCount = 0;
  const totalTeams = snapshot.size;
  
  // Delete each document individually
  for (const docSnap of snapshot.docs) {
    try {
      await deleteDoc(docSnap.ref);
      deleteCount++;
      console.log(`   🗑️  Deleted: ${docSnap.id}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete team ${docSnap.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Successfully deleted ${deleteCount} teams!\n`);
}

// ==========================================
// ADD QUALIFIED TEAMS ONLY
// ==========================================
async function addQualifiedTeams() {
  console.log('✨ STEP 2: Adding ONLY qualified AFCON 2025 teams...\n');
  console.log(`📋 Adding ${QUALIFIED_TEAMS.length} teams\n`);
  
  const teamsRef = collection(db, 'teams');
  const batch = writeBatch(db);
  let count = 0;
  
  for (const team of QUALIFIED_TEAMS) {
    const teamRef = doc(teamsRef);
    batch.set(teamRef, {
      ...team,
      qualified: true,
      created_at: new Date()
    });
    
    count++;
    console.log(`   ✅ Added: ${team.name} (${team.code}) - Group ${team.group}`);
  }
  
  await batch.commit();
  console.log(`\n✅ Successfully added all ${count} qualified teams!\n`);
}

// ==========================================
// VERIFY DATA
// ==========================================
async function verifyTeams() {
  console.log('🔍 STEP 3: Verifying teams...\n');
  
  const teamsRef = collection(db, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  console.log(`📊 Total teams in database: ${teamsSnapshot.size}\n`);
  
  if (teamsSnapshot.size !== 24) {
    console.log(`⚠️  WARNING: Expected 24 teams, found ${teamsSnapshot.size}\n`);
  }
  
  // Group by group
  const groupCounts = {};
  teamsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const group = data.group || 'Unknown';
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });
  }

  // ==========================================
  // LIST REMAINING TEAMS (for debugging)
  // ==========================================
  async function listRemainingTeams() {
    const teamsRef = collection(db, 'teams');
    const teamsSnapshot = await getDocs(teamsRef);
    if (teamsSnapshot.empty) {
      console.log('✅ No teams found in the database.');
      return;
    }
    console.log('\n📝 Remaining teams in database:');
    teamsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(` - ${data.name || doc.id} (${data.code || ''}) [Group: ${data.group || 'N/A'}]`);
    });
  }
  
  console.log('🏆 Teams by group:\n');
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(group => {
    const count = groupCounts[group] || 0;
    const status = count === 4 ? '✅' : '❌';
    console.log(`   ${status} Group ${group}: ${count}/4 teams`);
  });
  
  // List all teams
  console.log('\n📋 All teams in database:\n');
  const teams = [];
  teamsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    teams.push(data);
  });
  
  teams.sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.name.localeCompare(b.name);
  });
  
  teams.forEach(team => {
    console.log(`   ${team.flag} ${team.name.padEnd(20)} (${team.code}) - Group ${team.group}`);
  });
  
  console.log('\n✅ Verification complete!\n');


// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     AFCON 2025 - UPDATE TEAMS COLLECTION ONLY            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('⚠️  IMPORTANT: Make sure your Firebase rules allow writes!\n');
  console.log('   Firestore Rules → teams → allow write: if true;\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 This script will:\n');
  console.log('   1. Delete ALL existing teams');
  console.log('   2. Add ONLY 24 qualified AFCON 2025 teams');
  console.log('   3. Verify only qualified teams remain\n');
  console.log(`   Qualified teams: ${QUALIFIED_TEAMS.length}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    await deleteAllTeams();
    await addQualifiedTeams();
    await verifyTeams();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║               🎉 UPDATE COMPLETE! 🎉                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('✅ Your Firebase teams collection now contains:\n');
    console.log(`   • ONLY ${QUALIFIED_TEAMS.length} qualified AFCON 2025 teams`);
    console.log('   • 6 groups (A-F) with 4 teams each');
    console.log('   • All non-qualified teams removed\n');
    console.log('🔒 IMPORTANT: Change Firebase rules back to secure:\n');
    console.log('   teams → allow write: if request.auth != null;\n');
    console.log('🚀 Your teams collection is ready!\n');
    // List any remaining teams for debugging
    await listRemainingTeams();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main();