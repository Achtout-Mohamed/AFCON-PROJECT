// app/browse-leagues.tsx - Browse Public Leagues
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface PublicLeague {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  adminId: string;
  isJoined: boolean;
}

export default function BrowseLeaguesScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [leagues, setLeagues] = useState<PublicLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadPublicLeagues();
  }, []);

  const loadPublicLeagues = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get all public leagues
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where('is_private', '==', false)
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);

      // Get user's current leagues
      const myLeaguesQuery = query(
        collection(db, 'league_members'),
        where('user_id', '==', currentUser.uid)
      );
      const myLeaguesSnapshot = await getDocs(myLeaguesQuery);
      const myLeagueIds = myLeaguesSnapshot.docs.map(doc => doc.data().league_id);

      const publicLeagues: PublicLeague[] = [];

      leaguesSnapshot.forEach((leagueDoc) => {
        const leagueData = leagueDoc.data();
        publicLeagues.push({
          id: leagueDoc.id,
          name: leagueData.name,
          code: leagueData.code,
          memberCount: leagueData.member_count || 0,
          adminId: leagueData.admin_id,
          isJoined: myLeagueIds.includes(leagueDoc.id),
        });
      });

      // Sort by member count (most popular first)
      publicLeagues.sort((a, b) => b.memberCount - a.memberCount);

      setLeagues(publicLeagues);
    } catch (error) {
      console.error('Error loading public leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (league: PublicLeague) => {
    if (!currentUser) return;

    try {
      setJoiningId(league.id);

      // Add user to league
      await addDoc(collection(db, 'league_members'), {
        league_id: league.id,
        user_id: currentUser.uid,
        joined_at: serverTimestamp(),
      });

      // Update member count
      await updateDoc(doc(db, 'leagues', league.id), {
        member_count: increment(1),
      });

      Alert.alert(
        'Success!',
        `You joined "${league.name}"`,
        [
          {
            text: 'View League',
            onPress: () => router.push(`/league-detail?id=${league.id}`),
          },
          { text: 'OK' },
        ]
      );

      // Refresh list
      loadPublicLeagues();
    } catch (error) {
      console.error('Error joining league:', error);
      Alert.alert('Error', 'Failed to join league. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const renderLeagueCard = ({ item }: { item: PublicLeague }) => (
    <View style={styles.leagueCard}>
      <LinearGradient
        colors={['rgba(0, 255, 135, 0.1)', 'rgba(0, 255, 135, 0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="earth" size={32} color="#00ff87" />
          <View style={styles.cardHeaderText}>
            <Text style={styles.leagueName}>{item.name}</Text>
            <View style={styles.memberRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.memberText}>{item.memberCount} members</Text>
            </View>
          </View>
        </View>

        {item.isJoined ? (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/league-detail?id=${item.id}`)}
          >
            <Text style={styles.viewButtonText}>View League</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#00ff87" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinLeague(item)}
            disabled={joiningId === item.id}
          >
            <LinearGradient
              colors={['#00ff87', '#00d674']}
              style={styles.joinButtonGradient}
            >
              {joiningId === item.id ? (
                <ActivityIndicator color="#37003c" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={20} color="#37003c" />
                  <Text style={styles.joinButtonText}>Join League</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#37003c', '#2b0030']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="earth" size={48} color="#00ff87" />
        <Text style={styles.title}>Public Leagues</Text>
        <Text style={styles.subtitle}>Join any league instantly</Text>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00ff87" />
            <Text style={styles.loadingText}>Loading public leagues...</Text>
          </View>
        ) : leagues.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="earth-off" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Public Leagues Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to create a public league!
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
  content: {
    flex: 1,
    padding: 20,
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
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  joinButtonText: {
    color: '#37003c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    gap: 8,
  },
  viewButtonText: {
    color: '#00ff87',
    fontSize: 16,
    fontWeight: 'bold',
  },
});