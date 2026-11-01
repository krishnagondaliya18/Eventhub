import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom Latency Metrics
export const queryLatency = new Trend('events_query_latency', true);
export const autocompleteLatency = new Trend('autocomplete_latency', true);

// Staged Concurrency Profile (Up to 10 VUs for read-heavy catalogue browsing)
export const options = {
  stages: [
    { duration: '15s', target: 2 },  // Warmup with 2 VUs
    { duration: '30s', target: 5 },  // Moderate browsing with 5 VUs
    { duration: '45s', target: 10 }, // Peak browsing load with 10 VUs
    { duration: '15s', target: 0 }   // Cooldown
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'],             // 99% of requests must succeed
    'http_req_duration': ['p(95)<400'],           // 95% below 400ms
    'events_query_latency': ['p(95)<350'],        // Catalogue queries under 350ms
    'autocomplete_latency': ['p(95)<250']         // Autocomplete under 250ms
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const CATEGORIES = ['Music', 'Technology', 'Sports', 'Business', 'Arts'];
const SEARCH_TERMS = ['IPL', 'AI', 'Music', 'Summit', 'Festival', 'Workshop'];

export default function () {
  // 1. Browsing default catalogue
  group('Catalog Browsing', () => {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/api/events?page=${page}&limit=6`, {
      tags: { name: 'CataloguePage' }
    });
    queryLatency.add(res.timings.duration);

    check(res, {
      'page query status is 200': (r) => r.status === 200,
      'has events array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).events);
        } catch {
          return false;
        }
      }
    });
  });

  sleep(0.3);

  // 2. Category filtering
  group('Category Filter', () => {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const res = http.get(`${BASE_URL}/api/events?category=${encodeURIComponent(cat)}`, {
      tags: { name: 'CategoryFilter' }
    });
    queryLatency.add(res.timings.duration);

    check(res, {
      'category query status is 200': (r) => r.status === 200
    });
  });

  sleep(0.3);

  // 3. Autocomplete / Live search typing
  group('Live Search Suggestions', () => {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const res = http.get(`${BASE_URL}/api/events/suggestions?q=${encodeURIComponent(term)}`, {
      tags: { name: 'LiveAutocomplete' }
    });
    autocompleteLatency.add(res.timings.duration);

    check(res, {
      'suggestions status is 200': (r) => r.status === 200,
      'valid suggestions payload': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      }
    });
  });

  sleep(0.5);
}
