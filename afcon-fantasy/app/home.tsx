import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  Animated
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getTeam } from '../teamService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PlayerJersey from '../components/PlayerJersey';
import FootballPitch from '../components/FootballPitch';

interface Player {
  id: string;
  name: string;
  position: string;
  country: string;
  country_code: string;
}

export default function HomeScreen() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [startingPlayers, setStartingPlayers] = useState<Player[]>([]);
  const [captainName, setCaptainName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTeamData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const loadTeamData = async () => {
    try {
      if (!currentUser) return;

      const teamData = await getTeam(currentUser.uid);

      if (teamData) {
        setTeam(teamData);

        if (teamData.starting_xi && teamData.starting_xi.length > 0) {
          const playerPromises = teamData.starting_xi.map(async (playerId: string) => {
            const playerRef = doc(db, 'players', playerId);
            const playerSnap = await getDoc(playerRef);
            return { id: playerSnap.id, ...playerSnap.data() } as Player;
          });

          const players = await Promise.all(playerPromises);
          setStartingPlayers(players);

          if (teamData.captain_id) {
            const captain = players.find(p => p.id === teamData.captain_id);
            if (captain) setCaptainName(captain.name);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const groupPlayersByPosition = (players: Player[]) => {
    return {
      GK: players.filter(p => p.position === 'GK'),
      DEF: players.filter(p => p.position === 'DEF'),
      MID: players.filter(p => p.position === 'MID'),
      ATT: players.filter(p => p.position === 'ATT'),
    };
  };

  const getFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'MAR': '🇲🇦', 'EGY': '🇪🇬', 'NGA': '🇳🇬', 'SEN': '🇸🇳',
      'ALG': '🇩🇿', 'CIV': '🇨🇮', 'CMR': '🇨🇲', 'MLI': '🇲🇱',
      'TUN': '🇹🇳', 'RSA': '🇿🇦', 'COD': '🇨🇩', 'BFA': '🇧🇫',
      'GAB': '🇬🇦', 'UGA': '🇺🇬', 'ZAM': '🇿🇲', 'COM': '🇰🇲',
      'ZIM': '🇿🇼', 'ANG': '🇦🇴', 'TAN': '🇹🇿', 'BEN': '🇧🇯',
      'BOT': '🇧🇼', 'SUD': '🇸🇩', 'EQG': '🇬🇶', 'MOZ': '🇲🇿',
    };
    return flags[countryCode] || '⚽';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#37003c', '#2b0030', '#1a0020']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#00ff87" />
          <Text style={styles.loadingText}>Loading your squad...</Text>
        </LinearGradient>
      </View>
    );
  }

  const grouped = startingPlayers.length > 0 ? groupPlayersByPosition(startingPlayers) : null;

  const parseFormation = (formationStr: string | undefined) => {
    const def = { DEF: 4, MID: 4, ATT: 2, GK: 1 };
    if (!formationStr) return def;
    const parts = formationStr.split('-').map(p => parseInt(p, 10)).filter(Boolean);
    if (parts.length === 3) {
      return { DEF: parts[0], MID: parts[1], ATT: parts[2], GK: 1 };
    }
    return def;
  };

  const createPlaceholders = (counts: { DEF: number; MID: number; ATT: number; GK: number }) => {
    const make = (n: number, prefix: string) => Array.from({ length: n }).map((_, i) => ({ id: `ph-${prefix}-${i}` }));
    return {
      DEF: make(counts.DEF, 'DEF'),
      MID: make(counts.MID, 'MID'),
      ATT: make(counts.ATT, 'ATT'),
      GK: make(counts.GK, 'GK'),
    };
  };

  const formationCounts = parseFormation(team?.formation);
  const placeholders = createPlaceholders(formationCounts);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Animated Header */}
      <LinearGradient
        colors={['#37003c', '#2b0030', '#1a0020']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.username}>{currentUser?.email?.split('@')[0]}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards with Glass Effect - FIXED VALUE ALIGNMENT */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.statGradient}
            >
              <MaterialCommunityIcons name="trophy-variant" size={28} color="#00ff87" />
              <Text style={styles.statValue}>{team?.total_points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </LinearGradient>
          </View>
          
          {/* FIXED: Value card with proper alignment */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.statGradient}
            >
              <MaterialCommunityIcons name="cash-multiple" size={28} color="#00ff87" />
              <View style={styles.valueRow}>
                <Text style={styles.statValue}>${team?.total_value?.toFixed(1) || 0}</Text>
                <Text style={styles.valueUnit}>M</Text>
              </View>
              <Text style={styles.statLabel}>Value</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.statGradient}
            >
              <MaterialCommunityIcons name="trophy" size={28} color="#ffd700" />
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {team ? (
          <Animated.View style={[styles.teamCard, { opacity: fadeAnim }]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <MaterialCommunityIcons name="shield-star" size={28} color="#37003c" />
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Your Squad</Text>
                  <Text style={styles.cardSubtitle}>AFCON 2025</Text>
                </View>
              </View>
              <View style={styles.formationBadge}>
                <Text style={styles.formationText}>{team.formation}</Text>
              </View>
            </View>

            {captainName && (
              <View style={styles.captainRow}>
                <MaterialCommunityIcons name="star-circle" size={20} color="#ffd700" />
                <Text style={styles.captainText}>Captain: {captainName}</Text>
              </View>
            )}

            {/* ULTIMATE FOOTBALL PITCH WITH JERSEYS */}
            <FootballPitch>
              {grouped ? (
                <>
                  {/* Attackers */}
                  {(grouped.ATT.length > 0 ? grouped.ATT : placeholders.ATT).length > 0 && (
                    <View style={styles.pitchRow}>
                      {(grouped.ATT.length > 0 ? grouped.ATT : placeholders.ATT).map((player: any, index: number) => (
                        <PlayerJersey
                          key={player.id}
                          position="ATT"
                          playerName={player.name || ''}
                          number={grouped.ATT.length > 0 ? String(index + 9) : undefined}
                          isCaptain={team.captain_id === player.id}
                          isPlaceholder={grouped.ATT.length === 0}
                        />
                      ))}
                    </View>
                  )}

                  {/* Midfielders */}
                  {(grouped.MID.length > 0 ? grouped.MID : placeholders.MID).length > 0 && (
                    <View style={styles.pitchRow}>
                      {(grouped.MID.length > 0 ? grouped.MID : placeholders.MID).map((player: any, index: number) => (
                        <PlayerJersey
                          key={player.id}
                          position="MID"
                          playerName={player.name || ''}
                          number={grouped.MID.length > 0 ? String(index + 6) : undefined}
                          isCaptain={team.captain_id === player.id}
                          isPlaceholder={grouped.MID.length === 0}
                        />
                      ))}
                    </View>
                  )}

                  {/* Defenders */}
                  {(grouped.DEF.length > 0 ? grouped.DEF : placeholders.DEF).length > 0 && (
                    <View style={styles.pitchRow}>
                      {(grouped.DEF.length > 0 ? grouped.DEF : placeholders.DEF).map((player: any, index: number) => (
                        <PlayerJersey
                          key={player.id}
                          position="DEF"
                          playerName={player.name || ''}
                          number={grouped.DEF.length > 0 ? String(index + 2) : undefined}
                          isCaptain={team.captain_id === player.id}
                          isPlaceholder={grouped.DEF.length === 0}
                        />
                      ))}
                    </View>
                  )}

                  {/* Goalkeeper */}
                  {(grouped.GK.length > 0 ? grouped.GK : placeholders.GK).length > 0 && (
                    <View style={styles.pitchRow}>
                      {(grouped.GK.length > 0 ? grouped.GK : placeholders.GK).map((player: any, index: number) => (
                        <PlayerJersey
                          key={player.id}
                          position="GK"
                          playerName={player.name || ''}
                          number={grouped.GK.length > 0 ? '1' : undefined}
                          isCaptain={team.captain_id === player.id}
                          isPlaceholder={grouped.GK.length === 0}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noPlayersContainer}>
                  <Text style={styles.noPlayersText}>No players selected — tap Edit Squad to add players</Text>
                </View>
              )}
            </FootballPitch>

            {/* Edit Button */}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/squad' as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#37003c', '#2b0030']}
                style={styles.editGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                <Text style={styles.editText}>Edit Squad</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity 
            style={styles.createTeamCard}
            onPress={() => router.push('/squad' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#37003c10', '#37003c05']}
              style={styles.createTeamGradient}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={64} color="#37003c" />
              <Text style={styles.createTeamTitle}>Create Your Squad</Text>
              <Text style={styles.createTeamSubtitle}>Build your dream team and compete!</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/leaderboard' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBg}>
              <MaterialCommunityIcons name="podium-gold" size={32} color="#37003c" />
            </View>
            <Text style={styles.actionTitle}>Leaderboard</Text>
            <Text style={styles.actionSubtitle}>Check rankings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/fixtures' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBg}>
              <MaterialCommunityIcons name="calendar-month" size={32} color="#37003c" />
            </View>
            <Text style={styles.actionTitle}>Fixtures</Text>
            <Text style={styles.actionSubtitle}>Match schedule</Text>
          </TouchableOpacity>
        </View>
{/* Quick Actions Grid - INCLUDING MY LEAGUES */}
<View style={styles.actionsGrid}>
  <TouchableOpacity 
    style={styles.actionCard}
    onPress={() => router.push('/my-leagues')}
    activeOpacity={0.8}
  >
    <View style={[styles.actionIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
      <MaterialCommunityIcons name="trophy-variant" size={32} color="#8b5cf6" />
    </View>
    <Text style={styles.actionTitle}>My Leagues</Text>
    <Text style={styles.actionSubtitle}>Compete with friends</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.actionCard}
    onPress={() => router.push('/squad' as any)}
    activeOpacity={0.8}
  >
    <View style={styles.actionIconBg}>
      <MaterialCommunityIcons name="account-group" size={32} color="#37003c" />
    </View>
    <Text style={styles.actionTitle}>Squad</Text>
    <Text style={styles.actionSubtitle}>Manage team</Text>
  </TouchableOpacity>
</View>
        <View style={styles.spacer} />
      </ScrollView>
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
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 120,
  },
  // FIXED: New styles for proper value alignment
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  valueUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37003c',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  formationBadge: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  formationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
  },
  captainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 12,
  },
  captainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37003c',
    marginLeft: 8,
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 24,
  },
  editButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createTeamCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createTeamGradient: {
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#37003c20',
    borderStyle: 'dashed',
  },
  createTeamTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37003c',
    marginTop: 16,
  },
  createTeamSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12, // ADD THIS - spacing between rows
  },
  
  // Keep all your existing actionCard styles - they're perfect!
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  spacer: {
    height: 32,
  },
  noPlayersContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPlayersText: {
    color: '#fff',
    opacity: 0.95,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});