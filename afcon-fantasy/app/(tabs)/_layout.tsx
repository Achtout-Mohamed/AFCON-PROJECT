import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
      }}>
      
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Transfers Tab */}
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Transfers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Fixtures Tab */}
      <Tabs.Screen
        name="fixtures"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Leaderboard Tab */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Explore Tab - Optional, remove if not needed */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />
      
    </Tabs>
  );
}