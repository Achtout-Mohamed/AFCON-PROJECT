// services/footballDataService.ts - Football-Data.org API Integration
import axios from 'axios';
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY || '';
const BASE_URL = 'https://api.football-data.org/v4';

// AFCON 2025 Competition Code - prefer setting via environment variable
const AFCON_CODE_ENV = process.env.EXPO_PUBLIC_AFCON_CODE || '';
// fallback static value (will be ignored if env provided or auto-detected)
let AFCON_CODE = AFCON_CODE_ENV || '';

interface FootballDataMatch {
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
  status: string; // "SCHEDULED", "IN_PLAY", "PAUSED", "FINISHED"
  utcDate: string;
}

interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

class FootballDataService {
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private detectedAfconCode: string | null = AFCON_CODE || null;

  /**
   * Make API request with rate limiting
   */
  private async makeRequest(endpoint: string): Promise<any> {
    // Rate limit: 10 requests per minute (free tier)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 6000) { // 6 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 6000 - timeSinceLastRequest));
    }

    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'X-Auth-Token': API_KEY,
        },
        timeout: 10000,
      });

      this.lastRequestTime = Date.now();
      this.requestCount++;

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a minute.');
      } else if (error.response?.status === 403) {
        throw new Error('Invalid API key. Check your EXPO_PUBLIC_FOOTBALL_DATA_API_KEY.');
      } else if (error.response?.status === 404) {
        throw new Error('Competition or match not found.');
      }
      throw new Error(error.message || 'Failed to fetch data from API');
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ ok: boolean; reason?: string }> {
    try {
      console.log('🔑 Testing API key:', API_KEY ? API_KEY.substring(0, 15) + '...' : '<missing>');
      console.log('🌐 Making request to:', `${BASE_URL}/competitions`);

      await this.makeRequest('/competitions');

      console.log('✅ Response received');
      return { ok: true };
    } catch (error: any) {
      // Detect common failure modes and return human-friendly reasons
      const status = error.response?.status;
      const msg = error.message || '';

      console.error('❌ Connection error details:', {
        message: msg,
        response: error.response?.data,
        status: status,
        statusText: error.response?.statusText,
      });

      if (status === 403) {
        return { ok: false, reason: 'invalid_key' };
      }

      // CORS / browser network errors often appear as 'Network Error' in axios
      if (msg.toLowerCase().includes('network error') || msg.toLowerCase().includes('cors')) {
        // If running in a browser environment, it's likely a CORS restriction
        if (typeof window !== 'undefined') {
          return { ok: false, reason: 'cors_browser' };
        }
        return { ok: false, reason: 'network' };
      }

      return { ok: false, reason: 'unknown' };
    }
  }

  /**
   * Get all available competitions
   */
  async getCompetitions(): Promise<Competition[]> {
    try {
      const data = await this.makeRequest('/competitions');
      return data.competitions || [];
    } catch (error) {
      console.error('Error fetching competitions:', error);
      return [];
    }
  }

  /**
   * Ensure we have the AFCON competition code. Prefer environment variable, else try to detect.
   */
  private async ensureAfconCode(): Promise<string> {
    if (this.detectedAfconCode) return this.detectedAfconCode;

    // Try environment again (in case loaded later)
    if (AFCON_CODE_ENV) {
      this.detectedAfconCode = AFCON_CODE_ENV;
      return this.detectedAfconCode;
    }

    // Attempt to detect by scanning competitions
    try {
      const comps = await this.getCompetitions();
      const found = comps.find(c => {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toUpperCase();
        return name.includes('africa') || name.includes('afcon') || code === 'CAF' || code === 'AFCON';
      });

      if (found) {
        this.detectedAfconCode = found.code;
        console.info('Detected AFCON code:', this.detectedAfconCode);
        return this.detectedAfconCode;
      }

      throw new Error('AFCON competition code not found. Set EXPO_PUBLIC_AFCON_CODE in .env.');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get all matches for AFCON 2025
   */
  async getMatches(): Promise<FootballDataMatch[]> {
    try {
      const code = await this.ensureAfconCode();
      const data = await this.makeRequest(`/competitions/${code}/matches`);
      return data.matches || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  /**
   * Get live matches only
   */
  async getLiveMatches(): Promise<FootballDataMatch[]> {
    try {
      const matches = await this.getMatches();
      return matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  /**
   * Map API team name to our database team name
   */
  private mapTeamName(apiName: string): string {
    const teamMap: { [key: string]: string } = {
      'Egypt': 'Egypt',
      'Morocco': 'Morocco',
      'Senegal': 'Senegal',
      'Nigeria': 'Nigeria',
      'Algeria': 'Algeria',
      'Tunisia': 'Tunisia',
      'Cameroon': 'Cameroon',
      "Côte d'Ivoire": "Côte d'Ivoire",
      'Ivory Coast': "Côte d'Ivoire",
      'Ghana': 'Ghana',
      'Mali': 'Mali',
      'Burkina Faso': 'Burkina Faso',
      'Guinea': 'Guinea',
      'Congo DR': 'DR Congo',
      'Democratic Republic of the Congo': 'DR Congo',
      'South Africa': 'South Africa',
      'Cape Verde': 'Cape Verde',
      'Gabon': 'Gabon',
      'Equatorial Guinea': 'Equatorial Guinea',
      'Angola': 'Angola',
      'Zambia': 'Zambia',
      'Uganda': 'Uganda',
      'Zimbabwe': 'Zimbabwe',
      'Benin': 'Benin',
      'Tanzania': 'Tanzania',
      'Mozambique': 'Mozambique',
      'Comoros': 'Comoros',
      'Sudan': 'Sudan',
      'Botswana': 'Botswana',
    };

    return teamMap[apiName] || apiName;
  }

  /**
   * Sync matches from API to Firebase
   */
  async syncMatches(): Promise<{ updated: number; errors: string[] }> {
    try {
      console.log('🔄 Starting match sync from API...');
      
      const apiMatches = await this.getMatches();
      console.log(`📥 Fetched ${apiMatches.length} matches from API`);

      const matchesRef = collection(db, 'matches');
      const snapshot = await getDocs(matchesRef);
      
      const batch = writeBatch(db);
      let updated = 0;
      const errors: string[] = [];

      // Create a map of Firebase matches
      const firebaseMatches = new Map<string, any>();
      snapshot.docs.forEach((docSnap: DocumentData) => {
        const data = docSnap.data();
        const key = `${data.home_team}_${data.away_team}`;
        firebaseMatches.set(key, { id: docSnap.id, ...data });
      });

      // Update each match
      for (const apiMatch of apiMatches) {
        try {
          const homeTeam = this.mapTeamName(apiMatch.homeTeam.name);
          const awayTeam = this.mapTeamName(apiMatch.awayTeam.name);
          const key = `${homeTeam}_${awayTeam}`;

          const firebaseMatch = firebaseMatches.get(key);
          
          if (firebaseMatch) {
            const homeScore = apiMatch.score.fullTime.home ?? 0;
            const awayScore = apiMatch.score.fullTime.away ?? 0;
            
            // Map API status to our status
            let status: 'scheduled' | 'live' | 'finished' = 'scheduled';
            if (apiMatch.status === 'FINISHED') {
              status = 'finished';
            } else if (apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED') {
              status = 'live';
            }

            // Only update if there are changes
            if (
              firebaseMatch.home_score !== homeScore ||
              firebaseMatch.away_score !== awayScore ||
              firebaseMatch.status !== status
            ) {
              const matchRef = doc(db, 'matches', firebaseMatch.id);
              batch.update(matchRef, {
                home_score: homeScore,
                away_score: awayScore,
                status: status,
                last_synced: serverTimestamp(),
              });

              updated++;
              console.log(`✅ Updated: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} (${status})`);
            }
          }
        } catch (error: any) {
          errors.push(`Error processing match: ${error.message}`);
          console.error('❌ Error processing match:', error);
        }
      }

      // Commit all updates
      if (updated > 0) {
        await batch.commit();
        console.log(`✅ Successfully synced ${updated} matches`);
      } else {
        console.log('ℹ️  No updates needed');
      }

      return { updated, errors };
    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Get today's matches (for testing)
   */
  async getTodayMatches(): Promise<FootballDataMatch[]> {
    try {
      const allMatches = await this.getMatches();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return allMatches.filter(match => {
        const matchDate = new Date(match.utcDate);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === today.getTime();
      });
    } catch (error) {
      console.error('Error getting today\'s matches:', error);
      return [];
    }
  }

  /**
   * Format match for display
   */
  formatMatch(match: FootballDataMatch) {
    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.score.fullTime.home ?? '-',
      awayScore: match.score.fullTime.away ?? '-',
      status: match.status,
      date: new Date(match.utcDate).toLocaleString(),
    };
  }
}

export const footballDataService = new FootballDataService();