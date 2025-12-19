// scripts/initializeLeagues.js
// Run this ONCE to create initial collections

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

async function initializeLeagues() {
  try {
    // Create a test league
    const leagueRef = await addDoc(collection(db, 'leagues'), {
      name: 'Test League',
      code: 'TEST01',
      admin_id: 'your_user_id_here',
      created_at: new Date(),
      member_count: 1,
    });

    console.log('✅ Test league created:', leagueRef.id);

    // Create a test member
    await addDoc(collection(db, 'league_members'), {
      league_id: leagueRef.id,
      user_id: 'your_user_id_here',
      joined_at: new Date(),
    });

    console.log('✅ Test member added');
    console.log('🎉 Leagues initialized successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initializeLeagues();