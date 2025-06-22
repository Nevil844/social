// Test script for Daily.co API integration
require('dotenv').config();
const fetch = require('node-fetch');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

async function testDailyAPI() {
  console.log('🧪 Testing Daily.co API Integration...\n');

  if (!DAILY_API_KEY) {
    console.log('⚠️  No DAILY_API_KEY found in .env file');
    console.log('📝 Video calls will run in demo mode');
    console.log('🔑 Get your API key from: https://dashboard.daily.co/developers\n');
    return;
  }

  try {
    console.log('✅ DAILY_API_KEY found');
    
    // Test API connection by listing rooms
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (response.ok) {
      const rooms = await response.json();
      console.log('✅ API connection successful');
      console.log(`📊 Found ${rooms.data?.length || 0} existing rooms`);
      
      // Test creating a room
      console.log('\n🔄 Testing room creation...');
      const timestamp = Date.now();
      const roomName = `test-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
      const createResponse = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAILY_API_KEY}`
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            max_participants: 2,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.round(Date.now() / 1000) + (60 * 60) // 1 hour expiry
          }
        })
      });

      if (createResponse.ok) {
        const room = await createResponse.json();
        console.log('✅ Room creation successful');
        console.log(`🔗 Room URL: ${room.url}`);
        console.log(`🆔 Room ID: ${room.id}`);
        
        // Clean up test room
        console.log('\n🧹 Cleaning up test room...');
        const deleteResponse = await fetch(`${DAILY_API_URL}/rooms/${room.name}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`
          }
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Test room deleted successfully');
        } else {
          console.log('⚠️  Could not delete test room (will auto-expire)');
        }
      } else {
        const error = await createResponse.text();
        console.log('❌ Room creation failed');
        console.log(`Error: ${error}`);
      }
    } else {
      console.log('❌ API connection failed');
      console.log(`Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ API test failed');
    console.log(`Error: ${error.message}`);
  }

  console.log('\n🎉 Video call API test completed!');
}

testDailyAPI(); 