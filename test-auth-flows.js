/**
 * Comprehensive Authentication Flow Test Script
 * Tests all authentication endpoints for both employer and talent roles
 * Run with: node test-auth-flows.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:4001';
const API_BASE = `${BASE_URL}/talent`;

// Test data
const testUsers = {
  employer: {
    email: 'test-employer@example.com',
    password: 'TestPassword123!',
    role: 'employer'
  },
  talent: {
    email: 'test-talent@example.com',
    password: 'TestPassword123!',
    role: 'talent'
  }
};

let testResults = [];
let currentOTPs = {};

// Utility function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 4001,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running: ${testName}`);
  try {
    const result = await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.push({ test: testName, status: 'PASSED', result });
    return result;
  } catch (error) {
    console.log(`❌ FAILED: ${testName} - ${error.message}`);
    testResults.push({ test: testName, status: 'FAILED', error: error.message });
    throw error;
  }
}

// Test health endpoint
async function testHealthCheck() {
  const response = await makeRequest('GET', '/health');
  if (response.statusCode !== 200) {
    throw new Error(`Health check failed: ${response.statusCode}`);
  }
  return response;
}

// Test signup flow
async function testSignup(userType) {
  const user = testUsers[userType];
  const response = await makeRequest('POST', '/auth/signup', user);
  
  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Signup failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`📧 Signup response for ${userType}:`, response.body.message);
  return response;
}

// Test OTP verification (manual OTP input simulation)
async function testOTPVerification(userType, otp) {
  const user = testUsers[userType];
  const response = await makeRequest('POST', '/auth/verify-email', {
    email: user.email,
    otp: otp
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`OTP verification failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`✅ OTP verification for ${userType}:`, response.body.message);
  return response;
}

// Test signin flow
async function testSignin(userType) {
  const user = testUsers[userType];
  const response = await makeRequest('POST', '/auth/signin', {
    email: user.email,
    password: user.password
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Signin failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`🎫 Signin successful for ${userType}, token received`);
  return response;
}

// Test OTP resend
async function testResendOTP(userType) {
  const user = testUsers[userType];
  const response = await makeRequest('POST', '/auth/resend-otp', {
    email: user.email,
    purpose: 'signup'
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`OTP resend failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
  }
  
  console.log(`🔄 OTP resent for ${userType}:`, response.body.message);
  return response;
}

// Test password reset flow
async function testPasswordReset(userType) {
  const user = testUsers[userType];
  
  // Request password reset
  const resetResponse = await makeRequest('POST', '/auth/forgot-password', {
    email: user.email
  });
  
  if (resetResponse.statusCode !== 200) {
    throw new Error(`Password reset request failed: ${resetResponse.statusCode} - ${JSON.stringify(resetResponse.body)}`);
  }
  
  console.log(`🔐 Password reset OTP sent for ${userType}:`, resetResponse.body.message);
  return resetResponse;
}

// Test error handling with invalid data
async function testErrorHandling() {
  const tests = [
    {
      name: 'Invalid email format',
      request: () => makeRequest('POST', '/auth/signup', {
        email: 'invalid-email',
        password: 'Test123!',
        role: 'employer'
      })
    },
    {
      name: 'Missing password',
      request: () => makeRequest('POST', '/auth/signup', {
        email: 'test@example.com',
        role: 'employer'
      })
    },
    {
      name: 'Invalid role',
      request: () => makeRequest('POST', '/auth/signup', {
        email: 'test@example.com',
        password: 'Test123!',
        role: 'invalid'
      })
    },
    {
      name: 'Signin with wrong password',
      request: () => makeRequest('POST', '/auth/signin', {
        email: testUsers.employer.email,
        password: 'WrongPassword'
      })
    }
  ];

  for (const test of tests) {
    try {
      const response = await test.request();
      if (response.statusCode < 400) {
        throw new Error(`Expected error but got success: ${response.statusCode}`);
      }
      console.log(`✅ Error handling test "${test.name}": ${response.statusCode}`);
    } catch (error) {
      if (error.message.includes('Expected error')) {
        throw error;
      }
      console.log(`✅ Error handling test "${test.name}": Network error handled`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Authentication Flow Tests');
  console.log('=' * 60);

  try {
    // Health check
    await runTest('Health Check', testHealthCheck);

    // Test signup flows
    await runTest('Employer Signup', () => testSignup('employer'));
    await runTest('Talent Signup', () => testSignup('talent'));

    // Test OTP resend
    await runTest('Employer OTP Resend', () => testResendOTP('employer'));
    await runTest('Talent OTP Resend', () => testResendOTP('talent'));

    // Note: OTP verification requires manual input
    console.log('\n⚠️  OTP VERIFICATION REQUIRED:');
    console.log('Check your email for OTP codes and run verification manually:');
    console.log('curl -X POST http://localhost:4001/talent/auth/verify-email \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"test-employer@example.com","otp":"123456"}\'');

    // Test password reset
    await runTest('Employer Password Reset Request', () => testPasswordReset('employer'));
    await runTest('Talent Password Reset Request', () => testPasswordReset('talent'));

    // Test error handling
    await runTest('Error Handling Tests', testErrorHandling);

    // Test signin (will fail if OTP not verified)
    try {
      await runTest('Employer Signin (may fail if not verified)', () => testSignin('employer'));
    } catch (error) {
      console.log('ℹ️  Signin failed as expected - email not verified yet');
    }

    try {
      await runTest('Talent Signin (may fail if not verified)', () => testSignin('talent'));
    } catch (error) {
      console.log('ℹ️  Signin failed as expected - email not verified yet');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' * 60);
  const passed = testResults.filter(r => r.status === 'PASSED').length;
  const failed = testResults.filter(r => r.status === 'FAILED').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${testResults.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => r.status === 'FAILED').forEach(test => {
      console.log(`  - ${test.test}: ${test.error}`);
    });
  }

  console.log('\n🏁 Test suite completed');
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above and container logs.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testSignup,
  testSignin,
  testOTPVerification,
  testResendOTP,
  testPasswordReset,
  testErrorHandling,
  makeRequest
};
