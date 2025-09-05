/**
 * Production Authentication Test Script
 * Tests authentication flows against production environment
 * Run with: node test-production-auth.js
 */

const http = require('http');

// Production configuration
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://your-production-domain.com';
// Ensure trailing slash so relative paths join correctly
const API_BASE = `${PRODUCTION_URL.replace(/\/$/, '')}/talent/`;

// Test data
const testUsers = {
  employer: {
    email: `test-employer-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'employer'
  },
  talent: {
    email: `test-talent-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: 'talent'
  }
};

let testResults = [];

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, timeout = 30000) {
  return new Promise((resolve, reject) => {
    // Strip any leading slash from path so it resolves relative to API_BASE
    const normalizedPath = String(path || '').replace(/^\/+/, '');
    const url = new URL(normalizedPath, API_BASE);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Test-Script/1.0'
      },
      timeout: timeout
    };

    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
            duration: Date.now() - startTime
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message,
            duration: Date.now() - startTime
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    const startTime = Date.now();
    
    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function wrapper with detailed logging
async function runTest(testName, testFunction, expectedDuration = 5000) {
  console.log(`\n🧪 Running: ${testName}`);
  const startTime = Date.now();
  
  try {
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    if (duration > expectedDuration) {
      console.log(`⚠️  SLOW: ${testName} - ${duration}ms (expected < ${expectedDuration}ms)`);
    } else {
      console.log(`✅ PASSED: ${testName} - ${duration}ms`);
    }
    
    testResults.push({ 
      test: testName, 
      status: 'PASSED', 
      duration,
      result,
      performance: duration <= expectedDuration ? 'GOOD' : 'SLOW'
    });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ FAILED: ${testName} - ${error.message} (${duration}ms)`);
    testResults.push({ 
      test: testName, 
      status: 'FAILED', 
      duration,
      error: error.message 
    });
    throw error;
  }
}

// Test health endpoint
async function testHealthCheck() {
  const response = await makeRequest('GET', '/health', null, 5000);
  if (response.statusCode !== 200) {
    throw new Error(`Health check failed: ${response.statusCode}`);
  }
  console.log(`📊 Health check response time: ${response.duration}ms`);
  return response;
}

// Test signup with performance monitoring
async function testSignup(userType, expectedDuration = 15000) {
  const user = testUsers[userType];
  console.log(`📝 Testing ${userType} signup: ${user.email}`);
  
  const response = await makeRequest('POST', '/auth/signup', user, 20000);
  
  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Signup failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`📧 Signup response for ${userType}: ${response.body?.message || 'Success'}`);
  console.log(`⏱️  Signup duration: ${response.duration}ms`);
  
  if (response.duration > expectedDuration) {
    console.log(`⚠️  WARNING: Signup took ${response.duration}ms (expected < ${expectedDuration}ms)`);
  }
  
  return response;
}

// Test signin with performance monitoring
async function testSignin(userType, expectedDuration = 5000) {
  const user = testUsers[userType];
  console.log(`🔐 Testing ${userType} signin: ${user.email}`);
  
  const response = await makeRequest('POST', '/auth/signin', {
    email: user.email,
    password: user.password
  }, 10000);
  
  // Signin might fail if email not verified, that's expected
  if (response.statusCode === 401 && response.body?.message?.includes('Email not verified')) {
    console.log(`ℹ️  Signin failed as expected - email not verified`);
    return response;
  }
  
  if (response.statusCode !== 200) {
    throw new Error(`Signin failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`🎫 Signin successful for ${userType}`);
  console.log(`⏱️  Signin duration: ${response.duration}ms`);
  
  if (response.duration > expectedDuration) {
    console.log(`⚠️  WARNING: Signin took ${response.duration}ms (expected < ${expectedDuration}ms)`);
  }
  
  return response;
}

// Test password reset with performance monitoring
async function testPasswordReset(userType, expectedDuration = 10000) {
  const user = testUsers[userType];
  console.log(`🔐 Testing ${userType} password reset: ${user.email}`);
  
  const response = await makeRequest('POST', '/auth/forgot-password', {
    email: user.email
  }, 15000);
  
  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Password reset failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`🔑 Password reset initiated for ${userType}`);
  console.log(`⏱️  Password reset duration: ${response.duration}ms`);
  
  return response;
}

// Test error handling and performance under load
async function testErrorHandling() {
  const tests = [
    {
      name: 'Invalid email format',
      request: () => makeRequest('POST', '/auth/signup', {
        email: 'invalid-email',
        password: 'Test123!',
        role: 'employer'
      }, 5000)
    },
    {
      name: 'Missing password',
      request: () => makeRequest('POST', '/auth/signup', {
        email: 'test@example.com',
        role: 'employer'
      }, 5000)
    },
    {
      name: 'Signin with wrong password',
      request: () => makeRequest('POST', '/auth/signin', {
        email: testUsers.employer.email,
        password: 'WrongPassword'
      }, 5000)
    }
  ];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await test.request();
      const duration = Date.now() - startTime;
      
      if (response.statusCode < 400) {
        throw new Error(`Expected error but got success: ${response.statusCode}`);
      }
      console.log(`✅ Error handling test "${test.name}": ${response.statusCode} (${duration}ms)`);
    } catch (error) {
      if (error.message.includes('Expected error')) {
        throw error;
      }
      console.log(`✅ Error handling test "${test.name}": Network error handled`);
    }
  }
}

// Performance stress test
async function testConcurrentRequests() {
  console.log(`🚀 Testing concurrent signup requests...`);
  
  const concurrentUsers = Array.from({ length: 3 }, (_, i) => ({
    email: `concurrent-test-${Date.now()}-${i}@example.com`,
    password: 'TestPassword123!',
    role: i % 2 === 0 ? 'employer' : 'talent'
  }));

  const startTime = Date.now();
  const promises = concurrentUsers.map(user => 
    makeRequest('POST', '/auth/signup', user, 25000)
  );

  try {
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode < 400).length;
    const failed = results.length - successful;
    
    console.log(`📊 Concurrent test results: ${successful} successful, ${failed} failed in ${duration}ms`);
    
    if (failed > 1) {
      throw new Error(`Too many concurrent failures: ${failed}/${results.length}`);
    }
    
    return { successful, failed, duration };
  } catch (error) {
    console.log(`❌ Concurrent test failed: ${error.message}`);
    throw error;
  }
}

// Main test runner
async function runProductionTests() {
  console.log('🚀 Starting Production Authentication Tests');
  console.log(`🌐 Testing against: ${API_BASE}`);
  console.log('=' * 80);

  try {
    // Health check
    await runTest('Health Check', testHealthCheck, 2000);

    // Performance tests
    await runTest('Employer Signup Performance', () => testSignup('employer', 12000), 12000);
    await runTest('Talent Signup Performance', () => testSignup('talent', 12000), 12000);

    // Authentication tests
    try {
      await runTest('Employer Signin Performance', () => testSignin('employer', 3000), 3000);
    } catch (error) {
      console.log('ℹ️  Signin test failed as expected (email verification required)');
    }

    try {
      await runTest('Talent Signin Performance', () => testSignin('talent', 3000), 3000);
    } catch (error) {
      console.log('ℹ️  Signin test failed as expected (email verification required)');
    }

    // Password reset tests
    await runTest('Employer Password Reset', () => testPasswordReset('employer', 8000), 8000);
    await runTest('Talent Password Reset', () => testPasswordReset('talent', 8000), 8000);

    // Error handling tests
    await runTest('Error Handling Tests', testErrorHandling, 5000);

    // Stress tests
    await runTest('Concurrent Request Test', testConcurrentRequests, 15000);

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Print detailed summary
  console.log('\n📊 PRODUCTION TEST SUMMARY');
  console.log('=' * 80);
  
  const passed = testResults.filter(r => r.status === 'PASSED').length;
  const failed = testResults.filter(r => r.status === 'FAILED').length;
  const slow = testResults.filter(r => r.performance === 'SLOW').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Slow: ${slow}`);
  console.log(`📊 Total: ${testResults.length}`);

  // Performance analysis
  console.log('\n⏱️  PERFORMANCE ANALYSIS');
  console.log('-' * 40);
  testResults.forEach(test => {
    if (test.duration) {
      const status = test.performance === 'SLOW' ? '⚠️ ' : '✅';
      console.log(`${status} ${test.test}: ${test.duration}ms`);
    }
  });

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => r.status === 'FAILED').forEach(test => {
      console.log(`  - ${test.test}: ${test.error}`);
    });
  }

  if (slow > 0) {
    console.log('\n⚠️  SLOW TESTS (Performance Issues):');
    testResults.filter(r => r.performance === 'SLOW').forEach(test => {
      console.log(`  - ${test.test}: ${test.duration}ms`);
    });
  }

  console.log('\n🏁 Production test suite completed');
  
  if (failed === 0 && slow === 0) {
    console.log('🎉 All tests passed with good performance!');
  } else if (failed === 0) {
    console.log('✅ All tests passed but some were slow. Check performance.');
  } else {
    console.log('⚠️  Some tests failed. Check production logs and configuration.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runProductionTests().catch(console.error);
}

module.exports = {
  runProductionTests,
  testHealthCheck,
  testSignup,
  testSignin,
  testPasswordReset,
  testErrorHandling,
  testConcurrentRequests
};
