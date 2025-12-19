// app/join-league.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function JoinLeagueScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedLeague, setJoinedLeague] = useState<{ name: string; members: number } | null>(null);

  const handleJoinLeague = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-character code');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      setLoading(true);

      // Find league with this code
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where('code', '==', code.toUpperCase())
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);

      if (leaguesSnapshot.empty) {
        Alert.alert('Not Found', 'No league found with this code. Please check and try again.');
        setLoading(false);
        return;
      }

      const leagueDoc = leaguesSnapshot.docs[0];
      const leagueData = leagueDoc.data();

      // Check if user is already a member
      const membersQuery = query(
        collection(db, 'league_members'),
        where('league_id', '==', leagueDoc.id),
        where('user_id', '==', currentUser.uid)
      );
      const membersSnapshot = await getDocs(membersQuery);

      if (!membersSnapshot.empty) {
        Alert.alert('Already Joined', 'You are already a member of this league!');
        setLoading(false);
        return;
      }

      // Add user to league
      await addDoc(collection(db, 'league_members'), {
        league_id: leagueDoc.id,
        user_id: currentUser.uid,
        joined_at: serverTimestamp(),
      });

      // Update member count
      await updateDoc(doc(db, 'leagues', leagueDoc.id), {
        member_count: increment(1),
      });

      setJoinedLeague({
        name: leagueData.name,
        members: (leagueData.member_count || 0) + 1,
      });
    } catch (error) {
      console.error('Error joining league:', error);
      Alert.alert('Error', 'Failed to join league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.back();
  };

  if (joinedLeague) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#37003c', '#2b0030']} style={styles.successHeader}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#00ff87" />
          <Text style={styles.successTitle}>Joined League!</Text>
          <Text style={styles.successSubtitle}>{joinedLeague.name}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.successBox}>
            <View style={styles.successStat}>
              <MaterialCommunityIcons name="account-group" size={48} color="#00ff87" />
              <Text style={styles.successStatNumber}>{joinedLeague.members}</Text>
              <Text style={styles.successStatLabel}>Total Members</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewLeagueButton} onPress={handleDone} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00ff87', '#00d674']}
              style={styles.viewLeagueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="trophy" size={24} color="#37003c" />
              <Text style={[styles.viewLeagueButtonText, { color: '#37003c' }]}>View My Leagues</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#00ff87" />
            <Text style={styles.infoText}>
              Your fantasy team will now compete in this league. Good luck! 🏆
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#37003c', '#2b0030']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="login" size={48} color="#00ff87" />
        <Text style={styles.title}>Join League</Text>
        <Text style={styles.subtitle}>Enter your league code</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>League Code</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="ABC123"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoFocus
            textAlign="center"
          />

          <View style={styles.instructionsBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#00ff87" />
            <Text style={styles.instructionsText}>
              Ask your friend for their 6-character league code
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, (code.length !== 6 || loading) && styles.joinButtonDisabled]}
          onPress={handleJoinLeague}
          disabled={code.length !== 6 || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={code.length !== 6 || loading ? ['#666', '#555'] : ['#8b5cf6', '#7c3aed']}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.joinButtonText}>Joining...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={24} color="#fff" />
                <Text style={styles.joinButtonText}>Join League</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.exampleBox}>
          <Text style={styles.exampleTitle}>💡 How it works:</Text>
          <Text style={styles.exampleStep}>1. Get the code from your friend</Text>
          <Text style={styles.exampleStep}>2. Enter it above</Text>
          <Text style={styles.exampleStep}>3. Tap "Join League"</Text>
          <Text style={styles.exampleStep}>4. Start competing!</Text>
        </View>
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
  successHeader: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#00ff87',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderRadius: 16,
    padding: 24,
    fontSize: 36,
    color: '#00ff87',
    fontWeight: 'bold',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#00ff87',
    marginBottom: 16,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exampleBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  exampleTitle: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exampleStep: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  successBox: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  successStat: {
    alignItems: 'center',
  },
  successStatNumber: {
    color: '#00ff87',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 12,
  },
  successStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  viewLeagueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewLeagueButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  viewLeagueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#00ff87',
    fontSize: 12,
    lineHeight: 18,
  },
});