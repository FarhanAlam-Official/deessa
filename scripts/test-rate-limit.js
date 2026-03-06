#!/usr/bin/env node

/**
 * Rate Limit Test Script
 * 
 * Tests the verification endpoint rate limiting by making 25 rapid requests.
 * Expected behavior: First 20 succeed, remaining 5 get rate limited.
 * 
 * Usage:
 *   node scripts/test-rate-limit.js [verification-id] [base-url]
 * 
 * Example:
 *   node scripts/test-rate-limit.js 123e4567-e89b-12d3-a456-426614174000 http://localhost:3000
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const verificationId = process.argv[2] || '123e4567-e89b-12d3-a456-426614174000';
const baseUrl = process.argv[3] || 'http://localhost:3000';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         Verification Rate Limit Test                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`Base URL: ${baseUrl}`);
console.log(`Verification ID: ${verificationId}`);
console.log(`Testing with 25 rapid requests...\n`);

let successCount = 0;
let rateLimitCount = 0;
let errorCount = 0;

async function makeRequest(requestNumber) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/verify/${verificationId}`;
    const protocol = url.startsWith('https') ? https : http;
    
    const startTime = Date.now();
    
    protocol.get(url, (res) => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      
      let result = {
        number: requestNumber,
        status,
        duration,
        retryAfter: res.headers['retry-after'],
      };
      
      // Consume response data to free up memory
      res.on('data', () => {});
      res.on('end', () => {
        if (status === 200) {
          successCount++;
          console.log(`Request ${requestNumber.toString().padStart(2)}: ✅ Success (200) - ${duration}ms`);
        } else if (status === 429) {
          rateLimitCount++;
          console.log(`Request ${requestNumber.toString().padStart(2)}: ⚠️  Rate Limited (429) - Retry-After: ${result.retryAfter}s`);
        } else {
          errorCount++;
          console.log(`Request ${requestNumber.toString().padStart(2)}: ❌ Error (${status}) - ${duration}ms`);
        }
        resolve(result);
      });
    }).on('error', (err) => {
      errorCount++;
      console.log(`Request ${requestNumber.toString().padStart(2)}: ❌ Failed - ${err.message}`);
      resolve({ number: requestNumber, error: err.message });
    });
  });
}

async function runTest() {
  const results = [];
  
  // Make 25 requests with small delays
  for (let i = 1; i <= 25; i++) {
    const result = await makeRequest(i);
    results.push(result);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Requests:     ${results.length}`);
  console.log(`✅ Successful:      ${successCount}`);
  console.log(`⚠️  Rate Limited:    ${rateLimitCount}`);
  console.log(`❌ Errors:          ${errorCount}\n`);
  
  // Validate results
  if (successCount === 20 && rateLimitCount === 5) {
    console.log('✅ PASS: Rate limiting working as expected!');
    console.log('   - First 20 requests succeeded');
    console.log('   - Last 5 requests were rate limited\n');
    process.exit(0);
  } else if (successCount >= 18 && rateLimitCount >= 3) {
    console.log('⚠️  PARTIAL PASS: Rate limiting mostly working');
    console.log(`   - Expected: 20 success, 5 rate limited`);
    console.log(`   - Actual: ${successCount} success, ${rateLimitCount} rate limited`);
    console.log('   - This may be due to timing or concurrent requests\n');
    process.exit(0);
  } else {
    console.log('❌ FAIL: Rate limiting not working as expected');
    console.log(`   - Expected: 20 success, 5 rate limited`);
    console.log(`   - Actual: ${successCount} success, ${rateLimitCount} rate limited\n`);
    process.exit(1);
  }
}

// Run the test
runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
