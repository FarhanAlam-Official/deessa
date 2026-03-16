// Quick test to verify URL detection logic in different scenarios

function getAppBaseUrl(env) {
  // Priority 1: Explicitly configured app URL
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL
  }
  
  // Priority 2: Explicitly configured site URL
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL
  }
  
  // Priority 3: Vercel deployment URL
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`
  }
  
  // Priority 4: Development fallback
  return 'http://localhost:3000'
}

// Test scenarios
const scenarios = [
  {
    name: '🏠 Local Dev (no env vars)',
    env: {},
    expected: 'http://localhost:3000'
  },
  {
    name: '🏠 Local Dev (with NEXT_PUBLIC_APP_URL)',
    env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
    expected: 'http://localhost:3000'
  },
  {
    name: '🏠 Local Dev (with NEXT_PUBLIC_SITE_URL)',
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
    expected: 'http://localhost:3000'
  },
  {
    name: '☁️ Vercel Preview (auto VERCEL_URL)',
    env: { VERCEL_URL: 'my-app-git-branch-user.vercel.app' },
    expected: 'https://my-app-git-branch-user.vercel.app'
  },
  {
    name: '☁️ Vercel Production (auto VERCEL_URL)',
    env: { VERCEL_URL: 'my-app.vercel.app' },
    expected: 'https://my-app.vercel.app'
  },
  {
    name: '🎯 Custom Domain (NEXT_PUBLIC_APP_URL override)',
    env: { 
      NEXT_PUBLIC_APP_URL: 'https://deessafoundation.org',
      VERCEL_URL: 'my-app.vercel.app'
    },
    expected: 'https://deessafoundation.org'
  },
  {
    name: '🎯 Custom Domain (NEXT_PUBLIC_SITE_URL override)',
    env: { 
      NEXT_PUBLIC_SITE_URL: 'https://deessafoundation.org',
      VERCEL_URL: 'my-app.vercel.app'
    },
    expected: 'https://deessafoundation.org'
  },
  {
    name: '⚡ Priority Test (APP_URL beats SITE_URL)',
    env: { 
      NEXT_PUBLIC_APP_URL: 'https://app-url.com',
      NEXT_PUBLIC_SITE_URL: 'https://site-url.com'
    },
    expected: 'https://app-url.com'
  }
]

console.log('\n🔍 URL Detection Logic Test\n')
console.log('=' .repeat(70))

let passed = 0
let failed = 0

scenarios.forEach((scenario, i) => {
  const result = getAppBaseUrl(scenario.env)
  const success = result === scenario.expected
  
  if (success) {
    passed++
    console.log(`\n✅ Test ${i + 1}: ${scenario.name}`)
  } else {
    failed++
    console.log(`\n❌ Test ${i + 1}: ${scenario.name}`)
  }
  
  console.log(`   Expected: ${scenario.expected}`)
  console.log(`   Got:      ${result}`)
  
  if (Object.keys(scenario.env).length > 0) {
    console.log(`   Env:      ${JSON.stringify(scenario.env)}`)
  }
})

console.log('\n' + '='.repeat(70))
console.log(`\n📊 Results: ${passed}/${scenarios.length} tests passed\n`)

if (failed === 0) {
  console.log('✨ All tests passed! The implementation is correct.\n')
  process.exit(0)
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.\n')
  process.exit(1)
}
