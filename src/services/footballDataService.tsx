// footballDataService.tsx - Simplified version for fetching scores
import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY || '';
const BASE_URL = 'https://api.football-data.org/v4';

// AFCON 2025 Competition Code - Update after testing
const AFCON_CODE = 'CLI';

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
  status: string;
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

  /**
   * Make API request with rate limiting
   */
  private async makeRequest(endpoint: string) {
    // Wait 6 seconds between requests (10 req/min limit)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 6000) {
      const waitTime = 6000 - timeSinceLastRequest;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
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
      
      console.log(`📊 API Request #${this.requestCount} successful`);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ API Error:', error.response?.status, error.response?.data?.message);
        
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded - wait 1 minute');
        }
        
        if (error.response?.status === 403) {
          throw new Error('Invalid API key or access denied');
        }
      }
      throw error;
    }
  }

  /**
   * Get all available competitions (to find AFCON)
   */
  async getCompetitions(): Promise<Competition[]> {
    try {
      console.log('📋 Fetching competitions...');
      const data = await this.makeRequest('/competitions');
      
      // Filter for African competitions
      const africanComps = data.competitions.filter((comp: Competition) => 
        comp.name.toLowerCase().includes('africa') ||
        comp.name.toLowerCase().includes('afcon') ||
        comp.code === 'CLI' ||
        comp.code === 'AFCON'
      );
      
      if (africanComps.length > 0) {
        console.log('🌍 African Competitions found:');
        africanComps.forEach((comp: Competition) => {
          console.log(`   ✓ ${comp.name} (Code: ${comp.code})`);
        });
      }
      
      return africanComps;
    } catch (error) {
      console.error('❌ Error fetching competitions:', error);
      return [];
    }
  }

  /**
   * Get all AFCON matches
   */
  async getAFCONMatches(): Promise<FootballDataMatch[]> {
    try {
      console.log('⚽ Fetching AFCON matches...');
      const data = await this.makeRequest(`/competitions/${AFCON_CODE}/matches`);
      
      const matches = data.matches || [];
      console.log(`✅ Found ${matches.length} matches`);
      
      return matches;
    } catch (error) {
      console.error('❌ Error fetching AFCON matches:', error);
      return [];
    }
  }

  /**
   * Get matches for a specific date
   */
  async getMatchesByDate(date: string): Promise<FootballDataMatch[]> {
    try {
      console.log(`📅 Fetching matches for ${date}...`);
      const data = await this.makeRequest(
        `/competitions/${AFCON_CODE}/matches?dateFrom=${date}&dateTo=${date}`
      );
      
      const matches = data.matches || [];
      console.log(`✅ Found ${matches.length} matches on ${date}`);
      
      return matches;
    } catch (error) {
      console.error('❌ Error fetching matches by date:', error);
      return [];
    }
  }

  /**
   * Get today's matches
   */
  async getTodayMatches(): Promise<FootballDataMatch[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMatchesByDate(today);
  }

  /**
   * Get live/in-play matches
   */
  async getLiveMatches(): Promise<FootballDataMatch[]> {
    try {
      console.log('🔴 Fetching live matches...');
      const data = await this.makeRequest(`/competitions/${AFCON_CODE}/matches?status=IN_PLAY`);
      
      const matches = data.matches || [];
      console.log(`✅ Found ${matches.length} live matches`);
      
      return matches;
    } catch (error) {
      console.error('❌ Error fetching live matches:', error);
      return [];
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      
      const competitions = await this.getCompetitions();
      
      if (competitions.length > 0) {
        console.log('✅ API connection successful!');
        return true;
      } else {
        console.log('⚠️ API works but AFCON not found');
        return true; // API works, just no AFCON
      }
    } catch (error) {
      console.error('❌ API connection failed');
      return false;
    }
  }

  /**
   * Format match data for display
   */
  formatMatch(match: FootballDataMatch) {
    return {
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.score.fullTime.home ?? 0,
      awayScore: match.score.fullTime.away ?? 0,
      status: match.status,
      date: new Date(match.utcDate).toLocaleString(),
    };
  }

  /**
   * Get request count
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request count
   */
  resetRequestCount(): void {
    this.requestCount = 0;
    console.log('🔄 Request count reset');
  }
}

// Export singleton instance
export const footballDataService = new FootballDataService();

// Export methods
export const {
  getCompetitions,
  getAFCONMatches,
  getMatchesByDate,
  getTodayMatches,
  getLiveMatches,
  testConnection,
  formatMatch,
  getRequestCount,
  resetRequestCount,
} = footballDataService;