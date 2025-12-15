import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LeaderboardEntry {
  id: string;
  username: string;
  email: string;
  total_points: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      console.log('📊 Loading leaderboard...');
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('total_points', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      const entries = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data(),
      })) as LeaderboardEntry[];

      console.log('✅ Loaded leaderboard:', entries.length);
      setLeaderboard(entries);
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return { icon: 'trophy', color: '#FFD700' };
    if (rank === 2) return { icon: 'trophy', color: '#C0C0C0' };
    if (rank === 3) return { icon: 'trophy', color: '#CD7F32' };
    return null;
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.id === currentUser?.uid;
    const medal = getRankMedal(item.rank);

    return (
      <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
        <View style={styles.rankContainer}>
          {medal ? (
            <MaterialCommunityIcons name={medal.icon as any} size={24} color={medal.color} />
          ) : (
            <Text style={[styles.rank, isCurrentUser && styles.textHighlight]}>
              {item.rank}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.textHighlight]}>
            {item.username || item.email?.split('@')[0] || 'Anonymous'}
          </Text>
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>

        <View style={styles.pointsContainer}>
          <Text style={[styles.points, isCurrentUser && styles.textHighlight]}>
            {item.total_points || 0}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff87" />
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  const currentUserEntry = leaderboard.find(e => e.id === currentUser?.uid);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#37003c', '#2b0030']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="podium" size={48} color="#00ff87" />
        <Text style={styles.title}>Global Leaderboard</Text>
        <Text style={styles.subtitle}>{leaderboard.length} players competing</Text>
        
        {currentUserEntry && (
          <View style={styles.yourRankCard}>
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <View style={styles.yourRankValue}>
              <Text style={styles.yourRankNumber}>#{currentUserEntry.rank}</Text>
              <Text style={styles.yourRankPoints}>{currentUserEntry.total_points} pts</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No players yet</Text>
            <Text style={styles.emptySubtext}>Be the first to compete!</Text>
          </View>
        }
      />
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
  yourRankCard: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  yourRankLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 8,
  },
  yourRankValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff87',
  },
  yourRankPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowHighlight: {
    backgroundColor: '#f0fff4',
    borderWidth: 2,
    borderColor: '#00ff87',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  youBadge: {
    backgroundColor: '#00ff87',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#37003c',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37003c',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
  textHighlight: {
    color: '#00d674',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});