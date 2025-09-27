// Simple test to check Google APIs imports
try {
  const { google } = require('googleapis')
  console.log('✅ Google APIs imported successfully')
  
  const { OAuth2Client } = require('google-auth-library')
  console.log('✅ Google Auth Library imported successfully')
  
  console.log('All Google API imports working correctly')
} catch (error) {
  console.error('❌ Import error:', error.message)
}