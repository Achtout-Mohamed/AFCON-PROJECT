// app/(tabs)/transfers.tsx
// Transfers screen - Allow users to make squad changes between gameweeks

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface Player {
  id: string;
  name: string;
  country: string;
  country_code: string;
  position: string;
  value: number;
  team: string;
  total_points: number;
}

interface Transfer {
  playerOut: Player;
  playerIn: Player;
}

interface Gameweek {
  number: number;
  name: string;
  deadline: Date;
  status: string;
}

export default function TransfersScreen() {
  const [loading, setLoading] = useState(true);
  const [currentSquad, setCurrentSquad] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<Player | null>(null);
  const [currentGameweek, setCurrentGameweek] = useState<Gameweek | null>(null);
  const [userBudget, setUserBudget] = useState(0);
  const [freeTransfersRemaining, setFreeTransfersRemaining] = useState(1);
  const [showPlayerList, setShowPlayerList] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Load current gameweek
      const gameweekData = await getCurrentGameweek();
      setCurrentGameweek(gameweekData);

      // Load user's squad
      const squadData = await loadUserSquad(user.uid);
      setCurrentSquad(squadData);

      // Load available players
      const playersData = await loadAllPlayers();
      setAvailablePlayers(playersData);

      // Load user budget and free transfers
      const userData = await getDoc(doc(db, 'users', user.uid));
      if (userData.exists()) {
        setUserBudget(userData.data().budget || 0);
        setFreeTransfersRemaining(userData.data().free_transfers || 1);
      }

    } catch (error) {
      console.error('Error loading transfers data:', error);
      Alert.alert('Error', 'Failed to load transfer data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentGameweek = async (): Promise<Gameweek | null> => {
    const gameweeksRef = collection(db, 'gameweeks');
    const snapshot = await getDocs(gameweeksRef);
    
    const now = new Date();
    let currentGW: Gameweek | null = null;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const deadline = data.deadline.toDate();
      
      if (deadline > now && (!currentGW || deadline < currentGW.deadline)) {
        currentGW = {
          number: data.number,
          name: data.name,
          deadline: deadline,
          status: data.status
        };
      }
    });

    return currentGW;
  };

  const loadUserSquad = async (userId: string): Promise<Player[]> => {
    const userTeamDoc = await getDoc(doc(db, 'user_teams', userId));
    if (!userTeamDoc.exists()) return [];

    const playerIds = userTeamDoc.data().squad || [];
    const playersRef = collection(db, 'players');
    const players: Player[] = [];

    for (const playerId of playerIds) {
      const playerDoc = await getDoc(doc(playersRef, playerId));
      if (playerDoc.exists()) {
        players.push({ id: playerDoc.id, ...playerDoc.data() } as Player);
      }
    }

    return players;
  };

  const loadAllPlayers = async (): Promise<Player[]> => {
    const playersRef = collection(db, 'players');
    const snapshot = await getDocs(playersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
  };

  const handleSelectPlayerOut = (player: Player) => {
    setSelectedPlayerOut(player);
    setShowPlayerList(true);
  };

  const handleSelectPlayerIn = (playerIn: Player) => {
    if (!selectedPlayerOut) return;

    // Check if already in transfers
    const existingTransfer = transfers.find(t => t.playerOut.id === selectedPlayerOut.id);
    if (existingTransfer) {
      Alert.alert('Error', 'You already have a transfer planned for this player');
      return;
    }

    // Check if playerIn is already in squad (after applying pending transfers)
    const finalSquad = getFinalSquad();
    if (finalSquad.find(p => p.id === playerIn.id)) {
      Alert.alert('Error', 'This player is already in your squad');
      return;
    }

    // Check budget
    const newBudget = calculateBudget([...transfers, { playerOut: selectedPlayerOut, playerIn }]);
    if (newBudget < 0) {
      Alert.alert('Insufficient Funds', `You need ${Math.abs(newBudget).toFixed(1)}M more`);
      return;
    }

    // Check position limits
    if (!validatePositionLimits([...transfers, { playerOut: selectedPlayerOut, playerIn }])) {
      Alert.alert('Error', 'This transfer would violate position limits');
      return;
    }

    // Add transfer
    setTransfers([...transfers, { playerOut: selectedPlayerOut, playerIn }]);
    setSelectedPlayerOut(null);
    setShowPlayerList(false);
  };

  const removeTransfer = (transfer: Transfer) => {
    setTransfers(transfers.filter(t => t !== transfer));
  };

  const getFinalSquad = (): Player[] => {
    let squad = [...currentSquad];
    transfers.forEach(t => {
      squad = squad.filter(p => p.id !== t.playerOut.id);
      squad.push(t.playerIn);
    });
    return squad;
  };

  const calculateBudget = (pendingTransfers: Transfer[]): number => {
    let budget = userBudget;
    pendingTransfers.forEach(t => {
      budget += t.playerOut.value;
      budget -= t.playerIn.value;
    });
    return budget;
  };

  const validatePositionLimits = (pendingTransfers: Transfer[]): boolean => {
    const finalSquad = getFinalSquad();
    const positions = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
    
    finalSquad.forEach(player => {
      positions[player.position as keyof typeof positions]++;
    });

    return positions.GK === 2 && positions.DEF === 5 && 
           positions.MID === 5 && positions.ATT === 3;
  };

  const confirmTransfers = async () => {
    if (transfers.length === 0) {
      Alert.alert('No Transfers', 'You haven\'t made any transfers yet');
      return;
    }

    const pointsCost = Math.max(0, (transfers.length - freeTransfersRemaining) * 4);
    const message = `Confirm ${transfers.length} transfer(s)?\n\n` +
                   `Points deduction: ${pointsCost} points\n` +
                   `Free transfers used: ${Math.min(transfers.length, freeTransfersRemaining)}`;

    Alert.alert('Confirm Transfers', message, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        onPress: async () => {
          try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // Apply transfers to user's team
            const finalSquad = getFinalSquad();
            const squadIds = finalSquad.map(p => p.id);

            await updateDoc(doc(db, 'user_teams', user.uid), {
              squad: squadIds,
              budget: calculateBudget(transfers),
              free_transfers: Math.max(0, freeTransfersRemaining - transfers.length)
            });

            // Deduct points if needed
            if (pointsCost > 0) {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              const currentPoints = userDoc.data()?.total_points || 0;
              await updateDoc(doc(db, 'users', user.uid), {
                total_points: currentPoints - pointsCost
              });
            }

            Alert.alert('Success', 'Transfers confirmed!');
            setTransfers([]);
            loadData();
          } catch (error) {
            console.error('Error confirming transfers:', error);
            Alert.alert('Error', 'Failed to confirm transfers');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const getTransferCost = (): number => {
    return Math.max(0, (transfers.length - freeTransfersRemaining) * 4);
  };

  const getTimeUntilDeadline = (): string => {
    if (!currentGameweek) return 'No deadline';
    
    const now = new Date();
    const diff = currentGameweek.deadline.getTime() - now.getTime();
    
    if (diff < 0) return 'Deadline passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Loading transfers...</Text>
      </View>
    );
  }

  if (showPlayerList && selectedPlayerOut) {
    const samePositionPlayers = availablePlayers.filter(
      p => p.position === selectedPlayerOut.position && 
      !currentSquad.find(s => s.id === p.id)
    );

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setShowPlayerList(false);
              setSelectedPlayerOut(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Replacement</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.transferInfo}>
          <Text style={styles.transferOutLabel}>Transferring Out:</Text>
          <Text style={styles.transferOutPlayer}>{selectedPlayerOut.name}</Text>
        </View>

        <FlatList
          data={samePositionPlayers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playerCard}
              onPress={() => handleSelectPlayerIn(item)}
            >
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerTeam}>{item.country} • {item.team}</Text>
              </View>
              <View style={styles.playerStats}>
                <Text style={styles.playerValue}>£{item.value}M</Text>
                <Text style={styles.playerPoints}>{item.total_points} pts</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#9333EA', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Transfers</Text>
            <Text style={styles.headerSubtitle}>{currentGameweek?.name || 'No active gameweek'}</Text>
          </View>
          <View style={styles.deadlineBox}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.deadlineText}>{getTimeUntilDeadline()}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Free Transfers</Text>
          <Text style={styles.statValue}>{freeTransfersRemaining}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Budget</Text>
          <Text style={styles.statValue}>£{calculateBudget(transfers).toFixed(1)}M</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Cost</Text>
          <Text style={[styles.statValue, getTransferCost() > 0 && styles.costNegative]}>
            {getTransferCost() > 0 ? `-${getTransferCost()}` : '0'} pts
          </Text>
        </View>
      </View>

      {transfers.length > 0 && (
        <View style={styles.transfersSection}>
          <Text style={styles.sectionTitle}>Pending Transfers ({transfers.length})</Text>
          {transfers.map((transfer, index) => (
            <View key={index} style={styles.transferCard}>
              <View style={styles.transferRow}>
                <View style={styles.transferPlayer}>
                  <Ionicons name="arrow-up-circle" size={20} color="#EF4444" />
                  <View style={styles.transferPlayerInfo}>
                    <Text style={styles.transferPlayerName}>{transfer.playerOut.name}</Text>
                    <Text style={styles.transferPlayerValue}>£{transfer.playerOut.value}M</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#6B7280" />
                <View style={styles.transferPlayer}>
                  <Ionicons name="arrow-down-circle" size={20} color="#10B981" />
                  <View style={styles.transferPlayerInfo}>
                    <Text style={styles.transferPlayerName}>{transfer.playerIn.name}</Text>
                    <Text style={styles.transferPlayerValue}>£{transfer.playerIn.value}M</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeTransfer(transfer)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setTransfers([])}
            >
              <Text style={styles.buttonSecondaryText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={confirmTransfers}
            >
              <Text style={styles.buttonPrimaryText}>Confirm Transfers</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.squadSection}>
        <Text style={styles.sectionTitle}>Your Squad</Text>
        {['GK', 'DEF', 'MID', 'ATT'].map(position => {
          const positionPlayers = currentSquad.filter(p => p.position === position);
          return (
            <View key={position} style={styles.positionSection}>
              <Text style={styles.positionTitle}>{position}</Text>
              {positionPlayers.map(player => {
                const beingTransferred = transfers.find(t => t.playerOut.id === player.id);
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.squadPlayerCard,
                      beingTransferred && styles.squadPlayerCardOut
                    ]}
                    onPress={() => !beingTransferred && handleSelectPlayerOut(player)}
                  >
                    <View style={styles.squadPlayerInfo}>
                      <Text style={styles.squadPlayerName}>{player.name}</Text>
                      <Text style={styles.squadPlayerTeam}>{player.country}</Text>
                    </View>
                    <View style={styles.squadPlayerStats}>
                      <Text style={styles.squadPlayerValue}>£{player.value}M</Text>
                      {!beingTransferred && (
                        <Ionicons name="swap-horizontal" size={20} color="#9333EA" />
                      )}
                      {beingTransferred && (
                        <Text style={styles.transferringOut}>Transferring Out</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  deadlineText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  costNegative: {
    color: '#EF4444',
  },
  transfersSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  transferCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transferPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transferPlayerInfo: {
    flex: 1,
  },
  transferPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  transferPlayerValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#9333EA',
  },
  buttonSecondary: {
    backgroundColor: '#E5E7EB',
  },
  buttonPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  squadSection: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  positionSection: {
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  squadPlayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  squadPlayerCardOut: {
    backgroundColor: '#FEE2E2',
    opacity: 0.7,
  },
  squadPlayerInfo: {
    flex: 1,
  },
  squadPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  squadPlayerTeam: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  squadPlayerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadPlayerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  transferringOut: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  transferInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  transferOutLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  transferOutPlayer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 16,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  playerTeam: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  playerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  playerPoints: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});