// app/my-leagues.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface League {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  yourRank: number;
  adminId: string; // ADD THIS
  isPrivate: boolean; // ADD THIS
}

export default function MyLeaguesScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyLeagues();
  }, []);

  const loadMyLeagues = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get all leagues where user is a member
      const membersQuery = query(
        collection(db, 'league_members'),
        where('user_id', '==', currentUser.uid)
      );
      const membersSnapshot = await getDocs(membersQuery);

      const leaguesData: League[] = [];

      // For each membership, get the league details
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const leagueId = memberData.league_id;

        // Get league details
        const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
        if (leagueDoc.exists()) {
          const leagueData = leagueDoc.data();

          // Calculate user's rank in this league
          const rank = await calculateUserRank(leagueId, currentUser.uid);

          leaguesData.push({
  id: leagueDoc.id,
  name: leagueData.name,
  code: leagueData.code,
  memberCount: leagueData.member_count || 0,
  yourRank: rank,
  adminId: leagueData.admin_id, // ADD THIS
  isPrivate: leagueData.is_private || false, // ADD THIS
});
        }
      }

      setLeagues(leaguesData);
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserRank = async (leagueId: string, userId: string): Promise<number> => {
    try {
      // Get all members of this league
      const membersQuery = query(
        collection(db, 'league_members'),
        where('league_id', '==', leagueId)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // Get user data for each member (to get their points)
      const membersWithPoints = [];
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const userDoc = await getDoc(doc(db, 'users', memberData.user_id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          membersWithPoints.push({
            userId: memberData.user_id,
            points: userData.total_points || 0,
          });
        }
      }

      // Sort by points (descending)
      membersWithPoints.sort((a, b) => b.points - a.points);

      // Find user's rank
      const userIndex = membersWithPoints.findIndex(m => m.userId === userId);
      return userIndex + 1; // Rank is index + 1
    } catch (error) {
      console.error('Error calculating rank:', error);
      return 0;
    }
  };
const renderLeagueCard = ({ item }: { item: League }) => {
  const isAdmin = item.adminId === currentUser?.uid;
  // FIXED: Only show code if you're admin (regardless of privacy)
  const showCode = isAdmin;

  return (
    <TouchableOpacity
      style={styles.leagueCard}
      onPress={() => router.push(`/league-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(55, 0, 60, 0.8)', 'rgba(43, 0, 48, 0.6)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <MaterialCommunityIcons name="trophy" size={24} color="#00ff87" />
            <Text style={styles.leagueName}>{item.name}</Text>
          </View>
          {isAdmin && (
            <View style={styles.adminBadgeSmall}>
              <MaterialCommunityIcons name="shield-crown" size={16} color="#FFD700" />
            </View>
          )}
        </View>

        {/* Privacy Badge */}
        <View style={[
          styles.privacyBadgeCard,
          item.isPrivate ? styles.privateBadgeCard : styles.publicBadgeCard
        ]}>
          <MaterialCommunityIcons 
            name={item.isPrivate ? 'lock' : 'earth'} 
            size={14} 
            color={item.isPrivate ? '#ff6b6b' : '#00ff87'} 
          />
          <Text style={[
            styles.privacyBadgeTextCard,
            item.isPrivate ? styles.privateBadgeTextCard : styles.publicBadgeTextCard
          ]}>
            {item.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="account-group" size={20} color="#00ff87" />
            <Text style={styles.statText}>{item.memberCount} members</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons name="medal" size={20} color="#00ff87" />
            <Text style={styles.statText}>Rank #{item.yourRank}</Text>
          </View>
        </View>

        {/* CODE - Only show if admin */}
        {showCode && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>League Code (Admin only):</Text>
            <Text style={styles.code}>{item.code}</Text>
          </View>
        )}

        {/* If not admin, show message */}
        {!showCode && item.isPrivate && (
          <View style={styles.codeContainerLocked}>
            <MaterialCommunityIcons name="lock" size={16} color="#ff6b6b" />
            <Text style={styles.codeLocked}>Private league • Ask admin for code</Text>
          </View>
        )}

        {!showCode && !item.isPrivate && (
          <View style={styles.codeContainerPublic}>
            <MaterialCommunityIcons name="earth" size={16} color="#00ff87" />
            <Text style={styles.codePublic}>Public league • Anyone can join</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#37003c', '#2b0030']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
        <MaterialCommunityIcons name="trophy-variant" size={48} color="#00ff87" />
        <Text style={styles.title}>My Leagues</Text>
        <Text style={styles.subtitle}>
          {leagues.length === 0 ? 'No leagues yet' : `${leagues.length} league${leagues.length !== 1 ? 's' : ''}`}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/create-league')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00ff87', '#00d674']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#37003c" />
              <Text style={[styles.buttonText, { color: '#37003c' }]}>Create League</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/join-league')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="login" size={24} color="#fff" />
              <Text style={styles.buttonText}>Join League</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
{/* NEW - Browse Public Leagues Button */}
<TouchableOpacity
  style={styles.browseButton}
  onPress={() => router.push('/browse-leagues')}
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['rgba(0, 255, 135, 0.15)', 'rgba(0, 255, 135, 0.05)']}
    style={styles.browseButtonGradient}
  >
    <MaterialCommunityIcons name="earth" size={28} color="#00ff87" />
    <View style={styles.browseButtonText}>
      <Text style={styles.browseButtonTitle}>Browse Public Leagues</Text>
      <Text style={styles.browseButtonSubtitle}>Join instantly without code</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#00ff87" />
  </LinearGradient>
</TouchableOpacity>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00ff87" />
            <Text style={styles.loadingText}>Loading leagues...</Text>
          </View>
        ) : leagues.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Leagues Yet</Text>
            <Text style={styles.emptyText}>
              Create your own league or join one using a code!
            </Text>
          </View>
        ) : (
          <FlatList
            data={leagues}
            renderItem={renderLeagueCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0118',
  },
  browseButton: {
  borderRadius: 16,
  overflow: 'hidden',
  marginBottom: 20,
  borderWidth: 1,
  borderColor: 'rgba(0, 255, 135, 0.3)',
},
browseButtonGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 18,
  gap: 16,
},
browseButtonText: {
  flex: 1,
},
browseButtonTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 4,
},
browseButtonSubtitle: {
  fontSize: 13,
  color: 'rgba(255, 255, 255, 0.6)',
},
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  // Add to StyleSheet in my-leagues.tsx

adminBadgeSmall: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(255, 215, 0, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
},
privacyBadgeCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  alignSelf: 'flex-start',
  marginBottom: 12,
},
privateBadgeCard: {
  backgroundColor: 'rgba(255, 107, 107, 0.2)',
  borderWidth: 1,
  borderColor: 'rgba(255, 107, 107, 0.4)',
},
publicBadgeCard: {
  backgroundColor: 'rgba(0, 255, 135, 0.2)',
  borderWidth: 1,
  borderColor: 'rgba(0, 255, 135, 0.4)',
},
privacyBadgeTextCard: {
  fontSize: 11,
  fontWeight: 'bold',
},
privateBadgeTextCard: {
  color: '#ff6b6b',
},
publicBadgeTextCard: {
  color: '#00ff87',
},
codeContainerLocked: {
  backgroundColor: 'rgba(255, 107, 107, 0.1)',
  padding: 12,
  borderRadius: 8,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
codeLocked: {
  color: '#ff6b6b',
  fontSize: 12,
  fontWeight: 'bold',
},
codeContainerPublic: {
  backgroundColor: 'rgba(0, 255, 135, 0.1)',
  padding: 12,
  borderRadius: 8,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
codePublic: {
  color: '#00ff87',
  fontSize: 12,
  fontWeight: 'bold',
},
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ff87',
    fontSize: 16,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 20,
  },
  leagueCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
  },
  codeContainer: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  code: {
    color: '#00ff87',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});