// app/test-api.tsx - API Testing Screen for Expo
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { footballDataService } from '../services/footballDataService';

interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

interface Match {
  id: number;
  homeTeam: { 
    name: string;
    shortName: string;
  };
  awayTeam: { 
    name: string;
    shortName: string;
  };
  score: { 
    fullTime: { 
      home: number | null; 
      away: number | null; 
    }; 
  };
  status: string;
  utcDate: string;
}

export default function TestAPIScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setResults((prev) => [...prev, message]);
    console.log(message);
  };

  const runTest = async () => {
    setTesting(true);
    setResults([]);

    try {
      addLog('🧪 TESTING FOOTBALL-DATA.ORG API');
      addLog('================================\n');

      // Check API key
      const apiKey = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;
      if (!apiKey) {
        addLog('❌ ERROR: API key not found!');
        addLog('   Make sure .env has:');
        addLog('   EXPO_PUBLIC_FOOTBALL_DATA_API_KEY=your_key\n');
        setTesting(false);
        return;
      }

      addLog('✅ API Key loaded from .env');
      addLog(`   Key: ${apiKey.substring(0, 15)}...\n`);

      // Test 1: Connection
      addLog('📡 Test 1: Testing connection...');
      const connResult = await footballDataService.testConnection();

      if (!connResult.ok) {
        if (connResult.reason === 'invalid_key') {
          addLog('❌ Connection failed: Invalid API key (403).');
          addLog('   Verify EXPO_PUBLIC_FOOTBALL_DATA_API_KEY in your .env and activation on football-data.org\n');
        } else if (connResult.reason === 'cors_browser') {
          addLog('❌ Connection failed: Browser blocked the request (CORS).');
          addLog('   The football-data.org API does not allow client-side browser requests.');
          addLog('   Run the server-side test: `node test-football-data.js` or use a server/proxy.\n');
        } else if (connResult.reason === 'network') {
          addLog('❌ Connection failed: Network error.');
          addLog('   Check your internet connection and any firewall or proxy settings.\n');
        } else {
          addLog('❌ Connection failed: Unknown error. Check console for details.\n');
        }

        setTesting(false);
        return;
      }

      addLog('✅ Connection successful!\n');

      // Test 2: Get competitions
      addLog('🌍 Test 2: Finding AFCON...');
      const competitions = await footballDataService.getCompetitions();

      const africanComps = competitions.filter((c: Competition) => 
        c.name.toLowerCase().includes('africa') ||
        c.name.toLowerCase().includes('afcon') ||
        c.code === 'CLI' ||
        c.code === 'CAF'
      );

      if (africanComps.length > 0) {
        addLog('✅ Found African competitions:\n');
        africanComps.forEach((comp: Competition) => {
          addLog(`   🏆 ${comp.name}`);
          addLog(`      Code: ${comp.code}`);
          addLog(`      ID: ${comp.id}\n`);
        });
        
        addLog('⚠️  UPDATE NEEDED:');
        addLog('   It is recommended to set the AFCON competition code via your .env:');
        addLog('   EXPO_PUBLIC_AFCON_CODE=THE_COMPETITION_CODE');
        addLog(`   Example: EXPO_PUBLIC_AFCON_CODE=${africanComps[0].code}\n`);
      } else {
        addLog('⚠️  AFCON not found\n');
        addLog('📋 Available competitions (first 10):');
        competitions.slice(0, 10).forEach((comp: Competition) => {
          addLog(`   - ${comp.name} (${comp.code})`);
        });
        addLog('');
      }

      // Test 3: Get today's matches
      addLog('📅 Test 3: Getting today\'s matches...');
      const todayMatches = await footballDataService.getTodayMatches();
      
      if (todayMatches.length > 0) {
        addLog(`✅ Found ${todayMatches.length} matches today:\n`);
        todayMatches.forEach((match: Match) => {
          const formatted = footballDataService.formatMatch(match);
          addLog(`   ⚽ ${formatted.homeTeam} vs ${formatted.awayTeam}`);
          addLog(`      Score: ${formatted.homeScore}-${formatted.awayScore}`);
          addLog(`      Status: ${formatted.status}\n`);
        });
      } else {
        addLog('ℹ️  No matches today');
        addLog('   This is normal if AFCON hasn\'t started\n');
      }

      addLog('================================');
      addLog('✅ ALL TESTS COMPLETE!');
      addLog('================================\n');
      
      addLog('📝 Next Steps:');
      addLog('1. Update AFCON_CODE in footballDataService.ts');
      addLog('2. Test match sync closer to tournament');
      addLog('3. Add sync button to Admin Dashboard\n');

    } catch (error: any) {
      addLog(`\n❌ ERROR: ${error.message}`);
      addLog('\n💡 Common issues:');
      addLog('   - Invalid API key');
      addLog('   - No internet connection');
      addLog('   - Rate limit exceeded');
      addLog('   - API service down\n');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#37003c', '#2b0030']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="test-tube" size={48} color="#00ff87" />
        <Text style={styles.title}>API Test Center</Text>
        <Text style={styles.subtitle}>Football-Data.org Integration</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.button, testing && styles.buttonDisabled]}
          onPress={runTest}
          disabled={testing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={testing ? ['#666', '#555'] : ['#00ff87', '#00d674']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {testing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Testing...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="play-circle" size={24} color="#37003c" />
                <Text style={[styles.buttonText, { color: '#37003c' }]}>Run API Test</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <MaterialCommunityIcons name="console" size={20} color="#00ff87" />
            <Text style={styles.resultsTitle}>Test Results</Text>
          </View>
          
          <ScrollView 
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {results.length === 0 ? (
              <Text style={styles.emptyText}>
                Tap "Run API Test" to start testing...
              </Text>
            ) : (
              results.map((line: string, index: number) => (
                <Text key={index} style={styles.resultText}>
                  {line}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#00ff87" />
          <Text style={styles.infoText}>
            This test verifies your API connection and finds the AFCON competition code
          </Text>
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
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  resultsTitle: {
    color: '#00ff87',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  resultText: {
    color: '#00ff87',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#00ff87',
    fontSize: 12,
  },
});