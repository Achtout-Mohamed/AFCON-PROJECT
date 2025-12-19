// update-afcon-teams-players-simple.js
// Simple script to replace ALL players with ONLY qualified AFCON 2025 teams
// NO AUTHENTICATION - Requires Firebase rules to allow write temporarily

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  deleteDoc
} from 'firebase/firestore';

// Firebase config
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

// ==========================================
// QUALIFIED AFCON 2025 TEAMS (24 TEAMS ONLY)
// ==========================================
const QUALIFIED_TEAMS = [
  // GROUP A
  { name: "Morocco", code: "MAR", group: "A" },
  { name: "Mali", code: "MLI", group: "A" },
  { name: "Zambia", code: "ZAM", group: "A" },
  { name: "Comoros", code: "COM", group: "A" },
  
  // GROUP B
  { name: "Egypt", code: "EGY", group: "B" },
  { name: "South Africa", code: "RSA", group: "B" },
  { name: "Angola", code: "ANG", group: "B" },
  { name: "Zimbabwe", code: "ZIM", group: "B" },
  
  // GROUP C
  { name: "Nigeria", code: "NGA", group: "C" },
  { name: "Tunisia", code: "TUN", group: "C" },
  { name: "Uganda", code: "UGA", group: "C" },
  { name: "Tanzania", code: "TAN", group: "C" },
  
  // GROUP D
  { name: "Senegal", code: "SEN", group: "D" },
  { name: "DR Congo", code: "COD", group: "D" },
  { name: "Benin", code: "BEN", group: "D" },
  { name: "Botswana", code: "BOT", group: "D" },
  
  // GROUP E
  { name: "Algeria", code: "ALG", group: "E" },
  { name: "Burkina Faso", code: "BFA", group: "E" },
  { name: "Equatorial Guinea", code: "EQG", group: "E" },
  { name: "Sudan", code: "SUD", group: "E" },
  
  // GROUP F
  { name: "Côte d'Ivoire", code: "CIV", group: "F" },
  { name: "Cameroon", code: "CMR", group: "F" },
  { name: "Gabon", code: "GAB", group: "F" },
  { name: "Mozambique", code: "MOZ", group: "F" }
];

// ==========================================
// QUALIFIED PLAYERS ONLY (183 PLAYERS)
// ==========================================
const AFCON_PLAYERS = [
  // ============ GROUP A - MOROCCO (Host) ============
  { name: "Yassine Bounou", country: "Morocco", country_code: "MAR", position: "GK", value: 6.0, team: "Al-Hilal" },
  { name: "Munir Mohamedi", country: "Morocco", country_code: "MAR", position: "GK", value: 4.5, team: "Al Wehda" },
  { name: "Achraf Hakimi", country: "Morocco", country_code: "MAR", position: "DEF", value: 8.5, team: "PSG" },
  { name: "Noussair Mazraoui", country: "Morocco", country_code: "MAR", position: "DEF", value: 6.5, team: "Man United" },
  { name: "Romain Saïss", country: "Morocco", country_code: "MAR", position: "DEF", value: 5.5, team: "Al-Shabab" },
  { name: "Nayef Aguerd", country: "Morocco", country_code: "MAR", position: "DEF", value: 6.0, team: "West Ham" },
  { name: "Achraf Dari", country: "Morocco", country_code: "MAR", position: "DEF", value: 5.0, team: "Brest" },
  { name: "Sofyan Amrabat", country: "Morocco", country_code: "MAR", position: "MID", value: 6.5, team: "Fiorentina" },
  { name: "Azzedine Ounahi", country: "Morocco", country_code: "MAR", position: "MID", value: 6.0, team: "Marseille" },
  { name: "Hakim Ziyech", country: "Morocco", country_code: "MAR", position: "MID", value: 8.0, team: "Galatasaray" },
  { name: "Amine Adli", country: "Morocco", country_code: "MAR", position: "MID", value: 6.5, team: "Leverkusen" },
  { name: "Youssef En-Nesyri", country: "Morocco", country_code: "MAR", position: "ATT", value: 7.5, team: "Fenerbahce" },
  { name: "Ayoub El Kaabi", country: "Morocco", country_code: "MAR", position: "ATT", value: 6.5, team: "Olympiacos" },
  { name: "Ilias Akhomach", country: "Morocco", country_code: "MAR", position: "ATT", value: 5.5, team: "Villarreal" },
  
  // ============ GROUP A - MALI ============
  { name: "Djigui Diarra", country: "Mali", country_code: "MLI", position: "GK", value: 4.5, team: "Young Africans" },
  { name: "Falaye Sacko", country: "Mali", country_code: "MLI", position: "DEF", value: 5.0, team: "Montpellier" },
  { name: "Sikou Niakaté", country: "Mali", country_code: "MLI", position: "DEF", value: 5.0, team: "Guingamp" },
  { name: "Amadou Haidara", country: "Mali", country_code: "MLI", position: "MID", value: 6.5, team: "RB Leipzig" },
  { name: "Yves Bissouma", country: "Mali", country_code: "MLI", position: "MID", value: 6.5, team: "Tottenham" },
  { name: "Kamory Doumbia", country: "Mali", country_code: "MLI", position: "MID", value: 5.5, team: "Brest" },
  { name: "El Bilal Touré", country: "Mali", country_code: "MLI", position: "ATT", value: 6.5, team: "Stuttgart" },
  { name: "Adama Traoré", country: "Mali", country_code: "MLI", position: "ATT", value: 6.0, team: "Shakhtar" },
  
  // ============ GROUP A - ZAMBIA ============
  { name: "Lawrence Mulenga", country: "Zambia", country_code: "ZAM", position: "GK", value: 4.0, team: "Red Arrows" },
  { name: "Stoppila Sunzu", country: "Zambia", country_code: "ZAM", position: "DEF", value: 4.5, team: "Pyramids" },
  { name: "Frankie Musonda", country: "Zambia", country_code: "ZAM", position: "DEF", value: 4.5, team: "Red Arrows" },
  { name: "Kings Kangwa", country: "Zambia", country_code: "ZAM", position: "MID", value: 5.0, team: "Arsenal Tula" },
  { name: "Fashion Sakala", country: "Zambia", country_code: "ZAM", position: "ATT", value: 5.5, team: "Al-Fayha" },
  { name: "Patson Daka", country: "Zambia", country_code: "ZAM", position: "ATT", value: 6.5, team: "Leicester" },
  
  // ============ GROUP A - COMOROS ============
  { name: "Ali Ahamada", country: "Comoros", country_code: "COM", position: "GK", value: 4.0, team: "Ajaccio" },
  { name: "Kassim Abdallah", country: "Comoros", country_code: "COM", position: "DEF", value: 4.0, team: "Al-Sailiya" },
  { name: "Rafiki Said", country: "Comoros", country_code: "COM", position: "MID", value: 4.5, team: "Nantes" },
  { name: "Faïz Selemani", country: "Comoros", country_code: "COM", position: "MID", value: 5.0, team: "Caen" },
  { name: "Youssouf M'Changama", country: "Comoros", country_code: "COM", position: "MID", value: 5.0, team: "Guingamp" },
  
  // ============ GROUP B - EGYPT ============
  { name: "Mohamed El Shenawy", country: "Egypt", country_code: "EGY", position: "GK", value: 5.5, team: "Al Ahly" },
  { name: "Mohamed Abou Gabal", country: "Egypt", country_code: "EGY", position: "GK", value: 4.5, team: "Pyramids" },
  { name: "Mohamed Hamdy", country: "Egypt", country_code: "EGY", position: "DEF", value: 5.0, team: "Zamalek" },
  { name: "Omar Kamal", country: "Egypt", country_code: "EGY", position: "DEF", value: 5.0, team: "Future FC" },
  { name: "Mohamed Elneny", country: "Egypt", country_code: "EGY", position: "MID", value: 5.5, team: "Al Jazira" },
  { name: "Mohamed Salah", country: "Egypt", country_code: "EGY", position: "ATT", value: 11.5, team: "Liverpool" },
  { name: "Omar Marmoush", country: "Egypt", country_code: "EGY", position: "ATT", value: 7.5, team: "Eintracht Frankfurt" },
  { name: "Mostafa Mohamed", country: "Egypt", country_code: "EGY", position: "ATT", value: 6.5, team: "Nantes" },
  { name: "Zizo", country: "Egypt", country_code: "EGY", position: "MID", value: 5.5, team: "Zamalek" },
  { name: "Mahmoud Hassan Trézéguet", country: "Egypt", country_code: "EGY", position: "MID", value: 6.0, team: "Trabzonspor" },
  
  // ============ GROUP B - SOUTH AFRICA ============
  { name: "Ronwen Williams", country: "South Africa", country_code: "RSA", position: "GK", value: 5.0, team: "Mamelodi Sundowns" },
  { name: "Mothobi Mvala", country: "South Africa", country_code: "RSA", position: "DEF", value: 5.0, team: "Mamelodi Sundowns" },
  { name: "Aubrey Modiba", country: "South Africa", country_code: "RSA", position: "DEF", value: 4.5, team: "Mamelodi Sundowns" },
  { name: "Teboho Mokoena", country: "South Africa", country_code: "RSA", position: "MID", value: 6.0, team: "Mamelodi Sundowns" },
  { name: "Themba Zwane", country: "South Africa", country_code: "RSA", position: "MID", value: 6.0, team: "Mamelodi Sundowns" },
  { name: "Percy Tau", country: "South Africa", country_code: "RSA", position: "ATT", value: 7.0, team: "Al Ahly" },
  { name: "Evidence Makgopa", country: "South Africa", country_code: "RSA", position: "ATT", value: 5.5, team: "Orlando Pirates" },
  
  // ============ GROUP B - ANGOLA ============
  { name: "Neblú", country: "Angola", country_code: "ANG", position: "GK", value: 4.0, team: "Petro Atlético" },
  { name: "Kialonda Gaspar", country: "Angola", country_code: "ANG", position: "DEF", value: 4.5, team: "1º de Agosto" },
  { name: "Show", country: "Angola", country_code: "ANG", position: "MID", value: 5.0, team: "Al-Hilal Omdurman" },
  { name: "Fredy", country: "Angola", country_code: "ANG", position: "MID", value: 5.0, team: "Petro Atlético" },
  { name: "Mabululu", country: "Angola", country_code: "ANG", position: "ATT", value: 5.5, team: "Petro Atlético" },
  { name: "Zini", country: "Angola", country_code: "ANG", position: "ATT", value: 5.0, team: "GD Interclube" },
  
  // ============ GROUP B - ZIMBABWE ============
  { name: "Washington Arubi", country: "Zimbabwe", country_code: "ZIM", position: "GK", value: 4.0, team: "Marumo Gallants" },
  { name: "Teenage Hadebe", country: "Zimbabwe", country_code: "ZIM", position: "DEF", value: 5.0, team: "FC Cincinnati" },
  { name: "Jordan Zemura", country: "Zimbabwe", country_code: "ZIM", position: "DEF", value: 5.5, team: "Udinese" },
  { name: "Marshall Munetsi", country: "Zimbabwe", country_code: "ZIM", position: "MID", value: 6.0, team: "Reims" },
  { name: "Khama Billiat", country: "Zimbabwe", country_code: "ZIM", position: "MID", value: 5.5, team: "Kaizer Chiefs" },
  { name: "Knowledge Musona", country: "Zimbabwe", country_code: "ZIM", position: "ATT", value: 5.5, team: "Al-Tai" },
  
  // ============ GROUP C - NIGERIA ============
  { name: "Stanley Nwabali", country: "Nigeria", country_code: "NGA", position: "GK", value: 5.0, team: "Chippa United" },
  { name: "Francis Uzoho", country: "Nigeria", country_code: "NGA", position: "GK", value: 4.5, team: "Omonia" },
  { name: "William Troost-Ekong", country: "Nigeria", country_code: "NGA", position: "DEF", value: 6.0, team: "PAOK" },
  { name: "Calvin Bassey", country: "Nigeria", country_code: "NGA", position: "DEF", value: 6.5, team: "Fulham" },
  { name: "Bright Osayi-Samuel", country: "Nigeria", country_code: "NGA", position: "DEF", value: 5.5, team: "Fenerbahce" },
  { name: "Wilfred Ndidi", country: "Nigeria", country_code: "NGA", position: "MID", value: 6.5, team: "Leicester" },
  { name: "Frank Onyeka", country: "Nigeria", country_code: "NGA", position: "MID", value: 5.5, team: "Augsburg" },
  { name: "Alex Iwobi", country: "Nigeria", country_code: "NGA", position: "MID", value: 7.0, team: "Fulham" },
  { name: "Samuel Chukwueze", country: "Nigeria", country_code: "NGA", position: "MID", value: 7.5, team: "AC Milan" },
  { name: "Victor Osimhen", country: "Nigeria", country_code: "NGA", position: "ATT", value: 11.0, team: "Galatasaray" },
  { name: "Ademola Lookman", country: "Nigeria", country_code: "NGA", position: "ATT", value: 8.5, team: "Atalanta" },
  { name: "Victor Boniface", country: "Nigeria", country_code: "NGA", position: "ATT", value: 8.0, team: "Leverkusen" },
  
  // ============ GROUP C - TUNISIA ============
  { name: "Aymen Dahmen", country: "Tunisia", country_code: "TUN", position: "GK", value: 5.0, team: "Al-Okhdood" },
  { name: "Bechir Ben Said", country: "Tunisia", country_code: "TUN", position: "GK", value: 4.0, team: "US Monastir" },
  { name: "Montassar Talbi", country: "Tunisia", country_code: "TUN", position: "DEF", value: 5.5, team: "Lorient" },
  { name: "Yassine Meriah", country: "Tunisia", country_code: "TUN", position: "DEF", value: 5.0, team: "Esperance" },
  { name: "Aïssa Laïdouni", country: "Tunisia", country_code: "TUN", position: "MID", value: 6.0, team: "Union Berlin" },
  { name: "Ellyes Skhiri", country: "Tunisia", country_code: "TUN", position: "MID", value: 6.5, team: "Eintracht Frankfurt" },
  { name: "Hannibal Mejbri", country: "Tunisia", country_code: "TUN", position: "MID", value: 6.0, team: "Burnley" },
  { name: "Youssef Msakni", country: "Tunisia", country_code: "TUN", position: "ATT", value: 6.5, team: "Al-Arabi" },
  { name: "Seifeddine Jaziri", country: "Tunisia", country_code: "TUN", position: "ATT", value: 5.5, team: "Zamalek" },
  
  // ============ GROUP C - UGANDA ============
  { name: "Isima Watenga", country: "Uganda", country_code: "UGA", position: "GK", value: 4.0, team: "Zesco United" },
  { name: "Halid Lwaliwa", country: "Uganda", country_code: "UGA", position: "DEF", value: 4.5, team: "Al Hilal Omdurman" },
  { name: "Denis Onyango", country: "Uganda", country_code: "UGA", position: "GK", value: 4.5, team: "Mamelodi Sundowns" },
  { name: "Khalid Aucho", country: "Uganda", country_code: "UGA", position: "MID", value: 5.0, team: "Young Africans" },
  { name: "Allan Okello", country: "Uganda", country_code: "UGA", position: "MID", value: 5.0, team: "Vipers SC" },
  { name: "Fahad Bayo", country: "Uganda", country_code: "UGA", position: "ATT", value: 5.0, team: "Vipers SC" },
  
  // ============ GROUP C - TANZANIA ============
  { name: "Aishi Manula", country: "Tanzania", country_code: "TAN", position: "GK", value: 4.0, team: "Young Africans" },
  { name: "Mohamed Hussein", country: "Tanzania", country_code: "TAN", position: "DEF", value: 4.5, team: "Azam FC" },
  { name: "Novatus Miroshi", country: "Tanzania", country_code: "TAN", position: "MID", value: 4.5, team: "Simba SC" },
  { name: "Feisal Salum", country: "Tanzania", country_code: "TAN", position: "MID", value: 5.0, team: "Azam FC" },
  { name: "Mbwana Samatta", country: "Tanzania", country_code: "TAN", position: "ATT", value: 6.0, team: "Al-Fayha" },
  
  // ============ GROUP D - SENEGAL ============
  { name: "Édouard Mendy", country: "Senegal", country_code: "SEN", position: "GK", value: 6.0, team: "Al-Ahli" },
  { name: "Seny Dieng", country: "Senegal", country_code: "SEN", position: "GK", value: 4.5, team: "Middlesbrough" },
  { name: "Kalidou Koulibaly", country: "Senegal", country_code: "SEN", position: "DEF", value: 7.5, team: "Al-Hilal" },
  { name: "Abdou Diallo", country: "Senegal", country_code: "SEN", position: "DEF", value: 6.0, team: "RB Leipzig" },
  { name: "Pape Abou Cissé", country: "Senegal", country_code: "SEN", position: "DEF", value: 5.5, team: "Olympiacos" },
  { name: "Idrissa Gueye", country: "Senegal", country_code: "SEN", position: "MID", value: 6.5, team: "Everton" },
  { name: "Pape Matar Sarr", country: "Senegal", country_code: "SEN", position: "MID", value: 6.5, team: "Tottenham" },
  { name: "Krepin Diatta", country: "Senegal", country_code: "SEN", position: "MID", value: 6.0, team: "Monaco" },
  { name: "Ismaïla Sarr", country: "Senegal", country_code: "SEN", position: "ATT", value: 7.5, team: "Crystal Palace" },
  { name: "Sadio Mané", country: "Senegal", country_code: "SEN", position: "ATT", value: 10.5, team: "Al-Nassr" },
  { name: "Nicolas Jackson", country: "Senegal", country_code: "SEN", position: "ATT", value: 8.5, team: "Chelsea" },
  { name: "Boulaye Dia", country: "Senegal", country_code: "SEN", position: "ATT", value: 7.0, team: "Salernitana" },
  
  // ============ GROUP D - DR CONGO ============
  { name: "Lionel Mpasi", country: "DR Congo", country_code: "COD", position: "GK", value: 4.5, team: "Rodez" },
  { name: "Chancel Mbemba", country: "DR Congo", country_code: "COD", position: "DEF", value: 7.0, team: "Marseille" },
  { name: "Arthur Masuaku", country: "DR Congo", country_code: "COD", position: "DEF", value: 5.5, team: "Besiktas" },
  { name: "Gédéon Kalulu", country: "DR Congo", country_code: "COD", position: "DEF", value: 5.0, team: "Lorient" },
  { name: "Samuel Moutoussamy", country: "DR Congo", country_code: "COD", position: "MID", value: 5.5, team: "Nantes" },
  { name: "Yoane Wissa", country: "DR Congo", country_code: "COD", position: "ATT", value: 7.5, team: "Brentford" },
  { name: "Cédric Bakambu", country: "DR Congo", country_code: "COD", position: "ATT", value: 6.5, team: "Real Betis" },
  
  // ============ GROUP D - BENIN ============
  { name: "Saturnin Allagbé", country: "Benin", country_code: "BEN", position: "GK", value: 4.0, team: "Dijon" },
  { name: "Cédric Hountondji", country: "Benin", country_code: "BEN", position: "DEF", value: 5.0, team: "Clermont" },
  { name: "Sessi D'Almeida", country: "Benin", country_code: "BEN", position: "MID", value: 5.0, team: "Montpellier" },
  { name: "Steve Mounié", country: "Benin", country_code: "BEN", position: "ATT", value: 6.0, team: "Augsburg" },
  { name: "Jodel Dossou", country: "Benin", country_code: "BEN", position: "ATT", value: 5.5, team: "Clermont" },
  
  // ============ GROUP D - BOTSWANA ============
  { name: "Goitseone Phoko", country: "Botswana", country_code: "BOT", position: "GK", value: 4.0, team: "Jwaneng Galaxy" },
  { name: "Thatayaone Ditlhokwe", country: "Botswana", country_code: "BOT", position: "DEF", value: 4.5, team: "SuperSport United" },
  { name: "Gape Mohutsiwa", country: "Botswana", country_code: "BOT", position: "MID", value: 4.5, team: "Polokwane City" },
  { name: "Kabelo Seakanyeng", country: "Botswana", country_code: "BOT", position: "MID", value: 5.0, team: "Sekhukhune United" },
  { name: "Thabang Sesinyi", country: "Botswana", country_code: "BOT", position: "ATT", value: 5.0, team: "Stellenbosch" },
  
  // ============ GROUP E - ALGERIA ============
  { name: "Rais M'Bolhi", country: "Algeria", country_code: "ALG", position: "GK", value: 4.5, team: "Al-Ittifaq" },
  { name: "Anthony Mandrea", country: "Algeria", country_code: "ALG", position: "GK", value: 4.0, team: "Ajaccio" },
  { name: "Ramy Bensebaini", country: "Algeria", country_code: "ALG", position: "DEF", value: 6.5, team: "Dortmund" },
  { name: "Aïssa Mandi", country: "Algeria", country_code: "ALG", position: "DEF", value: 5.5, team: "Lille" },
  { name: "Mohamed-Amine Tougai", country: "Algeria", country_code: "ALG", position: "DEF", value: 5.0, team: "Hertha Berlin" },
  { name: "Houssem Aouar", country: "Algeria", country_code: "ALG", position: "MID", value: 7.0, team: "Roma" },
  { name: "Ramiz Zerrouki", country: "Algeria", country_code: "ALG", position: "MID", value: 6.0, team: "Feyenoord" },
  { name: "Riyad Mahrez", country: "Algeria", country_code: "ALG", position: "MID", value: 9.5, team: "Al-Ahli" },
  { name: "Islam Slimani", country: "Algeria", country_code: "ALG", position: "ATT", value: 6.0, team: "CR Belouizdad" },
  { name: "Yacine Brahimi", country: "Algeria", country_code: "ALG", position: "MID", value: 6.5, team: "Al-Gharafa" },
  
  // ============ GROUP E - BURKINA FASO ============
  { name: "Hervé Koffi", country: "Burkina Faso", country_code: "BFA", position: "GK", value: 5.0, team: "Charleroi" },
  { name: "Farid Ouédraogo", country: "Burkina Faso", country_code: "BFA", position: "GK", value: 4.0, team: "ASEC Mimosas" },
  { name: "Edmond Tapsoba", country: "Burkina Faso", country_code: "BFA", position: "DEF", value: 7.5, team: "Leverkusen" },
  { name: "Issoufou Dayo", country: "Burkina Faso", country_code: "BFA", position: "DEF", value: 5.5, team: "Pyramids" },
  { name: "Steeve Yago", country: "Burkina Faso", country_code: "BFA", position: "DEF", value: 5.0, team: "Al-Okhdood" },
  { name: "Blati Touré", country: "Burkina Faso", country_code: "BFA", position: "MID", value: 5.5, team: "ASEC Mimosas" },
  { name: "Bertrand Traoré", country: "Burkina Faso", country_code: "BFA", position: "ATT", value: 7.0, team: "Villarreal" },
  { name: "Dango Ouattara", country: "Burkina Faso", country_code: "BFA", position: "ATT", value: 6.5, team: "Bournemouth" },
  
  // ============ GROUP E - EQUATORIAL GUINEA ============
  { name: "Jesús Owono", country: "Equatorial Guinea", country_code: "EQG", position: "GK", value: 4.0, team: "Alavés" },
  { name: "Saúl Coco", country: "Equatorial Guinea", country_code: "EQG", position: "DEF", value: 5.5, team: "Las Palmas" },
  { name: "Carlos Akapo", country: "Equatorial Guinea", country_code: "EQG", position: "DEF", value: 5.0, team: "Cádiz" },
  { name: "Pablo Ganet", country: "Equatorial Guinea", country_code: "EQG", position: "MID", value: 5.0, team: "Alcorcón" },
  { name: "Emilio Nsue", country: "Equatorial Guinea", country_code: "EQG", position: "ATT", value: 6.0, team: "Intercity" },
  
  // ============ GROUP E - SUDAN ============
  { name: "Ali Abu Eshrein", country: "Sudan", country_code: "SUD", position: "GK", value: 4.0, team: "Al Hilal Omdurman" },
  { name: "Mohamed Abdelrahman", country: "Sudan", country_code: "SUD", position: "DEF", value: 4.5, team: "Al Hilal Omdurman" },
  { name: "Walieldin Daiyeen", country: "Sudan", country_code: "SUD", position: "MID", value: 5.0, team: "Al Hilal Omdurman" },
  { name: "Mohamed Abdelrahman", country: "Sudan", country_code: "SUD", position: "ATT", value: 5.0, team: "Al Hilal Omdurman" },
  
  // ============ GROUP F - CÔTE D'IVOIRE (Defending Champions) ============
  { name: "Yahia Fofana", country: "Côte d'Ivoire", country_code: "CIV", position: "GK", value: 5.0, team: "Angers" },
  { name: "Badra Sangaré", country: "Côte d'Ivoire", country_code: "CIV", position: "GK", value: 4.0, team: "Pyramids" },
  { name: "Serge Aurier", country: "Côte d'Ivoire", country_code: "CIV", position: "DEF", value: 6.0, team: "Galatasaray" },
  { name: "Ghislain Konan", country: "Côte d'Ivoire", country_code: "CIV", position: "DEF", value: 5.5, team: "Reims" },
  { name: "Odilon Kossounou", country: "Côte d'Ivoire", country_code: "CIV", position: "DEF", value: 6.5, team: "Leverkusen" },
  { name: "Franck Kessié", country: "Côte d'Ivoire", country_code: "CIV", position: "MID", value: 7.0, team: "Al-Ahli" },
  { name: "Seko Fofana", country: "Côte d'Ivoire", country_code: "CIV", position: "MID", value: 6.5, team: "Al-Nassr" },
  { name: "Jean-Philippe Krasso", country: "Côte d'Ivoire", country_code: "CIV", position: "ATT", value: 6.0, team: "Brest" },
  { name: "Sébastien Haller", country: "Côte d'Ivoire", country_code: "CIV", position: "ATT", value: 7.5, team: "Leganés" },
  { name: "Nicolas Pépé", country: "Côte d'Ivoire", country_code: "CIV", position: "ATT", value: 7.5, team: "Villarreal" },
  { name: "Christian Kouamé", country: "Côte d'Ivoire", country_code: "CIV", position: "ATT", value: 6.5, team: "Fiorentina" },
  
  // ============ GROUP F - CAMEROON ============
  { name: "André Onana", country: "Cameroon", country_code: "CMR", position: "GK", value: 6.5, team: "Man United" },
  { name: "Devis Epassy", country: "Cameroon", country_code: "CMR", position: "GK", value: 4.5, team: "Abha" },
  { name: "Collins Fai", country: "Cameroon", country_code: "CMR", position: "DEF", value: 5.0, team: "Al-Tai" },
  { name: "Nouhou Tolo", country: "Cameroon", country_code: "CMR", position: "DEF", value: 5.5, team: "Seattle Sounders" },
  { name: "Jean-Charles Castelletto", country: "Cameroon", country_code: "CMR", position: "DEF", value: 5.5, team: "Nantes" },
  { name: "André-Frank Zambo Anguissa", country: "Cameroon", country_code: "CMR", position: "MID", value: 7.0, team: "Napoli" },
  { name: "Frank Anguissa", country: "Cameroon", country_code: "CMR", position: "MID", value: 7.0, team: "Napoli" },
  { name: "Karl Toko Ekambi", country: "Cameroon", country_code: "CMR", position: "ATT", value: 6.5, team: "Al-Ittihad" },
  { name: "Vincent Aboubakar", country: "Cameroon", country_code: "CMR", position: "ATT", value: 6.5, team: "Besiktas" },
  { name: "Eric Maxim Choupo-Moting", country: "Cameroon", country_code: "CMR", position: "ATT", value: 7.0, team: "Bayern Munich" },
  
  // ============ GROUP F - GABON ============
  { name: "Jean-Noël Amonome", country: "Gabon", country_code: "GAB", position: "GK", value: 4.0, team: "CF Mounana" },
  { name: "Aaron Appindangoyé", country: "Gabon", country_code: "GAB", position: "DEF", value: 4.5, team: "CF Mounana" },
  { name: "Lloyd Palun", country: "Gabon", country_code: "GAB", position: "DEF", value: 4.5, team: "Le Mans" },
  { name: "Guélor Kanga", country: "Gabon", country_code: "GAB", position: "MID", value: 6.0, team: "Red Star" },
  { name: "Denis Bouanga", country: "Gabon", country_code: "GAB", position: "ATT", value: 7.5, team: "LAFC" },
  { name: "Pierre-Emerick Aubameyang", country: "Gabon", country_code: "GAB", position: "ATT", value: 9.5, team: "Marseille" },
  { name: "Jim Allevinah", country: "Gabon", country_code: "GAB", position: "ATT", value: 6.0, team: "Clermont" },
  
  // ============ GROUP F - MOZAMBIQUE ============
  { name: "Ernan Siluane", country: "Mozambique", country_code: "MOZ", position: "GK", value: 4.0, team: "Costa do Sol" },
  { name: "Reinildo Mandava", country: "Mozambique", country_code: "MOZ", position: "DEF", value: 6.0, team: "Atlético Madrid" },
  { name: "Domingues", country: "Mozambique", country_code: "MOZ", position: "DEF", value: 4.5, team: "UD Songo" },
  { name: "Witiness Quembo", country: "Mozambique", country_code: "MOZ", position: "MID", value: 5.0, team: "Black Bulls" },
  { name: "Stanley Ratifo", country: "Mozambique", country_code: "MOZ", position: "ATT", value: 5.5, team: "Petro Atlético" },
];

// ==========================================
// DELETE ALL PLAYERS - ONE BY ONE
// ==========================================
async function deleteAllPlayersOneByOne() {
  console.log('\n🗑️  STEP 1: Deleting ALL existing players...\n');
  console.log('⚠️  This will delete EVERY player document individually');
  console.log('   (Including Ghana, Kenya, and all non-qualified teams)\n');
  
  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);
  
  if (snapshot.empty) {
    console.log('ℹ️  No existing players to delete\n');
    return;
  }
  
  console.log(`📋 Found ${snapshot.size} players to delete...`);
  console.log('🔄 Deleting one by one...\n');
  
  let deleteCount = 0;
  const totalPlayers = snapshot.size;
  
  // Delete each document individually
  for (const docSnap of snapshot.docs) {
    try {
      await deleteDoc(docSnap.ref);
      deleteCount++;
      
      // Show progress every 50 players
      if (deleteCount % 50 === 0) {
        console.log(`   🗑️  Deleted ${deleteCount}/${totalPlayers} players...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to delete player ${docSnap.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Successfully deleted ${deleteCount} players!\n`);
}

// ==========================================
// ADD QUALIFIED PLAYERS ONLY
// ==========================================
async function addQualifiedPlayers() {
  console.log('✨ STEP 2: Adding ONLY qualified AFCON 2025 players...\n');
  console.log(`📋 Adding ${AFCON_PLAYERS.length} players from 24 teams\n`);
  
  const playersRef = collection(db, 'players');
  const batchSize = 500; // Firestore batch limit
  let batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;
  
  for (const player of AFCON_PLAYERS) {
    const playerRef = doc(playersRef);
    batch.set(playerRef, {
      ...player,
      goals: 0,
      assists: 0,
      clean_sheets: 0,
      yellow_cards: 0,
      red_cards: 0,
      minutes_played: 0,
      total_points: 0,
      qualified_afcon_2025: true,
      created_at: new Date()
    });
    
    count++;
    batchCount++;
    
    // Commit when batch is full
    if (batchCount === batchSize) {
      await batch.commit();
      console.log(`   ✅ Added ${count}/${AFCON_PLAYERS.length} players...`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`\n✅ Successfully added all ${count} qualified players!\n`);
}

// ==========================================
// VERIFY DATA
// ==========================================
async function verifyData() {
  console.log('🔍 STEP 3: Verifying data...\n');
  
  // Check total players
  const playersRef = collection(db, 'players');
  const playersSnapshot = await getDocs(playersRef);
  console.log(`📊 Total players in database: ${playersSnapshot.size}\n`);
  
  // Check by team
  const teamCounts = {};
  playersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const country = data.country;
    teamCounts[country] = (teamCounts[country] || 0) + 1;
  });
  
  console.log('🏆 Players per qualified team:\n');
  QUALIFIED_TEAMS.forEach(team => {
    const count = teamCounts[team.name] || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`   ${status} ${team.name.padEnd(20)} (${team.code}): ${count} players`);
  });
  
  // Check for non-qualified teams
  const qualifiedCountries = QUALIFIED_TEAMS.map(t => t.name);
  const nonQualifiedTeams = Object.keys(teamCounts).filter(
    country => !qualifiedCountries.includes(country)
  );
  
  if (nonQualifiedTeams.length > 0) {
    console.log('\n⚠️  WARNING: Found non-qualified teams:\n');
    nonQualifiedTeams.forEach(team => {
      console.log(`   ❌ ${team}: ${teamCounts[team]} players (SHOULD NOT EXIST!)`);
    });
  } else {
    console.log('\n✅ Perfect! Only qualified teams present.\n');
  }
  
  // Check positions
  const positions = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  playersSnapshot.docs.forEach(doc => {
    const pos = doc.data().position;
    if (positions[pos] !== undefined) positions[pos]++;
  });
  
  console.log('📊 Players by position:\n');
  console.log(`   🥅 Goalkeepers: ${positions.GK}`);
  console.log(`   🛡️  Defenders: ${positions.DEF}`);
  console.log(`   ⚽ Midfielders: ${positions.MID}`);
  console.log(`   🎯 Attackers: ${positions.ATT}`);
  
  console.log('\n✅ Verification complete!\n');
}

// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  AFCON 2025 - REPLACE ALL WITH QUALIFIED TEAMS ONLY      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('⚠️  IMPORTANT: Make sure your Firebase rules allow writes!\n');
  console.log('   Firestore Rules → players → allow write: if true;\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 This script will:\n');
  console.log('   1. Delete EVERY player (including non-qualified teams)');
  console.log('   2. Add ONLY 183 players from 24 qualified teams');
  console.log('   3. Verify only qualified teams remain\n');
  console.log(`   Qualified teams: ${QUALIFIED_TEAMS.length}`);
  console.log(`   Qualified players: ${AFCON_PLAYERS.length}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    await deleteAllPlayersOneByOne();
    await addQualifiedPlayers();
    await verifyData();
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║               🎉 UPDATE COMPLETE! 🎉                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('✅ Your Firebase now contains:\n');
    console.log(`   • ONLY ${QUALIFIED_TEAMS.length} qualified AFCON 2025 teams`);
    console.log(`   • ONLY ${AFCON_PLAYERS.length} qualified players`);
    console.log('   • All non-qualified teams removed (Ghana, Kenya, etc.)\n');
    console.log('🔒 IMPORTANT: Change Firebase rules back to secure:\n');
    console.log('   players → allow write: if false;\n');
    console.log('🚀 You can now test your app with ONLY qualified teams!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main();