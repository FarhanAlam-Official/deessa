#!/usr/bin/env node

/**
 * Test Khalti API Connection
 * 
 * This script tests if your Khalti credentials are valid by making a test API call.
 * Run with: node scripts/test-khalti-connection.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    const env = {};
    
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
    
    return env;
  } catch (error) {
    console.error('Failed to load .env file:', error.message);
    return {};
  }
}

const env = loadEnv();
const KHALTI_SECRET_KEY = env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = env.KHALTI_BASE_URL || 'https://khalti.com/api/v2';

console.log('🔍 Testing Khalti Configuration...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Configuration:');
console.log(`  Base URL: ${KHALTI_BASE_URL}`);
console.log(`  Secret Key: ${KHALTI_SECRET_KEY ? KHALTI_SECRET_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`  Key Length: ${KHALTI_SECRET_KEY?.length || 0} characters`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!KHALTI_SECRET_KEY) {
  console.error('❌ ERROR: KHALTI_SECRET_KEY is not set in .env file');
  process.exit(1);
}

// Test with a dummy pidx to see what error we get
const testPidx = 'test_pidx_that_does_not_exist';

console.log('📡 Testing Khalti API Connection...');
console.log(`   Endpoint: ${KHALTI_BASE_URL}/epayment/lookup/`);
console.log(`   Test pidx: ${testPidx}\n`);

try {
  const response = await fetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
    },
    body: JSON.stringify({ pidx: testPidx }),
  });

  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Failed to parse response as JSON');
    console.error('   Raw response:', responseText.substring(0, 500));
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Response:');
  console.log(`  Status: ${response.status} ${response.statusText}`);
  console.log(`  OK: ${response.ok}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (response.status === 401) {
    console.error('❌ AUTHENTICATION FAILED');
    console.error('   Your Khalti secret key is invalid or expired.\n');
    console.error('   Khalti Response:', JSON.stringify(data, null, 2));
    console.error('\n🔧 How to fix:');
    console.error('   1. For Sandbox: Get your key from https://test-admin.khalti.com');
    console.error('   2. For Production: Get your key from https://admin.khalti.com');
    console.error('   3. Make sure KHALTI_BASE_URL matches your key:');
    console.error('      - Sandbox: https://dev.khalti.com/api/v2');
    console.error('      - Production: https://khalti.com/api/v2');
    console.error('   4. Update KHALTI_SECRET_KEY in your .env file');
    process.exit(1);
  } else if (response.status === 404) {
    console.log('✅ AUTHENTICATION SUCCESSFUL!');
    console.log('   Your Khalti secret key is valid.');
    console.log('   (Got 404 as expected for non-existent pidx)\n');
    console.log('   Khalti Response:', JSON.stringify(data, null, 2));
    console.log('\n✨ Your Khalti configuration is correct!');
  } else if (response.status === 400 && data.error_key === 'validation_error') {
    console.log('✅ AUTHENTICATION SUCCESSFUL!');
    console.log('   Your Khalti secret key is valid.');
    console.log('   (Got validation error as expected for test pidx)\n');
    console.log('   Khalti Response:', JSON.stringify(data, null, 2));
    console.log('\n✨ Your Khalti configuration is correct!');
  } else {
    console.log('⚠️  UNEXPECTED RESPONSE');
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
    console.log('\n   This might be okay, but please verify the response above.');
  }

} catch (error) {
  console.error('❌ NETWORK ERROR');
  console.error('   Failed to connect to Khalti API');
  console.error('   Error:', error.message);
  console.error('\n🔧 Possible causes:');
  console.error('   1. No internet connection');
  console.error('   2. Firewall blocking the request');
  console.error('   3. Khalti API is down');
  console.error('   4. Invalid BASE_URL');
  process.exit(1);
}
