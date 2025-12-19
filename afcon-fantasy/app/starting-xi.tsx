import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { saveTeam, saveUserTeam, getUserTeam } from '../teamService';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Player {
  id: string;
  name: string;
  country: string;
  position: string;
  value: number;
}

export default function StartingXIScreen() {
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [startingXI, setStartingXI] = useState<Player[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSquad();
  }, []);

  const loadSquad = async () => {
    try {
      if (!currentUser) return;

      // First try user_teams (new system)
      const userTeamData = await getUserTeam(currentUser.uid);
      
      let teamData;
      if (userTeamData) {
        console.log('📋 Loading from user_teams');
        teamData = userTeamData;
      } else {
        // Fallback to teams collection
        console.log('📋 Loading from teams (legacy)');
        const teamRef = doc(db, 'teams', currentUser.uid);
        const teamSnap = await getDoc(teamRef);
        
        if (!teamSnap.exists()) {
          Alert.alert('Error', 'No squad found. Please select your squad first.');
          router.back();
          return;
        }
        teamData = teamSnap.data();
      }

      const playerIds = teamData.squad;

      const playerPromises = playerIds.map(async (playerId: string) => {
        const playerRef = doc(db, 'players', playerId);
        const playerSnap = await getDoc(playerRef);
        return { id: playerSnap.id, ...playerSnap.data() } as Player;
      });

      const players = await Promise.all(playerPromises);
      setSquadPlayers(players);
      
      if (teamData.starting_xi && teamData.starting_xi.length > 0) {
        const startingPlayers = players.filter(p => teamData.starting_xi.includes(p.id));
        setStartingXI(startingPlayers);
        setCaptainId(teamData.captain_id);
        setViceCaptainId(teamData.vice_captain_id);
      }
    } catch (error) {
      console.error('❌ Error loading squad:', error);
      Alert.alert('Error', 'Failed to load squad');
    } finally {
      setLoading(false);
    }
  };

  const getPositionCount = (position: string, players: Player[]) => {
    return players.filter(p => p.position === position).length;
  };

  const canAddToStartingXI = (player: Player) => {
    if (startingXI.length >= 11) return false;

    const gkCount = getPositionCount('GK', startingXI);
    const defCount = getPositionCount('DEF', startingXI);
    const midCount = getPositionCount('MID', startingXI);
    const attCount = getPositionCount('ATT', startingXI);

    if (player.position === 'GK' && gkCount >= 1) return false;
    if (player.position === 'DEF' && defCount >= 5) return false;
    if (player.position === 'MID' && midCount >= 5) return false;
    if (player.position === 'ATT' && attCount >= 3) return false;

    return true;
  };

  const handleTogglePlayer = (player: Player) => {
    const isInStarting = startingXI.find(p => p.id === player.id);

    if (isInStarting) {
      setStartingXI(startingXI.filter(p => p.id !== player.id));
      if (captainId === player.id) setCaptainId(null);
      if (viceCaptainId === player.id) setViceCaptainId(null);
    } else {
      if (canAddToStartingXI(player)) {
        setStartingXI([...startingXI, player]);
      } else {
        Alert.alert('Cannot add', 'Check formation limits or max 11 players');
      }
    }
  };

  const handleSetCaptain = (playerId: string) => {
    if (!startingXI.find(p => p.id === playerId)) {
      Alert.alert('Error', 'Player must be in Starting XI');
      return;
    }
    setCaptainId(playerId);
  };

  const handleSetViceCaptain = (playerId: string) => {
    if (!startingXI.find(p => p.id === playerId)) {
      Alert.alert('Error', 'Player must be in Starting XI');
      return;
    }
    if (playerId === captainId) {
      Alert.alert('Error', 'Captain and Vice-captain must be different');
      return;
    }
    setViceCaptainId(playerId);
  };

  const isFormationValid = () => {
    const gkCount = getPositionCount('GK', startingXI);
    const defCount = getPositionCount('DEF', startingXI);
    const midCount = getPositionCount('MID', startingXI);
    const attCount = getPositionCount('ATT', startingXI);

    return (
      gkCount === 1 &&
      defCount >= 3 && defCount <= 5 &&
      midCount >= 2 && midCount <= 5 &&
      attCount >= 1 && attCount <= 3 &&
      startingXI.length === 11
    );
  };

  const handleSaveTeam = async () => {
    if (startingXI.length !== 11) {
      Alert.alert('Error', 'Select exactly 11 players for Starting XI');
      return;
    }

    if (!isFormationValid()) {
      Alert.alert('Invalid Formation', 'Formation must be: 1 GK, 3-5 DEF, 2-5 MID, 1-3 ATT');
      return;
    }

    if (!captainId) {
      Alert.alert('Error', 'Please select a Captain');
      return;
    }

    if (!viceCaptainId) {
      Alert.alert('Error', 'Please select a Vice-captain');
      return;
    }

    try {
      if (!currentUser) return;

      // Show loading state
      setLoading(true);
      console.log('💾 Saving Starting XI...');

      const totalValue = squadPlayers.reduce((sum, p) => sum + p.value, 0);
      const budget = 100 - totalValue;

      const teamData = {
        squad: squadPlayers.map(p => p.id),
        starting_xi: startingXI.map(p => p.id),
        captain_id: captainId,
        vice_captain_id: viceCaptainId,
        formation: `${getPositionCount('DEF', startingXI)}-${getPositionCount('MID', startingXI)}-${getPositionCount('ATT', startingXI)}`,
        total_value: totalValue,
        budget: budget,
        free_transfers: 1,
      };

      // Save to user_teams collection (for transfers system)
      await saveUserTeam(currentUser.uid, teamData);
      console.log('✅ Team saved to user_teams!');

      // Also save to teams collection (for backward compatibility)
      await saveTeam(currentUser.uid, teamData);
      console.log('✅ Team saved to teams!');
      
      // Navigate immediately after successful save
      router.replace('/(tabs)' as any);
      
    } catch (error) {
      console.error('❌ Error saving team:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to save team. Please try again.');
    }
  };

  const getPositionColor = (position: string) => {
    switch(position) {
      case 'GK': return '#9b59b6';
      case 'DEF': return '#f39c12';
      case 'MID': return '#3498db';
      case 'ATT': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderPlayerCard = ({ item }: { item: Player }) => {
    const isInStarting = !!startingXI.find(p => p.id === item.id);
    const isCaptain = captainId === item.id;
    const isViceCaptain = viceCaptainId === item.id;

    return (
      <View style={styles.playerCard}>
        <TouchableOpacity
          style={[styles.playerMain, isInStarting && styles.playerSelected]}
          onPress={() => handleTogglePlayer(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.positionCircle, { backgroundColor: getPositionColor(item.position) }]}>
            <Text style={styles.positionText}>{item.position}</Text>
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.playerCountry}>{item.country}</Text>
          </View>

          {isInStarting && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#00ff87" />
            </View>
          )}
        </TouchableOpacity>

        {isInStarting && (
          <View style={styles.captainButtons}>
            <TouchableOpacity
              style={[styles.captainBtn, isCaptain && styles.captainBtnActive]}
              onPress={() => handleSetCaptain(item.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="star" 
                size={16} 
                color={isCaptain ? '#fff' : '#666'} 
              />
              <Text style={[styles.captainBtnText, isCaptain && styles.captainBtnTextActive]}>
                Captain
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captainBtn, isViceCaptain && styles.viceCaptainBtnActive]}
              onPress={() => handleSetViceCaptain(item.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="star-half-full" 
                size={16} 
                color={isViceCaptain ? '#fff' : '#666'} 
              />
              <Text style={[styles.captainBtnText, isViceCaptain && styles.captainBtnTextActive]}>
                Vice
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff87" />
        <Text style={styles.loadingText}>Loading squad...</Text>
      </View>
    );
  }

  const gkCount = getPositionCount('GK', startingXI);
  const defCount = getPositionCount('DEF', startingXI);
  const midCount = getPositionCount('MID', startingXI);
  const attCount = getPositionCount('ATT', startingXI);

  const canSave = startingXI.length === 11 && captainId && viceCaptainId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#37003c', '#2b0030']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <MaterialCommunityIcons name="account-group" size={48} color="#00ff87" />
        <Text style={styles.title}>Starting XI</Text>
        <Text style={styles.subtitle}>Select 11 players to start</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{startingXI.length}/11</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{gkCount}-{defCount}-{midCount}-{attCount}</Text>
            <Text style={styles.statLabel}>Formation</Text>
          </View>
        </View>

        {captainId && viceCaptainId && (
          <View style={styles.captainInfoRow}>
            <View style={styles.captainInfo}>
              <MaterialCommunityIcons name="star" size={16} color="#ffd700" />
              <Text style={styles.captainInfoText}>Captain set</Text>
            </View>
            <View style={styles.captainInfo}>
              <MaterialCommunityIcons name="star-half-full" size={16} color="#ffd700" />
              <Text style={styles.captainInfoText}>Vice set</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={squadPlayers}
        renderItem={renderPlayerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity 
        style={[styles.fabButton, (!canSave || loading) && styles.fabButtonDisabled]} 
        onPress={handleSaveTeam}
        disabled={!canSave || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canSave && !loading ? ['#00ff87', '#00d674'] : ['#ccc', '#999']}
          style={styles.fabGradient}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#37003c" />
              <Text style={styles.fabText}>Saving...</Text>
            </>
          ) : (
            <>
              <Text style={styles.fabText}>
                {canSave ? 'Confirm Team' : `Need: ${!captainId ? 'Captain' : !viceCaptainId ? 'Vice' : '11 players'}`}
              </Text>
              {canSave && <Ionicons name="checkmark-circle" size={24} color="#37003c" />}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#37003c',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginTop: 4,
  },
  captainInfoRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  captainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  captainInfoText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playerSelected: {
    backgroundColor: '#f0fff4',
  },
  positionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerCountry: {
    fontSize: 14,
    color: '#666',
  },
  checkBadge: {
    marginLeft: 8,
  },
  captainButtons: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  captainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  captainBtnActive: {
    backgroundColor: '#ffd700',
  },
  viceCaptainBtnActive: {
    backgroundColor: '#c0c0c0',
  },
  captainBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  captainBtnTextActive: {
    color: '#fff',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonDisabled: {
    opacity: 0.6,
  },
  fabGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  fabText: {
    color: '#37003c',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});