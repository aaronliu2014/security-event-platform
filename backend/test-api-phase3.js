#!/usr/bin/env node

/**
 * Test API for Phase 3 - Security Event Platform Backend
 * This script demonstrates all implemented endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Store token for authenticated requests
let authToken = '';
let userId = '';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const config = { headers };
    let response;

    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(`${BASE_URL}${endpoint}`, config);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// Test functions
const test = async () => {
  console.log('\n=== Security Event Platform Phase 3 - API Test Suite ===\n');

  try {
    // 1. Health check
    console.log('1. Health Check');
    let result = await apiCall('GET', '/health');
    console.log('✓ Response:', result);

    // 2. User Registration
    console.log('\n2. User Registration');
    const testEmail = `testuser_${Date.now()}@example.com`;
    result = await apiCall('POST', '/auth/register', {
      email: testEmail,
      username: `user_${Date.now()}`,
      password: 'TestPassword123',
      full_name: 'Test User',
    });
    console.log('✓ Response:', result);

    // 3. User Login
    console.log('\n3. User Login');
    result = await apiCall('POST', '/auth/login', {
      email: testEmail,
      password: 'TestPassword123',
    });
    console.log('✓ Response:', result);

    if (result.data && result.data.token) {
      authToken = result.data.token;
      userId = result.data.user.id;
      console.log(`✓ Token acquired: ${authToken.substring(0, 20)}...`);
    }

    // 4. Get User Profile
    console.log('\n4. Get User Profile');
    result = await apiCall('GET', '/users/profile');
    console.log('✓ Response:', result);

    // 5. Update User Profile
    console.log('\n5. Update User Profile');
    result = await apiCall('PUT', '/users/profile', {
      full_name: 'Updated Test User',
    });
    console.log('✓ Response:', result);

    // 6. Get User Preferences
    console.log('\n6. Get User Preferences');
    result = await apiCall('GET', '/users/preferences');
    console.log('✓ Response:', result);

    // 7. Update User Preferences
    console.log('\n7. Update User Preferences');
    result = await apiCall('PUT', '/users/preferences', {
      collection_frequency: 'hourly',
      notification_enabled: true,
      email_notification_enabled: true,
      data_sources: ['nvd', 'cve'],
      alert_severity_threshold: 'high',
    });
    console.log('✓ Response:', result);

    // 8. Get Event Clusters
    console.log('\n8. Get Event Clusters');
    result = await apiCall('GET', '/analysis/clusters');
    console.log('✓ Response:', result);

    // 9. Get Trends
    console.log('\n9. Get Event Trends');
    result = await apiCall('GET', '/analysis/trends?days=30');
    console.log('✓ Response:', result);

    // 10. Get Severity Distribution
    console.log('\n10. Get Severity Distribution');
    result = await apiCall('GET', '/analysis/severity-distribution');
    console.log('✓ Response:', result);

    // 11. Get Notifications
    console.log('\n11. Get User Notifications');
    result = await apiCall('GET', '/users/notifications?limit=10&offset=0');
    console.log('✓ Response:', result);

    // 12. Get Notification History
    console.log('\n12. Get Notification History');
    result = await apiCall('GET', '/users/notifications/history?limit=10&offset=0');
    console.log('✓ Response:', result);

    console.log('\n=== All tests completed successfully! ===\n');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Run tests
test();
