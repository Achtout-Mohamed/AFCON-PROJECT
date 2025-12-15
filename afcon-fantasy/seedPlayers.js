// seedPlayers.js
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

// Sample players from each group (we'll add more later)
const players = [
  // GROUP A - Morocco (Host)
  { name: "Yassine Bounou", country: "Morocco", country_code: "MAR", position: "GK", value: 6.0, team: "Al-Hilal" },
  { name: "Achraf Hakimi", country: "Morocco", country_code: "MAR", position: "DEF", value: 8.5, team: "PSG" },
  { name: "Noussair Mazraoui", country: "Morocco", country_code: "MAR", position: "DEF", value: 6.5, team: "Man United" },
  { name: "Sofyan Amrabat", country: "Morocco", country_code: "MAR", position: "MID", value: 6.5, team: "Fiorentina" },
  { name: "Hakim Ziyech", country: "Morocco", country_code: "MAR", position: "MID", value: 8.0, team: "Galatasaray" },
  { name: "Youssef En-Nesyri", country: "Morocco", country_code: "MAR", position: "ATT", value: 7.5, team: "Fenerbahce" },
  
  // GROUP B - Egypt
  { name: "Mohamed El Shenawy", country: "Egypt", country_code: "EGY", position: "GK", value: 5.5, team: "Al Ahly" },
  { name: "Mohamed Salah", country: "Egypt", country_code: "EGY", position: "ATT", value: 11.5, team: "Liverpool" },
  { name: "Mohamed Elneny", country: "Egypt", country_code: "EGY", position: "MID", value: 5.5, team: "Al Jazira" },
  { name: "Omar Marmoush", country: "Egypt", country_code: "EGY", position: "ATT", value: 7.0, team: "Eintracht Frankfurt" },
  
  // GROUP C - Nigeria
  { name: "Stanley Nwabali", country: "Nigeria", country_code: "NGA", position: "GK", value: 4.5, team: "Chippa United" },
  { name: "William Troost-Ekong", country: "Nigeria", country_code: "NGA", position: "DEF", value: 5.5, team: "PAOK" },
  { name: "Victor Osimhen", country: "Nigeria", country_code: "NGA", position: "ATT", value: 11.0, team: "Galatasaray" },
  { name: "Ademola Lookman", country: "Nigeria", country_code: "NGA", position: "ATT", value: 8.5, team: "Atalanta" },
  
  // GROUP D - Senegal
  { name: "Édouard Mendy", country: "Senegal", country_code: "SEN", position: "GK", value: 6.0, team: "Al-Ahli" },
  { name: "Kalidou Koulibaly", country: "Senegal", country_code: "SEN", position: "DEF", value: 7.0, team: "Al-Hilal" },
  { name: "Idrissa Gueye", country: "Senegal", country_code: "SEN", position: "MID", value: 6.0, team: "Everton" },
  { name: "Sadio Mané", country: "Senegal", country_code: "SEN", position: "ATT", value: 10.5, team: "Al-Nassr" },
  { name: "Nicolas Jackson", country: "Senegal", country_code: "SEN", position: "ATT", value: 8.0, team: "Chelsea" },
  
  // GROUP E - Algeria
  { name: "Rais M'Bolhi", country: "Algeria", country_code: "ALG", position: "GK", value: 4.5, team: "Al-Ittifaq" },
  { name: "Ramy Bensebaini", country: "Algeria", country_code: "ALG", position: "DEF", value: 6.0, team: "Dortmund" },
  { name: "Riyad Mahrez", country: "Algeria", country_code: "ALG", position: "MID", value: 9.5, team: "Al-Ahli" },
  { name: "Islam Slimani", country: "Algeria", country_code: "ALG", position: "ATT", value: 5.5, team: "CR Belouizdad" },
  
  // GROUP F - Côte d'Ivoire (Defending Champions)
  { name: "Yahia Fofana", country: "Côte d'Ivoire", country_code: "CIV", position: "GK", value: 4.5, team: "Angers" },
  { name: "Sébastien Haller", country: "Côte d'Ivoire", country_code: "CIV", position: "ATT", value: 7.5, team: "Leganés" },
  { name: "Franck Kessié", country: "Côte d'Ivoire", country_code: "CIV", position: "MID", value: 6.5, team: "Al-Ahli" },
  
  // GROUP F - Cameroon
  { name: "André Onana", country: "Cameroon", country_code: "CMR", position: "GK", value: 6.5, team: "Man United" },
  { name: "Vincent Aboubakar", country: "Cameroon", country_code: "CMR", position: "ATT", value: 6.0, team: "Besiktas" },
  
  // Budget players from other teams
  { name: "Erving Botaka", country: "DR Congo", country_code: "COD", position: "MID", value: 5.0, team: "Esperance" },
  { name: "Percy Tau", country: "South Africa", country_code: "RSA", position: "ATT", value: 6.5, team: "Al Ahly" },
  { name: "Knowledge Musona", country: "Zimbabwe", country_code: "ZIM", position: "ATT", value: 5.0, team: "Al-Tai" },
];

async function seedDatabase() {
  console.log('🌱 Starting to seed database...');
  
  try {
    for (const player of players) {
      const docRef = await addDoc(collection(db, 'players'), {
        ...player,
        goals: 0,
        assists: 0,
        clean_sheets: 0,
        yellow_cards: 0,
        red_cards: 0,
        minutes_played: 0,
        total_points: 0,
        created_at: new Date()
      });
      console.log(`✅ Added: ${player.name} (${player.country}) - ID: ${docRef.id}`);
    }
    
    console.log(`\n🎉 Successfully added ${players.length} players!`);
    console.log('✅ Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();