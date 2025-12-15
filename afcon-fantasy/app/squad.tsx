import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { saveTeam, getTeam } from '../teamService';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Player {
  id: string;
  name: string;
  country: string;
  country_code: string;
  position: string;
  value: number;
  team: string;
}

export default function SquadSelectionScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'name'>('value');
  const { currentUser } = useAuth();
  const router = useRouter();

  const BUDGET = 100;
  const MAX_PLAYERS = 15;
  const MAX_PER_POSITION = { GK: 2, DEF: 5, MID: 5, ATT: 3 };

  useEffect(() => {
    loadPlayersAndExistingSquad();
  }, []);

  const loadPlayersAndExistingSquad = async () => {
    try {
      // Load all players
      const playersRef = collection(db, 'players');
      const q = query(playersRef, orderBy('value', 'desc'));
      const snapshot = await getDocs(q);
      
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      
      setPlayers(playersData);

      // Load existing squad if user has one
      if (currentUser) {
        const existingTeam = await getTeam(currentUser.uid);
        
        if (existingTeam && existingTeam.squad && existingTeam.squad.length > 0) {
          console.log('📋 Loading existing squad:', existingTeam.squad);
          
          // Get full player details for selected players
          const selectedPlayerDetails = await Promise.all(
            existingTeam.squad.map(async (playerId: string) => {
              const playerDoc = await getDoc(doc(db, 'players', playerId));
              if (playerDoc.exists()) {
                return { id: playerDoc.id, ...playerDoc.data() } as Player;
              }
              return null;
            })
          );
          
          const validPlayers = selectedPlayerDetails.filter(p => p !== null) as Player[];
          setSelectedPlayers(validPlayers);
          console.log('✅ Loaded existing squad:', validPlayers.length, 'players');
        }
      }
    } catch (error) {
      console.error('❌ Error loading:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    return selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  };

  const getRemainingBudget = () => {
    return (BUDGET - calculateTotalValue()).toFixed(1);
  };

  const getPositionCount = (position: string) => {
    return selectedPlayers.filter(p => p.position === position).length;
  };

  const canAddPlayer = (player: Player) => {
    if (selectedPlayers.length >= MAX_PLAYERS) return false;
    if (selectedPlayers.find(p => p.id === player.id)) return false;
    
    const newTotal = calculateTotalValue() + player.value;
    if (newTotal > BUDGET) return false;
    
    const posCount = getPositionCount(player.position);
    if (posCount >= MAX_PER_POSITION[player.position as keyof typeof MAX_PER_POSITION]) return false;
    
    return true;
  };

  const handleSelectPlayer = (player: Player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);
    
    if (isSelected) {
      // Remove player
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      // Add player
      if (canAddPlayer(player)) {
        setSelectedPlayers([...selectedPlayers, player]);
      } else {
        const reason = 
          selectedPlayers.length >= MAX_PLAYERS ? 'Squad is full (15 players max)' :
          selectedPlayers.find(p => p.id === player.id) ? 'Player already selected' :
          calculateTotalValue() + player.value > BUDGET ? 'Insufficient budget' :
          `Maximum ${MAX_PER_POSITION[player.position as keyof typeof MAX_PER_POSITION]} ${player.position}s reached`;
        
        Alert.alert('Cannot Add Player', reason);
      }
    }
  };

  const handleSaveAndContinue = async () => {
    if (selectedPlayers.length !== MAX_PLAYERS) {
      Alert.alert('Incomplete Squad', `Select ${MAX_PLAYERS - selectedPlayers.length} more player(s)`);
      return;
    }

    try {
      if (!currentUser) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      console.log('💾 Saving squad...');
      const teamData = {
        squad: selectedPlayers.map(p => p.id),
        total_value: calculateTotalValue(),
      };

      await saveTeam(currentUser.uid, teamData);
      console.log('✅ Squad saved!');
      
      router.push('/starting-xi' as any);
    } catch (error) {
      console.error('❌ Error saving squad:', error);
      Alert.alert('Error', 'Failed to save squad');
    }
  };

  const filteredPlayers = players
    .filter(p => {
      const matchesPosition = filter === 'ALL' || p.position === filter;
      const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                            p.country.toLowerCase().includes(searchText.toLowerCase()) ||
                            p.team.toLowerCase().includes(searchText.toLowerCase());
      return matchesPosition && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      return a.name.localeCompare(b.name);
    });

  const getPositionColor = (position: string) => {
    switch(position) {
      case 'GK': return '#9b59b6';
      case 'DEF': return '#3498db';
      case 'MID': return '#e74c3c';
      case 'ATT': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'MAR': '🇲🇦', 'EGY': '🇪🇬', 'NGA': '🇳🇬', 'SEN': '🇸🇳',
      'ALG': '🇩🇿', 'CIV': '🇨🇮', 'CMR': '🇨🇲', 'MLI': '🇲🇱',
      'TUN': '🇹🇳', 'RSA': '🇿🇦', 'COD': '🇨🇩', 'BFA': '🇧🇫',
      'GAB': '🇬🇦', 'UGA': '🇺🇬', 'ZAM': '🇿🇲', 'COM': '🇰🇲',
      'ZIM': '🇿🇼', 'ANG': '🇦🇴', 'TAN': '🇹🇿', 'BEN': '🇧🇯',
      'BOT': '🇧🇼', 'SUD': '🇸🇩', 'EQG': '🇬�¶', 'MOZ': '🇲🇿',
    };
    return flags[countryCode] || '⚽';
  };

  const renderPlayerCard = ({ item }: { item: Player }) => {
    const isSelected = !!selectedPlayers.find(p => p.id === item.id);
    const canSelect = canAddPlayer(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.playerCard,
          isSelected && styles.playerCardSelected,
          !canSelect && !isSelected && styles.playerCardDisabled
        ]}
        onPress={() => handleSelectPlayer(item)}
        activeOpacity={0.7}
        disabled={!canSelect && !isSelected}
      >
        <View style={styles.playerLeft}>
          {/* Position Badge */}
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(item.position) }]}>
            <Text style={styles.positionText}>{item.position}</Text>
          </View>
          
          {/* Player Info */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.playerMeta}>
              <Text style={styles.flag}>{getFlag(item.country_code)}</Text>
              <Text style={styles.playerTeam} numberOfLines={1}>{item.team}</Text>
            </View>
          </View>
        </View>
        
        {/* Price & Selection */}
        <View style={styles.playerRight}>
          <Text style={styles.playerValue}>${item.value}M</Text>
          {isSelected ? (
            <View style={styles.removeBtn}>
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </View>
          ) : (
            <View style={[styles.addBtn, !canSelect && styles.addBtnDisabled]}>
              <Ionicons name="add-circle" size={24} color={canSelect ? "#00ff87" : "#ccc"} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff87" />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  const positionCounts = {
    GK: getPositionCount('GK'),
    DEF: getPositionCount('DEF'),
    MID: getPositionCount('MID'),
    ATT: getPositionCount('ATT'),
  };

  const totalSpent = calculateTotalValue();
  const remainingBudget = BUDGET - totalSpent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* FPL-Style Header */}
      <LinearGradient
        colors={['#37003c', '#2b0030']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick Squad</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Budget Bar - FIXED */}
        <View style={styles.budgetBar}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Remaining</Text>
            <Text style={[
              styles.budgetValue,
              remainingBudget < 0 && { color: '#ff4444' }
            ]}>
              ${remainingBudget.toFixed(1)}M
            </Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Selected</Text>
            <Text style={styles.budgetValue}>{selectedPlayers.length}/{MAX_PLAYERS}</Text>
          </View>
        </View>

        {/* Position Requirements */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.positionsBar}
        >
          <View style={styles.positionReq}>
            <View style={[styles.posReqDot, { backgroundColor: '#9b59b6' }]} />
            <Text style={styles.posReqText}>GK {positionCounts.GK}/2</Text>
          </View>
          <View style={styles.positionReq}>
            <View style={[styles.posReqDot, { backgroundColor: '#3498db' }]} />
            <Text style={styles.posReqText}>DEF {positionCounts.DEF}/5</Text>
          </View>
          <View style={styles.positionReq}>
            <View style={[styles.posReqDot, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.posReqText}>MID {positionCounts.MID}/5</Text>
          </View>
          <View style={styles.positionReq}>
            <View style={[styles.posReqDot, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.posReqText}>ATT {positionCounts.ATT}/3</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(pos => (
            <TouchableOpacity
              key={pos}
              style={[styles.filterTab, filter === pos && styles.filterTabActive]}
              onPress={() => setFilter(pos)}
            >
              <Text style={[styles.filterTabText, filter === pos && styles.filterTabTextActive]}>
                {pos === 'ALL' ? 'All' : pos}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.filterDivider} />
          
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setSortBy(sortBy === 'value' ? 'name' : 'value')}
          >
            <MaterialCommunityIcons 
              name={sortBy === 'value' ? 'currency-usd' : 'sort-alphabetical-ascending'} 
              size={18} 
              color="#666" 
            />
            <Text style={styles.sortBtnText}>
              {sortBy === 'value' ? 'Price' : 'Name'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Players List */}
      <FlatList
        data={filteredPlayers}
        renderItem={renderPlayerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
      />

      {/* Save Button - Shows Always if Squad is Complete */}
      {selectedPlayers.length === MAX_PLAYERS && (
        <TouchableOpacity 
          style={styles.continueBtn}
          onPress={handleSaveAndContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00ff87', '#00d674']}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueText}>Save & Continue</Text>
            <Ionicons name="checkmark-circle" size={20} color="#37003c" />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  budgetBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff87',
  },
  budgetDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  positionsBar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  positionReq: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  posReqDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  posReqText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#37003c',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  sortBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  playerCardSelected: {
    backgroundColor: '#f0fff4',
    borderWidth: 2,
    borderColor: '#00ff87',
  },
  playerCardDisabled: {
    opacity: 0.5,
  },
  playerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 16,
    marginRight: 6,
  },
  playerTeam: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  playerRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  playerValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#37003c',
    marginBottom: 6,
  },
  addBtn: {
    width: 28,
    height: 28,
  },
  addBtnDisabled: {
    opacity: 0.3,
  },
  removeBtn: {
    width: 28,
    height: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  continueBtn: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  continueGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 8,
  },
  continueText: {
    color: '#37003c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});