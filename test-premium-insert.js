const fetch = require('node-fetch');

async function testPremiumInsert() {
  try {
    console.log('🔍 Testing Premium membership plan insertion...');
    
    const response = await fetch('http://localhost:3000/api/membership/insert-premium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('📊 Status:', response.status);
    const result = await response.text();
    console.log('📊 Response:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPremiumInsert();
