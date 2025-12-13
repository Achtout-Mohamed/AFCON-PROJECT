import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { footballDataService } from '../services/footballDataService';

export default function TestAPIScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([] as string[]);

  const addLog = (message: string) => {
    setResults((prev: string[]) => [...prev, message]);
    console.log(message);
  };

  const runTest = async () => {
    setTesting(true);
    setResults([]);

    try {
      addLog('🧪 Starting API Test...\n');

      // Check API key
      const apiKey = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;
      if (!apiKey) {
        addLog('❌ ERROR: API key not found in .env!');
        addLog('   Make sure .env has:');
        addLog('   EXPO_PUBLIC_FOOTBALL_DATA_API_KEY=your_key\n');
        setTesting(false);
        return;
      }

      addLog('✅ API Key loaded from .env');
      addLog(`   Key: ${apiKey.substring(0, 10)}...\n`);

      // Test 1: Connection
      addLog('📋 Test 1: Testing connection...');
      const connected = await footballDataService.testConnection();
      
      if (!connected) {
        addLog('❌ Connection failed!\n');
        setTesting(false);
        return;
      }

      addLog('✅ Connection successful!\n');

      // Test 2: Get competitions
      addLog('🌍 Test 2: Finding AFCON...');
      const competitions = await footballDataService.getCompetitions();

      if (competitions.length > 0) {
        addLog('✅ Found African competitions:\n');
        competitions.forEach((comp) => {
          addLog(`   🏆 ${comp.name}`);
          addLog(`      Code: ${comp.code}\n`);
        });
      } else {
        addLog('⚠️  AFCON not found in API\n');
      }

      // Test 3: Get today's matches
      addLog('📅 Test 3: Getting today\'s matches...');
      const todayMatches = await footballDataService.getTodayMatches();
      
      if (todayMatches.length > 0) {
        addLog(`✅ Found ${todayMatches.length} matches today:\n`);
        todayMatches.forEach((match) => {
          const formatted = footballDataService.formatMatch(match);
          addLog(`   ⚽ ${formatted.homeTeam} vs ${formatted.awayTeam}`);
          addLog(`      Score: ${formatted.homeScore}-${formatted.awayScore}`);
          addLog(`      Status: ${formatted.status}\n`);
        });
      } else {
        addLog('ℹ️  No matches today\n');
      }

      addLog('✅ All tests complete!');

    } catch (error: any) {
      addLog(`\n❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Test Screen</Text>

      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runTest}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run API Test</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((line: string, index: number) => (
          <Text key={index} style={styles.resultText}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#37003c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});