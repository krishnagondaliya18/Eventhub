import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const failureRate = new Rate('failed_requests');
export const healthDuration = new Trend('health_duration', true);
export const eventsListDuration = new Trend('events_list_duration', true);
export const eventDetailsDuration = new Trend('event_details_duration', true);
export const authLoginDuration = new Trend('auth_login_duration', true);

// Configuration & Stages (Gradual ramp-up from 1 to 10 Virtual Users)
export const options = {
  stages: [
    { duration: '20s', target: 1 },   // Stage 1: Smoke test (1 VU)
    { duration: '30s', target: 5 },   // Stage 2: Initial load ramp (5 VUs)
    { duration: '1m',  target: 10 },  // Stage 3: Steady moderate load (10 VUs)
    { duration: '20s', target: 0 }    // Stage 4: Graceful cooldown (0 VUs)
  ],
  thresholds: {
    // Quality & Stability Gates
    'http_req_failed': ['rate<0.01'],             // Less than 1% failed HTTP requests
    'http_req_duration': ['p(95)<500', 'avg<300'], // 95% of requests under 500ms, avg under 300ms
    'failed_requests': ['rate<0.02'],              // Custom failure check rate under 2%
    'health_duration': ['p(95)<200'],              // Health endpoint must respond ultra-fast
    'events_list_duration': ['p(95)<400']          // Event catalogue queries under 400ms
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const HEADERS_JSON = { 'Content-Type': 'application/json' };

export default function () {
  // ----------------------------------------------------
  // Scenario A: Health Check
  // ----------------------------------------------------
  group('Scenario A: Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`, { tags: { name: 'HealthCheck' } });
    healthDuration.add(res.timings.duration);

    const ok = check(res, {
      'health status is 200': (r) => r.status === 200,
      'health payload matches': (r) => {
        try {
          return JSON.parse(r.body).status.includes('EventHub API running');
        } catch {
          return false;
        }
      }
    });
    failureRate.add(!ok);
  });

  sleep(0.5);

  // ----------------------------------------------------
  // Scenario B: Event Listing & Search Filters
  // ----------------------------------------------------
  let sampledEventId = null;

  group('Scenario B: Event Listing', () => {
    const res = http.get(`${BASE_URL}/api/events?page=1&limit=10`, { tags: { name: 'ListEvents' } });
    eventsListDuration.add(res.timings.duration);

    const ok = check(res, {
      'events list status is 200': (r) => r.status === 200,
      'events array returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.success && Array.isArray(body.events)) {
            if (body.events.length > 0) {
              sampledEventId = body.events[0]._id;
            }
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
    });
    failureRate.add(!ok);

    // Filtered query simulation
    const filterRes = http.get(`${BASE_URL}/api/events?category=Sports&budget=under500`, {
      tags: { name: 'FilterEvents' }
    });
    check(filterRes, {
      'filter status is 200': (r) => r.status === 200
    });
  });

  sleep(0.5);

  // ----------------------------------------------------
  // Scenario C: Event Details & Suggestions
  // ----------------------------------------------------
  group('Scenario C: Event Details & Autocomplete', () => {
    // Autocomplete query
    const sugRes = http.get(`${BASE_URL}/api/events/suggestions?q=IPL`, {
      tags: { name: 'Autocomplete' }
    });
    check(sugRes, {
      'suggestions status is 200': (r) => r.status === 200
    });

    // Detail fetch if an event was discovered in Scenario B
    if (sampledEventId) {
      const detailRes = http.get(`${BASE_URL}/api/events/${sampledEventId}`, {
        tags: { name: 'EventDetails' }
      });
      eventDetailsDuration.add(detailRes.timings.duration);

      const ok = check(detailRes, {
        'details status is 200': (r) => r.status === 200,
        'has title and tickets': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success && body.event && body.event.title !== undefined;
          } catch {
            return false;
          }
        }
      });
      failureRate.add(!ok);
    }
  });

  sleep(0.5);

  // ----------------------------------------------------
  // Scenario D: Authentication (Controlled Login Under Load)
  // ----------------------------------------------------
  let authToken = null;

  group('Scenario D: User Login', () => {
    const loginPayload = JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'admin@eventhub.com',
      password: __ENV.TEST_USER_PASSWORD || 'admin123'
    });

    const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: HEADERS_JSON,
      tags: { name: 'Login' }
    });
    authLoginDuration.add(res.timings.duration);

    const ok = check(res, {
      'login status is 200': (r) => r.status === 200,
      'auth token returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.success && body.token) {
            authToken = body.token;
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
    });
    failureRate.add(!ok);
  });

  sleep(0.5);

  // ----------------------------------------------------
  // Scenario E: Booking & Payment Config Under Load
  // ----------------------------------------------------
  group('Scenario E: Booking Config & History', () => {
    // 1. Payment configuration endpoint (safe, read-only)
    const payConfigRes = http.get(`${BASE_URL}/api/bookings/payment-config`, {
      tags: { name: 'PaymentConfig' }
    });
    check(payConfigRes, {
      'payment-config status is 200': (r) => r.status === 200
    });

    // 2. Authenticated user's bookings query (safe read, verifies auth pipeline)
    if (authToken) {
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      const myBookingsRes = http.get(`${BASE_URL}/api/bookings/my`, {
        headers: authHeaders,
        tags: { name: 'MyBookings' }
      });

      const ok = check(myBookingsRes, {
        'my bookings status is 200': (r) => r.status === 200,
        'bookings list returned': (r) => {
          try {
            return JSON.parse(r.body).success === true;
          } catch {
            return false;
          }
        }
      });
      failureRate.add(!ok);
    }
  });

  sleep(1);
}
