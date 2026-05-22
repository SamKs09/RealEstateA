/**
 * Konnect Production Configuration Checker
 * Run this to verify your production setup is correct
 * 
 * Usage: node scripts/check-konnect-production.js
 */

require('dotenv').config();
const axios = require('axios');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.cyan);
}

async function checkKonnectProduction() {
  log('\n========================================', COLORS.blue);
  log('🔍 Konnect Production Setup Checker', COLORS.blue);
  log('========================================\n', COLORS.blue);

  let hasErrors = false;

  // Check 1: Environment Variables
  logInfo('Step 1: Checking environment variables...\n');

  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_WALLET_ID;
  const baseUrl = process.env.KONNECT_BASE_URL;

  if (!apiKey) {
    logError('KONNECT_API_KEY is not set in .env file');
    hasErrors = true;
  } else {
    logSuccess(`KONNECT_API_KEY is set (${apiKey.substring(0, 10)}...)`);
  }

  if (!walletId) {
    logError('KONNECT_WALLET_ID is not set in .env file');
    hasErrors = true;
  } else {
    logSuccess(`KONNECT_WALLET_ID is set (${walletId})`);
  }

  if (!baseUrl) {
    logError('KONNECT_BASE_URL is not set in .env file');
    hasErrors = true;
  } else {
    logSuccess(`KONNECT_BASE_URL is set (${baseUrl})`);
  }

  // Check 2: Production vs Sandbox
  logInfo('\nStep 2: Verifying production mode...\n');

  if (baseUrl && baseUrl.includes('sandbox')) {
    logError('You are still in SANDBOX mode!');
    logWarning('Change KONNECT_BASE_URL to: https://api.konnect.network/api/v2');
    hasErrors = true;
  } else if (baseUrl && baseUrl.includes('api.konnect.network')) {
    logSuccess('Production mode confirmed ✓');
    logWarning('🔴 REAL PAYMENTS WILL BE PROCESSED! 🔴');
  } else {
    logWarning('Unable to determine if in production mode');
  }

  // Check 3: API Key Format
  logInfo('\nStep 3: Validating API key format...\n');

  if (apiKey && apiKey.includes(':')) {
    const [prefix, secret] = apiKey.split(':');
    if (prefix.length > 10 && secret.length > 10) {
      logSuccess('API key format looks valid');
    } else {
      logWarning('API key format may be incorrect');
    }
  } else {
    logError('API key format is invalid (should contain ":")');
    hasErrors = true;
  }

  // Check 4: Test API Connection
  logInfo('\nStep 4: Testing Konnect API connection...\n');

  try {
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Try to fetch wallet details (this won't charge anything)
    const response = await axios.get(`${baseUrl}/wallets/${walletId}`, {
      headers,
      timeout: 10000,
    });

    if (response.status === 200) {
      logSuccess('✓ Successfully connected to Konnect API');
      logSuccess(`✓ Wallet verified: ${response.data.name || 'Production Wallet'}`);
      
      if (response.data.balance !== undefined) {
        logInfo(`  Wallet balance: ${response.data.balance} ${response.data.currency || 'TND'}`);
      }
    }
  } catch (error) {
    if (error.response) {
      logError(`API connection failed: ${error.response.status} ${error.response.statusText}`);
      if (error.response.data) {
        logError(`Error details: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.response.status === 401) {
        logError('Authentication failed - Your API key may be invalid');
        logWarning('Make sure you copied the PRODUCTION API key from Konnect Console');
      } else if (error.response.status === 404) {
        logError('Wallet not found - Your WALLET_ID may be incorrect');
      }
    } else {
      logError(`Network error: ${error.message}`);
      logWarning('Check your internet connection and KONNECT_BASE_URL');
    }
    hasErrors = true;
  }

  // Check 5: Other Important Settings
  logInfo('\nStep 5: Checking other important settings...\n');

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    logWarning('API_URL is not set - webhooks may not work');
  } else {
    logSuccess(`API_URL is set: ${apiUrl}`);
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      logWarning('API_URL is localhost - webhooks will NOT work in production');
      logInfo('Consider using ngrok or deploying to a public server');
    }
  }

  // Summary
  log('\n========================================', COLORS.blue);
  if (hasErrors) {
    logError('❌ Setup has errors - Please fix them before testing');
    log('\nRefer to KONNECT_PRODUCTION_SETUP.md for detailed instructions\n', COLORS.yellow);
    process.exit(1);
  } else {
    logSuccess('✅ All checks passed!');
    log('\n🚀 You are ready to accept real payments!\n', COLORS.green);
    logWarning('⚠️  Remember: This is PRODUCTION - Real money will be charged!');
    logInfo('\nTest with a small amount (1-5 TND) first!\n');
  }
  log('========================================\n', COLORS.blue);
}

// Run the checker
checkKonnectProduction().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
