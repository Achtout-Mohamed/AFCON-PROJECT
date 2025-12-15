const axios = require('axios');

const BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '';

if (!API_KEY) {
  console.warn('Warning: EXPO_PUBLIC_API_FOOTBALL_KEY not set in environment. API requests will fail without it.');
}

async function getLeagues() {
  const res = await axios.get(`${BASE}/leagues`, {
    headers: { 'x-apisports-key': API_KEY },
    timeout: 15000,
  });
  return res.data.response || [];
}

async function getTeams(leagueId, season) {
  const res = await axios.get(`${BASE}/teams`, {
    headers: { 'x-apisports-key': API_KEY },
    params: { league: leagueId, season },
    timeout: 15000,
  });
  return res.data.response || [];
}

async function findAfconLeagues(season = 2025) {
  const leagues = await getLeagues();
  const matches = leagues.filter((l) => {
    const leagueName = (l.league && l.league.name || '').toLowerCase();
    const countryName = (l.country && l.country.name || '').toLowerCase();
    const hasSeason = Array.isArray(l.seasons) && l.seasons.some((s) => s.year === season);

    return hasSeason && (
      leagueName.includes('africa') || leagueName.includes('afcon') || leagueName.includes('nations') || countryName === 'morocco'
    );
  });
  return matches;
}

module.exports = {
  getLeagues,
  getTeams,
  findAfconLeagues,
};
