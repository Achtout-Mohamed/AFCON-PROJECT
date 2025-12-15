import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Ellipse, G, Text as SvgText } from 'react-native-svg';

interface PlayerJerseyProps {
  position: string;
  playerName: string;
  number?: string;
  isCaptain?: boolean;
  isPlaceholder?: boolean;
}

export default function PlayerJersey({ position, playerName, number, isCaptain }: PlayerJerseyProps) {
  const getJerseyColor = () => {
    switch(position) {
      case 'GK': return { primary: '#2ecc71', secondary: '#27ae60', accent: '#1e8449' };
      case 'DEF': return { primary: '#3498db', secondary: '#2980b9', accent: '#1f618d' };
      case 'MID': return { primary: '#e74c3c', secondary: '#c0392b', accent: '#922b21' };
      case 'ATT': return { primary: '#f39c12', secondary: '#d68910', accent: '#b9770e' };
      default: return { primary: '#95a5a6', secondary: '#7f8c8d', accent: '#5d6d7e' };
    }
  };

  const colors = getJerseyColor();
  const placeholder = (typeof ({} as PlayerJerseyProps).isPlaceholder !== 'undefined') ? false : false;
  const lastName = playerName ? playerName.split(' ').pop() : '';

  // If component is a placeholder, override visuals
  const isPlaceholder = (arguments[0] as any)?.isPlaceholder;
  const visualColors = isPlaceholder
    ? { primary: 'rgba(0,0,0,0.08)', secondary: 'rgba(0,0,0,0.06)', accent: 'rgba(0,0,0,0.03)' }
    : colors;

  return (
    <View style={styles.container}>
      {/* Jersey SVG */}
      <View style={[styles.jerseyContainer, isPlaceholder && styles.placeholderJerseyContainer]}>
        <Svg width="60" height="70" viewBox="0 0 60 70">
          {/* Jersey Body */}
          <Path
            d="M15,15 L15,8 Q15,3 20,3 L25,3 L25,8 L30,5 L35,8 L35,3 L40,3 Q45,3 45,8 L45,15 L50,20 L50,50 Q50,55 45,55 L15,55 Q10,55 10,50 L10,20 Z"
            fill={visualColors.primary}
            stroke={visualColors.accent}
            strokeWidth="1.5"
          />
          
          {/* Collar */}
          <Path
            d="M25,3 L25,8 L30,5 L35,8 L35,3"
            fill={visualColors.secondary}
            stroke={visualColors.accent}
            strokeWidth="1"
          />
          
          {/* Side Stripes */}
          <Rect x="14" y="20" width="3" height="30" fill={visualColors.accent} />
          <Rect x="43" y="20" width="3" height="30" fill={visualColors.accent} />
          
          {/* Number on Jersey - FIXED: Using SvgText */}
          {!isPlaceholder && (
            <SvgText
              x="30"
              y="38"
              fontSize="18"
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
              stroke={visualColors.accent}
              strokeWidth="0.5"
            >
              {number || '10'}
            </SvgText>
          )}
          
          {/* Captain Armband */}
          {isCaptain && !isPlaceholder && (
            <G>
              <Rect x="42" y="25" width="6" height="8" fill="#ffd700" rx="1" />
              <SvgText
                x="45"
                y="31"
                fontSize="6"
                fontWeight="bold"
                fill="#000"
                textAnchor="middle"
              >
                C
              </SvgText>
            </G>
          )}
        </Svg>
      </View>

      {/* Player Name */}
      <View style={[styles.nameContainer, isPlaceholder && styles.placeholderNameContainer]}>
        <Text style={[styles.playerName, isPlaceholder && styles.placeholderPlayerName]} numberOfLines={1}>
          {isPlaceholder ? '' : lastName}
        </Text>
      </View>

      {/* Captain Badge */}
      {isCaptain && (
        <View style={styles.captainBadge}>
          <Text style={styles.captainText}>⭐</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 70,
    marginHorizontal: 2,
    marginVertical: 4,
  },
  jerseyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  placeholderJerseyContainer: {
    shadowOpacity: 0,
    elevation: 0,
  },
  nameContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 55,
    maxWidth: 70,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textAlign: 'center',
  },
  placeholderNameContainer: {
    backgroundColor: 'transparent',
    minWidth: 55,
  },
  placeholderPlayerName: {
    color: 'transparent',
  },
  captainBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#ffd700',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captainText: {
    fontSize: 16,
  },
});
