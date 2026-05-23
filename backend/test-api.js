/**
 * Quick test to verify backend API endpoints
 * Usage: node test-api.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testEndpoint(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`✓ ${method} ${path}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(data).substring(0, 100));
    return data;
  } catch (error) {
    console.error(`✗ ${method} ${path}`);
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n=== Testing Security Event Platform API ===\n');

  // Test health check
  await testEndpoint('GET', '/health');
  await delay(500);

  // Test collection status
  await testEndpoint('GET', '/admin/collection/status');
  await delay(500);

  // Test admin health
  await testEndpoint('GET', '/admin/health');
  await delay(500);

  // Test events (may be empty initially)
  await testEndpoint('GET', '/events');
  await delay(500);

  // Test events stats
  await testEndpoint('GET', '/events/stats');
  await delay(500);

  console.log('\n=== Tests Complete ===\n');
}

runTests().catch(console.error);
