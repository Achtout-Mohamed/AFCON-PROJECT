// Load environment variables from .env file
require('dotenv').config();

const axios = require('axios');

// Get API key from .env file
const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;

async function testAPI() {
  console.log('🧪 Testing Football-Data.org API...\n');
  
  // Check if API key is loaded
  if (!API_KEY) {
    console.log('❌ ERROR: API key not found!');
    console.log('   Make sure .env file exists with:');
    console.log('   EXPO_PUBLIC_FOOTBALL_DATA_API_KEY=your_key_here\n');
    return;
  }
  
  console.log('✅ API Key loaded from .env');
  console.log('   Key starts with:', API_KEY.substring(0, 10) + '...\n');
  
  try {
    // Test: Get all competitions
    console.log('📋 Fetching competitions...');
    const response = await axios.get('https://api.football-data.org/v4/competitions', {
      headers: {
        'X-Auth-Token': API_KEY,
      }
    });
    
    console.log('✅ API connection successful!\n');
    
    // Find African competitions
    console.log('🌍 Looking for AFCON...');
    const africanComps = response.data.competitions.filter(comp => 
      comp.name.toLowerCase().includes('africa') ||
      comp.name.toLowerCase().includes('afcon') ||
      comp.code === 'CLI'
    );
    
    if (africanComps.length > 0) {
      console.log('✅ Found African competitions:\n');
      africanComps.forEach(comp => {
        console.log(`   🏆 ${comp.name}`);
        console.log(`      Code: ${comp.code}`);
        console.log(`      ID: ${comp.id}`);
        console.log('');
      });
      
      console.log('⚠️  IMPORTANT: Update AFCON_CODE in footballDataService.tsx');
      console.log(`   Change: const AFCON_CODE = '${africanComps[0].code}';`);
    } else {
      console.log('⚠️  AFCON not found\n');
      console.log('📋 Available competitions (first 15):');
      response.data.competitions.slice(0, 15).forEach(comp => {
        console.log(`   - ${comp.name} (${comp.code})`);
      });
    }
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    if (error.response) {
      console.log('\n❌ API Error!');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.message || error.message);
      
      if (error.response.status === 403) {
        console.log('\n⚠️  Your API key might be invalid');
        console.log('   1. Check you copied the full key in .env');
        console.log('   2. Verify email confirmation');
        console.log('   3. Check activation on football-data.org');
      }
    } else {
      console.log('\n❌ Error:', error.message);
    }
  }
}

testAPI();