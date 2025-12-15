import axios from 'axios';

const BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '';

if (!API_KEY) {
  console.warn('Warning: EXPO_PUBLIC_API_FOOTBALL_KEY not set in environment. API requests will fail without it.');
}

export async function getLeagues(): Promise<any[]> {
  const res = await axios.get(`${BASE}/leagues`, {
    headers: { 'x-apisports-key': API_KEY },
    timeout: 15000,
  });
  return res.data.response || [];
}

export async function getTeams(leagueId: number, season: number): Promise<any[]> {
  const res = await axios.get(`${BASE}/teams`, {
    headers: { 'x-apisports-key': API_KEY },
    params: { league: leagueId, season },
    timeout: 15000,
  });
  return res.data.response || [];
}

export async function findAfconLeagues(season = 2025): Promise<any[]> {
  const leagues = await getLeagues();
  const matches = leagues.filter((l: any) => {
    const leagueName = (l.league?.name || '').toLowerCase();
    const countryName = (l.country?.name || '').toLowerCase();
    const hasSeason = Array.isArray(l.seasons) && l.seasons.some((s: any) => s.year === season);

    // Look for leagues with names like 'africa', 'afcon', 'nations', or country matching host
    return hasSeason && (
      leagueName.includes('africa') || leagueName.includes('afcon') || leagueName.includes('nations') || countryName === 'morocco'
    );
  });
  return matches;
}
