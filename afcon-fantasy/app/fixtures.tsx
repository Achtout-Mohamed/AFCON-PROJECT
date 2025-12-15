import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Match {
  id: string;
  home_team: string;
  home_code: string;
  away_team: string;
  away_code: string;
  home_score: number | null;
  away_score: number | null;
  match_date: any;
  venue: string;
  group: string;
  gameweek: number;
  status: string;
}

export default function FixturesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      console.log('📅 Loading matches...');
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, orderBy('match_date', 'asc'));
      const snapshot = await getDocs(q);

      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      console.log('✅ Loaded matches:', matchesData.length);
      setMatches(matchesData);
    } catch (error) {
      console.error('❌ Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return match.status === 'scheduled';
    if (filter === 'finished') return match.status === 'finished';
    return true;
  });

  const renderMatchCard = ({ item }: { item: Match }) => {
    const isFinished = item.status === 'finished';
    const isLive = item.status === 'live';

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.groupText}>{item.group}</Text>
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>}
        </View>

        <View style={styles.matchContent}>
          {/* Home Team */}
          <View style={styles.team}>
            <Text style={styles.teamFlag}>{getFlag(item.home_code)}</Text>
            <Text style={styles.teamName}>{item.home_team}</Text>
          </View>

          {/* Score or VS */}
          <View style={styles.scoreContainer}>
            {isFinished && item.home_score !== null ? (
              <View style={styles.score}>
                <Text style={styles.scoreText}>
                  {item.home_score} - {item.away_score}
                </Text>
              </View>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.team}>
            <Text style={styles.teamFlag}>{getFlag(item.away_code)}</Text>
            <Text style={styles.teamName}>{item.away_team}</Text>
          </View>
        </View>

        <View style={styles.matchFooter}>
          <Text style={styles.dateText}>📅 {formatDate(item.match_date)}</Text>
          <Text style={styles.venueText}>📍 {item.venue.split(',')[0]}</Text>
        </View>
      </View>
    );
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading fixtures...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 AFCON 2025 Fixtures</Text>
        <Text style={styles.subtitle}>{matches.length} matches scheduled</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filters}>
        {['all', 'upcoming', 'finished'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No matches found</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  filters: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#2196F3',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  list: {
    padding: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  liveBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreContainer: {
    width: 80,
    alignItems: 'center',
  },
  score: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  vsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  matchFooter: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  venueText: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
});