// seed-gameweeks.js
// Create gameweek schedule with deadlines for AFCON 2025

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  writeBatch, 
  doc,
  getDocs
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

// AFCON 2025 Gameweek Schedule
const GAMEWEEKS = [
  {
    number: 1,
    name: "Gameweek 1",
    deadline: new Date("2025-12-21T17:00:00Z"), // 1 hour before first match
    start_date: new Date("2025-12-21T18:00:00Z"),
    end_date: new Date("2025-12-23T23:59:59Z"),
    status: "upcoming", // upcoming, active, finished
    matches_count: 12,
    description: "Opening matches - Groups A-F"
  },
  {
    number: 2,
    name: "Gameweek 2",
    deadline: new Date("2025-12-24T17:00:00Z"),
    start_date: new Date("2025-12-24T18:00:00Z"),
    end_date: new Date("2025-12-26T23:59:59Z"),
    status: "upcoming",
    matches_count: 12,
    description: "Second round - Groups A-F"
  },
  {
    number: 3,
    name: "Gameweek 3",
    deadline: new Date("2025-12-27T17:00:00Z"),
    start_date: new Date("2025-12-27T18:00:00Z"),
    end_date: new Date("2025-12-30T23:59:59Z"),
    status: "upcoming",
    matches_count: 12,
    description: "Final group matches"
  },
  {
    number: 4,
    name: "Round of 16",
    deadline: new Date("2026-01-02T17:00:00Z"),
    start_date: new Date("2026-01-02T18:00:00Z"),
    end_date: new Date("2026-01-06T23:59:59Z"),
    status: "upcoming",
    matches_count: 8,
    description: "Knockout stage begins"
  },
  {
    number: 5,
    name: "Quarter-finals",
    deadline: new Date("2026-01-09T17:00:00Z"),
    start_date: new Date("2026-01-09T18:00:00Z"),
    end_date: new Date("2026-01-11T23:59:59Z"),
    status: "upcoming",
    matches_count: 4,
    description: "Quarter-final matches"
  },
  {
    number: 6,
    name: "Semi-finals",
    deadline: new Date("2026-01-15T17:00:00Z"),
    start_date: new Date("2026-01-15T18:00:00Z"),
    end_date: new Date("2026-01-15T23:59:59Z"),
    status: "upcoming",
    matches_count: 2,
    description: "Semi-final matches"
  },
  {
    number: 7,
    name: "Final",
    deadline: new Date("2026-01-18T17:00:00Z"),
    start_date: new Date("2026-01-18T18:00:00Z"),
    end_date: new Date("2026-01-18T23:59:59Z"),
    status: "upcoming",
    matches_count: 2, // Final + 3rd place
    description: "Final & Third place playoff"
  }
];

async function seedGameweeks() {
  console.log('\n📅 Seeding AFCON 2025 Gameweeks...\n');
  
  // Check if gameweeks already exist
  const gameweeksRef = collection(db, 'gameweeks');
  const existing = await getDocs(gameweeksRef);
  
  if (!existing.empty) {
    console.log(`⚠️  Found ${existing.size} existing gameweeks.`);
    console.log('Deleting old gameweeks...\n');
    
    const deleteBatch = writeBatch(db);
    existing.docs.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log('✅ Old gameweeks deleted.\n');
  }
  
  // Add new gameweeks
  const batch = writeBatch(db);
  
  GAMEWEEKS.forEach(gw => {
    const docRef = doc(gameweeksRef, `gw${gw.number}`);
    batch.set(docRef, {
      ...gw,
      created_at: new Date()
    });
    
    console.log(`✅ GW${gw.number}: ${gw.name}`);
    console.log(`   Deadline: ${gw.deadline.toLocaleString()}`);
    console.log(`   Matches: ${gw.matches_count}`);
    console.log('');
  });
  
  await batch.commit();
  
  console.log('🎉 All gameweeks added successfully!\n');
  console.log('Summary:');
  console.log(`   Total gameweeks: ${GAMEWEEKS.length}`);
  console.log(`   Total matches: ${GAMEWEEKS.reduce((sum, gw) => sum + gw.matches_count, 0)}`);
  console.log(`   Tournament: Dec 21, 2025 - Jan 18, 2026\n`);
  
  process.exit(0);
}

seedGameweeks().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});