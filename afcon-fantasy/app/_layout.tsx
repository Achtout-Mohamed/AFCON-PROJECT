import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create Account' }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="squad" options={{ title: 'Select Your Squad' }} />
        <Stack.Screen name="starting-xi" options={{ title: 'Starting XI' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="fixtures" options={{ title: 'Fixtures' }} />
        
          {/* Test/Admin Screens */}
        <Stack.Screen 
          name="test-api" 
          options={{ 
            title: 'API Test', 
            headerShown: false 
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}