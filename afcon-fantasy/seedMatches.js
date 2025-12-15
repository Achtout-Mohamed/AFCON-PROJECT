import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// YOUR Firebase config (copy from firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyCELVwy1m5jsk3LUoh9b4lMAQiALHucTC0",
  authDomain: "afcon-fantasy-2025.firebaseapp.com",
  projectId: "afcon-fantasy-2025",
  storageBucket: "afcon-fantasy-2025.firebasestorage.app",
  messagingSenderId: "1068734937286",
  appId: "1:1068734937286:web:065eb1fbdbff54a1debfc7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Key AFCON 2025 matches
const matches = [
  // GROUP A - Opening Day (Dec 21, 2025)
  {
    home_team: "Morocco",
    home_code: "MAR",
    away_team: "Comoros",
    away_code: "COM",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-21T18:00:00Z"),
    venue: "Prince Moulay Abdellah Stadium, Rabat",
    group: "Group A",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "Mali",
    home_code: "MLI",
    away_team: "Zambia",
    away_code: "ZAM",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-21T21:00:00Z"),
    venue: "Grand Stade de Marrakech",
    group: "Group A",
    gameweek: 1,
    status: "scheduled"
  },

  // GROUP B (Dec 22, 2025)
  {
    home_team: "Egypt",
    home_code: "EGY",
    away_team: "Zimbabwe",
    away_code: "ZIM",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-22T18:00:00Z"),
    venue: "Grand Stade de Tanger",
    group: "Group B",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "South Africa",
    home_code: "RSA",
    away_team: "Angola",
    away_code: "ANG",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-22T21:00:00Z"),
    venue: "Stade Mohammed V, Casablanca",
    group: "Group B",
    gameweek: 1,
    status: "scheduled"
  },

  // GROUP C (Dec 23, 2025)
  {
    home_team: "Nigeria",
    home_code: "NGA",
    away_team: "Tanzania",
    away_code: "TAN",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-23T18:00:00Z"),
    venue: "Grand Stade d'Agadir",
    group: "Group C",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "Tunisia",
    home_code: "TUN",
    away_team: "Uganda",
    away_code: "UGA",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-23T21:00:00Z"),
    venue: "Complexe Sportif de Fès",
    group: "Group C",
    gameweek: 1,
    status: "scheduled"
  },

  // GROUP D (Dec 24, 2025)
  {
    home_team: "Senegal",
    home_code: "SEN",
    away_team: "Botswana",
    away_code: "BOT",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-24T18:00:00Z"),
    venue: "Prince Moulay Abdellah Stadium, Rabat",
    group: "Group D",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "DR Congo",
    home_code: "COD",
    away_team: "Benin",
    away_code: "BEN",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-24T21:00:00Z"),
    venue: "Grand Stade de Tanger",
    group: "Group D",
    gameweek: 1,
    status: "scheduled"
  },

  // GROUP E (Dec 25, 2025)
  {
    home_team: "Algeria",
    home_code: "ALG",
    away_team: "Sudan",
    away_code: "SUD",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-25T18:00:00Z"),
    venue: "Grand Stade de Marrakech",
    group: "Group E",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "Burkina Faso",
    home_code: "BFA",
    away_team: "Equatorial Guinea",
    away_code: "EQG",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-25T21:00:00Z"),
    venue: "Stade Mohammed V, Casablanca",
    group: "Group E",
    gameweek: 1,
    status: "scheduled"
  },

  // GROUP F (Dec 26, 2025)
  {
    home_team: "Côte d'Ivoire",
    home_code: "CIV",
    away_team: "Mozambique",
    away_code: "MOZ",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-26T18:00:00Z"),
    venue: "Grand Stade d'Agadir",
    group: "Group F",
    gameweek: 1,
    status: "scheduled"
  },
  {
    home_team: "Cameroon",
    home_code: "CMR",
    away_team: "Gabon",
    away_code: "GAB",
    home_score: null,
    away_score: null,
    match_date: new Date("2025-12-26T21:00:00Z"),
    venue: "Complexe Sportif de Fès",
    group: "Group F",
    gameweek: 1,
    status: "scheduled"
  },
];

async function seedMatches() {
  console.log('📅 Starting to seed matches...');
  
  try {
    for (const match of matches) {
      const docRef = await addDoc(collection(db, 'matches'), match);
      console.log(`✅ Added: ${match.home_team} vs ${match.away_team} - ID: ${docRef.id}`);
    }
    
    console.log(`\n🎉 Successfully added ${matches.length} matches!`);
    console.log('✅ Match seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding matches:', error);
    process.exit(1);
  }
}

seedMatches();