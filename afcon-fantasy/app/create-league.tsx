// app/create-league.tsx - WITH PRIVACY OPTIONS
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Share,
  ScrollView,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function CreateLeagueScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [leagueName, setLeagueName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true); // Default to private
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const generateLeagueCode = (): string => {
    // Generate random 6-character uppercase code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      Alert.alert('Error', 'Please enter a league name');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      setLoading(true);

      // Generate unique code
      const code = generateLeagueCode();

      // Create league document with privacy setting
      const leagueRef = await addDoc(collection(db, 'leagues'), {
        name: leagueName.trim(),
        code: code,
        admin_id: currentUser.uid,
        is_private: isPrivate,
        created_at: serverTimestamp(),
        member_count: 1,
      });

      // Add creator as first member
      await addDoc(collection(db, 'league_members'), {
        league_id: leagueRef.id,
        user_id: currentUser.uid,
        joined_at: serverTimestamp(),
      });

      setCreatedCode(code);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Error', 'Failed to create league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my AFCON 2025 Fantasy League: "${leagueName}"\n\nUse code: ${createdCode}\n\nDownload the app and enter this code to compete!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(createdCode);
    Alert.alert('Copied!', 'League code copied to clipboard');
  };

  const handleDone = () => {
    router.back();
  };

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#37003c', '#2b0030']} style={styles.successHeader}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#00ff87" />
          <Text style={styles.successTitle}>League Created!</Text>
          <Text style={styles.successSubtitle}>{leagueName}</Text>
          
          {/* Privacy Badge */}
          <View style={[styles.privacyBadge, isPrivate ? styles.privateBadge : styles.publicBadge]}>
            <MaterialCommunityIcons 
              name={isPrivate ? 'lock' : 'earth'} 
              size={16} 
              color={isPrivate ? '#ff6b6b' : '#00ff87'} 
            />
            <Text style={[styles.privacyBadgeText, isPrivate ? styles.privateBadgeText : styles.publicBadgeText]}>
              {isPrivate ? 'Private League' : 'Public League'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your League Code</Text>
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
              <Text style={styles.codeDisplay}>{createdCode}</Text>
            </TouchableOpacity>
            <Text style={styles.codeHint}>Tap to copy • Share with friends</Text>
          </View>

          {/* Privacy Info Box */}
          {isPrivate ? (
            <View style={styles.privacyInfoBox}>
              <MaterialCommunityIcons name="shield-lock" size={24} color="#ff6b6b" />
              <View style={styles.privacyInfoText}>
                <Text style={styles.privacyInfoTitle}>🔒 Private League</Text>
                <Text style={styles.privacyInfoDescription}>
                  Only people with this code can join. Code is visible only to you (admin).
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.privacyInfoBox}>
              <MaterialCommunityIcons name="earth" size={24} color="#00ff87" />
              <View style={styles.privacyInfoText}>
                <Text style={styles.privacyInfoTitle}>🌍 Public League</Text>
                <Text style={styles.privacyInfoDescription}>
                  Anyone can discover and join this league. All members can see the code.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00ff87', '#00d674']}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="share-variant" size={24} color="#37003c" />
              <Text style={[styles.shareButtonText, { color: '#37003c' }]}>Share Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
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
      <MaterialCommunityIcons name="trophy-award" size={48} color="#00ff87" />
      <Text style={styles.title}>Create League</Text>
      <Text style={styles.subtitle}>Start your own competition</Text>
    </LinearGradient>

    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      >
      <View style={styles.form}>
        {/* All your form content stays the same */}
        <Text style={styles.label}>League Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., EST Essaouira Friends"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={leagueName}
          onChangeText={setLeagueName}
          maxLength={30}
          autoFocus
        />
        <Text style={styles.charCount}>{leagueName.length}/30</Text>

        {/* Privacy Section */}
        <View style={styles.privacySection}>
          <Text style={styles.label}>Privacy Settings</Text>
          
          <TouchableOpacity 
            style={[styles.privacyOption, isPrivate && styles.privacyOptionSelected]}
            onPress={() => setIsPrivate(true)}
            activeOpacity={0.7}
          >
            <View style={styles.privacyOptionLeft}>
              <View style={[styles.radioOuter, isPrivate && styles.radioOuterSelected]}>
                {isPrivate && <View style={styles.radioInner} />}
              </View>
              <MaterialCommunityIcons name="lock" size={24} color={isPrivate ? '#ff6b6b' : 'rgba(255,255,255,0.4)'} />
              <View style={styles.privacyOptionText}>
                <Text style={[styles.privacyOptionTitle, isPrivate && styles.privacyOptionTitleSelected]}>
                  Private
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  Only you can see and share the code
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.privacyOption, !isPrivate && styles.privacyOptionSelected]}
            onPress={() => setIsPrivate(false)}
            activeOpacity={0.7}
          >
            <View style={styles.privacyOptionLeft}>
              <View style={[styles.radioOuter, !isPrivate && styles.radioOuterSelected]}>
                {!isPrivate && <View style={styles.radioInner} />}
              </View>
              <MaterialCommunityIcons name="earth" size={24} color={!isPrivate ? '#00ff87' : 'rgba(255,255,255,0.4)'} />
              <View style={styles.privacyOptionText}>
                <Text style={[styles.privacyOptionTitle, !isPrivate && styles.privacyOptionTitleSelected]}>
                  Public
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  All members can see the code
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.examplesBox}>
          <Text style={styles.examplesTitle}>💡 Name Ideas:</Text>
          <Text style={styles.example}>• EST Essaouira CS Students</Text>
          <Text style={styles.example}>• Morocco Tech Bros</Text>
          <Text style={styles.example}>• Office AFCON League</Text>
          <Text style={styles.example}>• Family Champions</Text>
        </View>
      </View>

      {/* Button stays inside ScrollView */}
      <TouchableOpacity
        style={[styles.createButton, (!leagueName.trim() || loading) && styles.createButtonDisabled]}
        onPress={handleCreateLeague}
        disabled={!leagueName.trim() || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            !leagueName.trim() || loading
              ? ['#666', '#555']
              : ['#00ff87', '#00d674']
          }
          style={styles.createButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <Text style={[styles.createButtonText, { color: '#fff' }]}>Creating...</Text>
          ) : (
            <>
              <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color={leagueName.trim() ? '#37003c' : '#fff'}
              />
              <Text
                style={[
                  styles.createButtonText,
                  { color: leagueName.trim() ? '#37003c' : '#fff' },
                ]}
              >
                Create League
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={20} color="#00ff87" />
        <Text style={styles.infoText}>
          {isPrivate 
            ? 'Private: Only admin can see the code. Share it manually with friends.'
            : 'Public: All members can see and share the code with others.'}
        </Text>
      </View>
    </ScrollView>
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
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  privateBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  publicBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.5)',
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  privateBadgeText: {
    color: '#ff6b6b',
  },
  publicBadgeText: {
    color: '#00ff87',
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
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  charCount: {
    textAlign: 'right',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  
  // PRIVACY SECTION - NEW
  privacySection: {
    marginTop: 24,
    marginBottom: 16,
  },
  privacyOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privacyOptionSelected: {
    borderColor: 'rgba(0, 255, 135, 0.5)',
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#00ff87',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff87',
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  privacyOptionTitleSelected: {
    color: '#fff',
  },
  privacyOptionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  privacyInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    gap: 12,
  },
  privacyInfoText: {
    flex: 1,
  },
  privacyInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  privacyInfoDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  
  examplesBox: {
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  examplesTitle: {
    color: '#00ff87',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  example: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeBox: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#00ff87',
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  codeDisplay: {
    color: '#00ff87',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 12,
  },
  codeHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  shareButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    padding: 18,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
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