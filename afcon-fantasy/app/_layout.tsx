import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        {/* Auth Screens */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        {/* Main App with Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Standalone Screens (not in tabs) */}
        <Stack.Screen name="squad" options={{ title: 'Select Your Squad' }} />
        <Stack.Screen name="starting-xi" options={{ title: 'Starting XI' }} />

        {/* League Screens */}
        <Stack.Screen name="my-leagues" options={{ headerShown: false }} />
        <Stack.Screen name="create-league" options={{ headerShown: false }} />
        <Stack.Screen name="join-league" options={{ headerShown: false }} />
        <Stack.Screen name="league-detail" options={{ headerShown: false }} />
        <Stack.Screen name="browse-leagues" options={{ headerShown: false }} />

        {/* Test/Admin Screens */}
        <Stack.Screen 
          name="test-api" 
          options={{ 
            title: 'API Test', 
            headerShown: false 
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}