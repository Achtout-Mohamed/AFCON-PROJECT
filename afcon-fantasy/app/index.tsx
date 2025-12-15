import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check authentication and redirect
    const timer = setTimeout(() => {
      if (currentUser) {
        router.replace('/home' as any);
      } else {
        router.replace('/login' as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});