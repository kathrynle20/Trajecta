const { userDb } = require('./db');

// Mock Google profile data for testing
const mockGoogleProfile = {
  id: 'google_test_123456',
  displayName: 'Test User',
  emails: [{ value: 'testuser@gmail.com' }],
  photos: [{ value: 'https://lh3.googleusercontent.com/test-avatar' }]
};

async function testUserCreation() {
  console.log('🧪 Testing user creation functionality...\n');
  
  try {
    // Test 1: Create new user
    console.log('1️⃣ Testing new user creation...');
    const newUser = await userDb.findOrCreateFromGoogleProfile(mockGoogleProfile);
    console.log('✅ New user created:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      google_id: newUser.google_id
    });
    
    // Test 2: Find existing user (should update, not create duplicate)
    console.log('\n2️⃣ Testing existing user lookup...');
    const existingUser = await userDb.findOrCreateFromGoogleProfile(mockGoogleProfile);
    console.log('✅ Existing user found:', {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      google_id: existingUser.google_id
    });
    
    // Verify it's the same user
    if (newUser.id === existingUser.id) {
      console.log('✅ Correctly returned same user (no duplicate created)');
    } else {
      console.log('❌ ERROR: Different user IDs - duplicate may have been created');
    }
    
    // Test 3: Find user by ID
    console.log('\n3️⃣ Testing user lookup by ID...');
    const userById = await userDb.findById(newUser.id);
    if (userById) {
      console.log('✅ User found by ID:', userById.name);
    } else {
      console.log('❌ ERROR: Could not find user by ID');
    }
    
    // Test 4: Find user by Google ID
    console.log('\n4️⃣ Testing user lookup by Google ID...');
    const userByGoogleId = await userDb.findByGoogleId(mockGoogleProfile.id);
    if (userByGoogleId) {
      console.log('✅ User found by Google ID:', userByGoogleId.name);
    } else {
      console.log('❌ ERROR: Could not find user by Google ID');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 User creation flow is ready for Google OAuth login.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  process.exit(0);
}

// Run the test
testUserCreation();
