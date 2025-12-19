import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export const saveTeam = async (userId, teamData) => {
  try {
    console.log('💾 Saving team for user:', userId);
    
    const teamRef = doc(db, 'teams', userId);
    await setDoc(teamRef, {
      user_id: userId,
      squad: teamData.squad, // Array of 15 player IDs
      starting_xi: teamData.starting_xi || [], // Array of 11 player IDs
      captain_id: teamData.captain_id || null,
      vice_captain_id: teamData.vice_captain_id || null,
      formation: teamData.formation || '4-4-2',
      total_value: teamData.total_value,
      total_points: 0,
      updated_at: new Date(),
      created_at: new Date()
    });
    
    console.log('✅ Team saved successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error saving team:', error);
    throw error;
  }
};

export const getTeam = async (userId) => {
  try {
    console.log('📖 Loading team for user:', userId);
    
    const teamRef = doc(db, 'teams', userId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      console.log('✅ Team loaded!');
      return teamSnap.data();
    } else {
      console.log('ℹ️ No team found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading team:', error);
    throw error;
  }
};

// NEW FUNCTION: Save to user_teams collection (for transfers system)
export const saveUserTeam = async (userId, teamData) => {
  try {
    console.log('💾 Saving user_team for user:', userId);
    
    const userTeamRef = doc(db, 'user_teams', userId);
    await setDoc(userTeamRef, {
      user_id: userId,
      squad: teamData.squad, // Array of 15 player IDs
      starting_xi: teamData.starting_xi || [], // Array of 11 player IDs
      captain_id: teamData.captain_id || null,
      vice_captain_id: teamData.vice_captain_id || null,
      formation: teamData.formation || '4-4-2',
      total_value: teamData.total_value,
      budget: teamData.budget || 0, // Remaining budget
      free_transfers: teamData.free_transfers || 1, // Free transfers available
      total_points: 0,
      updated_at: new Date(),
      created_at: new Date()
    });
    
    console.log('✅ User team saved successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error saving user team:', error);
    throw error;
  }
};

// NEW FUNCTION: Get from user_teams collection
export const getUserTeam = async (userId) => {
  try {
    console.log('📖 Loading user_team for user:', userId);
    
    const userTeamRef = doc(db, 'user_teams', userId);
    const userTeamSnap = await getDoc(userTeamRef);
    
    if (userTeamSnap.exists()) {
      console.log('✅ User team loaded!');
      return userTeamSnap.data();
    } else {
      console.log('ℹ️ No user team found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading user team:', error);
    throw error;
  }
};