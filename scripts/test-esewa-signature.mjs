#!/usr/bin/env node

/**
 * Test eSewa v2 Signature Generation
 * 
 * This script tests the HMAC-SHA256 signature generation for eSewa v2 API.
 * Run with: node scripts/test-esewa-signature.mjs
 */

import crypto from 'crypto';
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
const ESEWA_SECRET_KEY = env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_MERCHANT_ID = env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_BASE_URL = env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np';

console.log('🔍 Testing eSewa v2 Configuration...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Configuration:');
console.log(`  Base URL: ${ESEWA_BASE_URL}`);
console.log(`  Merchant ID: ${ESEWA_MERCHANT_ID}`);
console.log(`  Secret Key: ${ESEWA_SECRET_KEY.substring(0, 8)}...`);
console.log(`  Key Length: ${ESEWA_SECRET_KEY.length} characters`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test data
const testData = {
  total_amount: '100',
  transaction_uuid: '241028',
  product_code: ESEWA_MERCHANT_ID,
};

console.log('📝 Test Data:');
console.log(`  Total Amount: ${testData.total_amount}`);
console.log(`  Transaction UUID: ${testData.transaction_uuid}`);
console.log(`  Product Code: ${testData.product_code}\n`);

// Generate signature
const message = `total_amount=${testData.total_amount},transaction_uuid=${testData.transaction_uuid},product_code=${testData.product_code}`;
console.log('🔐 Generating Signature...');
console.log(`  Message: ${message}\n`);

const hmac = crypto.createHmac('sha256', ESEWA_SECRET_KEY);
hmac.update(message);
const signature = hmac.digest('base64');

console.log('✅ Signature Generated:');
console.log(`  ${signature}\n`);

// Expected signature from eSewa docs (for test data)
const expectedSignature = 'i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Verification:');

if (ESEWA_MERCHANT_ID === 'EPAYTEST' && testData.transaction_uuid === '241028') {
  console.log(`  Expected (from docs): ${expectedSignature}`);
  console.log(`  Generated:            ${signature}`);
  
  if (signature === expectedSignature) {
    console.log('  Result: ✅ MATCH - Signature generation is correct!');
  } else {
    console.log('  Result: ❌ MISMATCH - Check your secret key');
  }
} else {
  console.log('  Result: ℹ️  Using custom test data');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📄 Form Data for Testing:');
console.log(JSON.stringify({
  amount: testData.total_amount,
  tax_amount: '0',
  total_amount: testData.total_amount,
  transaction_uuid: testData.transaction_uuid,
  product_code: testData.product_code,
  product_service_charge: '0',
  product_delivery_charge: '0',
  success_url: `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/esewa/success`,
  failure_url: `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/esewa/failure`,
  signed_field_names: 'total_amount,transaction_uuid,product_code',
  signature: signature,
}, null, 2));

console.log('\n✨ Your eSewa v2 configuration is ready for testing!');
console.log(`\n🌐 Test URL: ${ESEWA_BASE_URL}/api/epay/main/v2/form`);
console.log('\n📚 Test Credentials (from eSewa docs):');
console.log('   eSewa ID: 9806800001/2/3/4/5');
console.log('   Password: Nepal@123');
console.log('   MPIN: 1122');
console.log('   Token: 123456');
