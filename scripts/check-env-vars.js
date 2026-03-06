#!/usr/bin/env node

/**
 * Environment Variables Checker
 * 
 * Run this script to verify all required environment variables are set correctly.
 * 
 * Usage:
 *   node scripts/check-env-vars.js
 * 
 * This helps identify missing or incorrect configuration before deployment.
 */

const requiredVars = {
  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': {
    required: true,
    description: 'Supabase project URL',
    example: 'https://xxx.supabase.co',
    checkFormat: (val) => val.startsWith('https://') && val.includes('.supabase.co')
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    required: true,
    description: 'Supabase service role key (for webhooks)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    checkFormat: (val) => val.startsWith('eyJ')
  },
  
  // Stripe Configuration
  'STRIPE_SECRET_KEY': {
    required: true,
    description: 'Stripe secret key',
    example: 'sk_live_... or sk_test_...',
    checkFormat: (val) => val.startsWith('sk_'),
    warning: (val) => val.startsWith('sk_test_') ? 'Using TEST key - change to sk_live_ for production' : null
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: true,
    description: 'Stripe webhook signing secret',
    example: 'whsec_...',
    checkFormat: (val) => val.startsWith('whsec_')
  },
  
  // Email Configuration
  'GOOGLE_EMAIL': {
    required: true,
    description: 'Gmail address for sending receipts',
    example: 'your-email@gmail.com',
    checkFormat: (val) => val.includes('@')
  },
  'GOOGLE_APP_PASSWORD': {
    required: true,
    description: 'Gmail app-specific password',
    example: 'xxxx xxxx xxxx xxxx',
    checkFormat: (val) => val.length >= 16
  },
  
  // Site Configuration
  'NEXT_PUBLIC_APP_URL': {
    required: true,
    description: 'Production site URL (for receipt downloads)',
    example: 'https://your-domain.com',
    checkFormat: (val) => val.startsWith('http'),
    warning: (val) => val.includes('localhost') ? '⚠️  CRITICAL: Using localhost - receipts will fail in production!' : null
  },
  'NEXT_PUBLIC_SITE_URL': {
    required: false,
    description: 'Site URL (fallback)',
    example: 'https://your-domain.com',
    checkFormat: (val) => val.startsWith('http'),
    warning: (val) => val.includes('localhost') ? '⚠️  Using localhost - may cause issues in production' : null
  },
  
  // Payment Mode
  'PAYMENT_MODE': {
    required: true,
    description: 'Payment mode (live or mock)',
    example: 'live',
    checkFormat: (val) => ['live', 'mock'].includes(val),
    warning: (val) => val === 'mock' ? '⚠️  Mock mode enabled - no real payments will be processed' : null
  },
  
  // Security
  'RECEIPT_TOKEN_SECRET': {
    required: true,
    description: 'Secret for signing receipt tokens',
    example: 'random-base64-string',
    checkFormat: (val) => val.length >= 32
  }
};

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;
const missing = [];
const invalid = [];
const warnings = [];

// Check each required variable
for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  
  if (!value) {
    if (config.required) {
      missing.push({ varName, config });
      hasErrors = true;
    }
    continue;
  }
  
  // Check format
  if (config.checkFormat && !config.checkFormat(value)) {
    invalid.push({ varName, config, value: value.substring(0, 20) + '...' });
    hasErrors = true;
    continue;
  }
  
  // Check for warnings
  if (config.warning) {
    const warning = config.warning(value);
    if (warning) {
      warnings.push({ varName, warning });
      hasWarnings = true;
    }
  }
  
  console.log(`✅ ${varName}`);
}

console.log('\n');

// Report missing variables
if (missing.length > 0) {
  console.log('❌ Missing Required Variables:\n');
  missing.forEach(({ varName, config }) => {
    console.log(`  ${varName}`);
    console.log(`    Description: ${config.description}`);
    console.log(`    Example: ${config.example}\n`);
  });
}

// Report invalid variables
if (invalid.length > 0) {
  console.log('❌ Invalid Format:\n');
  invalid.forEach(({ varName, config, value }) => {
    console.log(`  ${varName}`);
    console.log(`    Current: ${value}`);
    console.log(`    Expected: ${config.example}\n`);
  });
}

// Report warnings
if (warnings.length > 0) {
  console.log('⚠️  Warnings:\n');
  warnings.forEach(({ varName, warning }) => {
    console.log(`  ${varName}: ${warning}\n`);
  });
}

// Summary
console.log('═'.repeat(60));
if (!hasErrors && !hasWarnings) {
  console.log('✅ All environment variables are configured correctly!');
  console.log('\nYou can deploy to production safely.');
} else if (!hasErrors && hasWarnings) {
  console.log('⚠️  Configuration has warnings but should work.');
  console.log('\nReview the warnings above before deploying to production.');
} else {
  console.log('❌ Configuration has errors that must be fixed.');
  console.log('\nFix the issues above before deploying to production.');
  process.exit(1);
}
console.log('═'.repeat(60));

// Additional checks
console.log('\n📋 Additional Checks:\n');

// Check if using production Stripe key
if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
  console.log('✅ Using production Stripe key');
} else if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.log('⚠️  Using test Stripe key - switch to sk_live_ for production');
}

// Check payment mode
if (process.env.PAYMENT_MODE === 'live') {
  console.log('✅ Payment mode set to LIVE');
} else {
  console.log('⚠️  Payment mode set to MOCK - no real payments will be processed');
}

// Check site URL
if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
  console.log('❌ CRITICAL: NEXT_PUBLIC_APP_URL uses localhost - receipts will fail!');
  console.log('   Set to your production domain: https://your-domain.com');
} else if (process.env.NEXT_PUBLIC_APP_URL) {
  console.log(`✅ Site URL configured: ${process.env.NEXT_PUBLIC_APP_URL}`);
}

console.log('\n');
