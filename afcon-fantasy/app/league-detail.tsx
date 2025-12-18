import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Share,
  Alert,
  Clipboard,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface LeagueMember {
  id: string;
  userId: string;
  username: string;
  teamName: string;
  points: number;
  rank: number;
  isCurrentUser: boolean;
}

interface LeagueInfo {
  name: string;
  code: string;
  memberCount: number;
  adminId: string;
  isPrivate: boolean;
}

export default function LeagueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = leagueInfo?.adminId === currentUser?.uid;

  useEffect(() => {
    if (id) {
      loadLeagueDetails();
    }
  }, [id]);

  const loadLeagueDetails = async () => {
    try {
      setLoading(true);

      const leagueDoc = await getDoc(doc(db, 'leagues', id as string));
      if (!leagueDoc.exists()) {
        console.error('League not found');
        return;
      }

      const leagueData = leagueDoc.data();
      setLeagueInfo({
        name: leagueData.name,
        code: leagueData.code,
        memberCount: leagueData.member_count || 0,
        adminId: leagueData.admin_id,
        isPrivate: leagueData.is_private || false,
      });

      const membersQuery = query(
        collection(db, 'league_members'),
        where('league_id', '==', id)
      );
      const membersSnapshot = await getDocs(membersQuery);

      const membersData: LeagueMember[] = [];
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const userDoc = await getDoc(doc(db, 'users', memberData.user_id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          membersData.push({
            id: memberDoc.id,
            userId: memberData.user_id,
            username: userData.username || 'Unknown',
            teamName: userData.teamName || 'My Team',
            points: userData.total_points || 0,
            rank: 0,
            isCurrentUser: memberData.user_id === currentUser?.uid,
          });
        }
      }

      membersData.sort((a, b) => b.points - a.points);
      membersData.forEach((member, index) => {
        member.rank = index + 1;
      });

      setMembers(membersData);
    } catch (error) {
      console.error('Error loading league details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    if (!leagueInfo) return;

    try {
      await Share.share({
        message: `Join my AFCON 2025 Fantasy League: "${leagueInfo.name}"\n\n${leagueInfo.isPrivate ? '🔒 Private League' : '🌍 Public League'}\n\nUse code: ${leagueInfo.code}\n\nDownload the app and enter this code to compete with us!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    if (!leagueInfo) return;
    Clipboard.setString(leagueInfo.code);
    Alert.alert('Copied!', 'League code copied to clipboard');
  };

  const handleDeleteLeague = () => {
    console.log('Delete button pressed');
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      setDeleting(true);
      setShowDeleteModal(false);

      const membersQuery = query(
        collection(db, 'league_members'),
        where('league_id', '==', id)
      );
      const membersSnapshot = await getDocs(membersQuery);

      console.log(`Deleting ${membersSnapshot.docs.length} members...`);

      for (const memberDoc of membersSnapshot.docs) {
        await deleteDoc(memberDoc.ref);
      }

      await deleteDoc(doc(db, 'leagues', id as string));
      console.log('League deleted');

      if (Platform.OS === 'web') {
        alert('League deleted successfully!');
        router.replace('/my-leagues');
      } else {
        Alert.alert(
          '✅ Success',
          'League deleted successfully',
          [{ text: 'OK', onPress: () => router.replace('/my-leagues') }]
        );
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      if (Platform.OS === 'web') {
        alert(`Failed to delete: ${error.message}`);
      } else {
        Alert.alert('Error', `Failed to delete: ${error.message}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  const renderMemberCard = ({ item }: { item: LeagueMember }) => {
    const isTopThree = item.rank <= 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const medalColor = isTopThree ? medalColors[item.rank - 1] : 'transparent';

    return (
      <View
        style={[
          styles.memberCard,
          item.isCurrentUser && styles.currentUserCard,
          item.rank === 1 && styles.firstPlaceCard,
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
              <MaterialCommunityIcons name="trophy" size={20} color="#37003c" />
            </View>
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={[styles.username, item.isCurrentUser && styles.currentUserText]}>
              {item.username}
              {item.isCurrentUser && ' (You)'}
            </Text>
            {item.userId === leagueInfo?.adminId && (
              <View style={styles.adminBadge}>
                <MaterialCommunityIcons name="shield-crown" size={14} color="#FFD700" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.teamName}>{item.teamName}</Text>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={[styles.points, item.isCurrentUser && styles.currentUserPoints]}>
            {item.points}
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
        <Text style={styles.loadingText}>Loading league...</Text>
      </View>
    );
  }

  if (!leagueInfo) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ff0000" />
        <Text style={styles.errorText}>League not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUserMember = members.find(m => m.isCurrentUser);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#37003c', '#2b0030']} style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <MaterialCommunityIcons name="trophy" size={48} color="#00ff87" />
        <Text style={styles.leagueName}>{leagueInfo.name}</Text>
        
        <View style={[
          styles.privacyBadge,
          leagueInfo.isPrivate ? styles.privateBadge : styles.publicBadge
        ]}>
          <MaterialCommunityIcons 
            name={leagueInfo.isPrivate ? 'lock' : 'earth'} 
            size={14} 
            color={leagueInfo.isPrivate ? '#ff6b6b' : '#00ff87'} 
          />
          <Text style={[
            styles.privacyBadgeText,
            leagueInfo.isPrivate ? styles.privateBadgeText : styles.publicBadgeText
          ]}>
            {leagueInfo.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerStat}>
            <MaterialCommunityIcons name="account-group" size={20} color="#00ff87" />
            <Text style={styles.headerStatText}>{leagueInfo.memberCount} members</Text>
          </View>
          
          {isAdmin && (
            <TouchableOpacity style={styles.headerStat} onPress={handleCopyCode}>
              <MaterialCommunityIcons name="ticket" size={20} color="#00ff87" />
              <Text style={styles.headerStatText}>{leagueInfo.code}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isAdmin && (
          <View style={styles.adminControls}>
            <TouchableOpacity style={styles.shareCodeButton} onPress={handleShareCode}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#00ff87" />
              <Text style={styles.shareCodeButtonText}>Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteLeague}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ff6b6b" />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete" size={20} color="#ff6b6b" />
                  <Text style={styles.deleteButtonText}>Delete League</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {currentUserMember && (
        <View style={styles.yourRankBanner}>
          <LinearGradient
            colors={['rgba(0, 255, 135, 0.2)', 'rgba(0, 255, 135, 0.05)']}
            style={styles.yourRankGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.yourRankContent}>
              <MaterialCommunityIcons name="account" size={32} color="#00ff87" />
              <View style={styles.yourRankInfo}>
                <Text style={styles.yourRankLabel}>Your Rank</Text>
                <Text style={styles.yourRankNumber}>#{currentUserMember.rank}</Text>
              </View>
              <View style={styles.yourRankPoints}>
                <Text style={styles.yourRankPointsNumber}>{currentUserMember.points}</Text>
                <Text style={styles.yourRankPointsLabel}>points</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      <View style={styles.rankingsContainer}>
        <View style={styles.rankingsHeader}>
          <MaterialCommunityIcons name="podium" size={24} color="#00ff87" />
          <Text style={styles.rankingsTitle}>Rankings</Text>
        </View>

        <FlatList
          data={members}
          renderItem={renderMemberCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#ff6b6b" />
            
            <Text style={styles.modalTitle}>Delete League?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to permanently delete "{leagueInfo?.name}"?
              {'\n\n'}
              • All {leagueInfo?.memberCount} members will be removed{'\n'}
              • This cannot be undone
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={executeDelete}
              >
                <Text style={styles.modalDeleteText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0118',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0118',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ff87',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0118',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  privateBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  publicBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  privateBadgeText: {
    color: '#ff6b6b',
  },
  publicBadgeText: {
    color: '#00ff87',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatText: {
    color: '#fff',
    fontSize: 14,
  },
  adminControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  shareCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  shareCodeButtonText: {
    color: '#00ff87',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  yourRankBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00ff87',
  },
  yourRankGradient: {
    padding: 16,
  },
  yourRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  yourRankInfo: {
    flex: 1,
  },
  yourRankLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  yourRankNumber: {
    color: '#00ff87',
    fontSize: 28,
    fontWeight: 'bold',
  },
  yourRankPoints: {
    alignItems: 'flex-end',
  },
  yourRankPointsNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  yourRankPointsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  rankingsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  rankingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentUserCard: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderColor: '#00ff87',
    borderWidth: 2,
  },
  firstPlaceCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  medalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentUserText: {
    color: '#00ff87',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentUserPoints: {
    color: '#00ff87',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a0020',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDeleteButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});