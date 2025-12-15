import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PITCH_WIDTH = width - 32; // Account for padding

export default function FootballPitch({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Grass Gradient Background */}
      <LinearGradient
        colors={['#0d5e2f', '#0f6d37', '#0d5e2f', '#0a4d26']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grassGradient}
      >
        {/* Grass Stripes Pattern */}
        <View style={styles.stripesContainer}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.stripe,
                { opacity: i % 2 === 0 ? 0.08 : 0 }
              ]}
            />
          ))}
        </View>

        {/* Field Lines */}
        <View style={styles.fieldLines}>
          {/* Center Circle */}
          <View style={styles.centerCircle} />
          <View style={styles.centerCircleInner} />
          
          {/* Center Line */}
          <View style={styles.centerLine} />
          
          {/* Penalty Areas */}
          <View style={styles.penaltyAreaTop} />
          <View style={styles.penaltyAreaBottom} />
        </View>

        {/* Players Content */}
        <View style={styles.playersContent}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginVertical: 8,
  },
  grassGradient: {
    width: '100%',
    minHeight: 450,
    position: 'relative',
  },
  stripesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  stripe: {
    flex: 1,
    backgroundColor: '#000',
  },
  fieldLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: -40,
    marginTop: -40,
  },
  centerCircleInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginLeft: -4,
    marginTop: -4,
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: -1,
  },
  penaltyAreaTop: {
    position: 'absolute',
    top: 20,
    left: '25%',
    right: '25%',
    height: 50,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  penaltyAreaBottom: {
    position: 'absolute',
    bottom: 20,
    left: '25%',
    right: '25%',
    height: 50,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playersContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
});