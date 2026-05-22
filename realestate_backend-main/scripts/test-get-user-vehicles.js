const axios = require('axios');

async function testGetUserVehicles() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://192.168.100.32:3000/api/auth/login', {
      email: 'imen@gmail.com',
      password: 'Imen1234' // You may need to adjust this
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    // Now call the getUserVehicles endpoint
    console.log('\n🚗 Fetching user vehicles...');
    const vehiclesResponse = await axios.get('http://192.168.100.32:3000/api/vehicles/my-vehicles?page=1&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n📦 Response status:', vehiclesResponse.status);
    console.log('📦 Response data:', JSON.stringify(vehiclesResponse.data, null, 2));

    if (vehiclesResponse.data.data) {
      console.log(`\n✅ Found ${vehiclesResponse.data.data.length} vehicles`);
      vehiclesResponse.data.data.forEach((vehicle, index) => {
        console.log(`\n🚗 Vehicle ${index + 1}:`);
        console.log(`   ID: ${vehicle._id || vehicle.id}`);
        console.log(`   Title: ${vehicle.title}`);
        console.log(`   Make: ${vehicle.vehicleDetails?.make}`);
        console.log(`   Model: ${vehicle.vehicleDetails?.model}`);
        console.log(`   Images: ${vehicle.media?.images?.length || 0}`);
      });
    } else {
      console.log('\n⚠️  No data array in response');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testGetUserVehicles();
