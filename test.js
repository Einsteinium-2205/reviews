

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

export const requests = new Counter('http_reqs');

export const options = {
  vus: 100,
  duration: '15s',
};

export const randomNum = () => {
  return Math.floor(Math.random() * 100000) + 1 ;
}

// ========== url to test 4 endpoints ============
const url = `http://localhost:8080/reviews?product_id=${randomNum()}`;
const meta = `http://localhost:8080/reviews/meta?product_id=${randomNum()}`;


export default function test() {
  const res = http.get(meta);
  sleep(0.1);
  check(res, {
    'is status 200': (r) => r.status === 200,
    'transaction time < 200ms': (r) => r.timings.duration < 200,
    'transaction time < 500ms': (r) => r.timings.duration < 500,
    'transaction time < 1000ms': (r) => r.timings.duration < 1000,
    'transaction time < 2000ms': (r) => r.timings.duration < 2000,
    'transaction time < 5000ms': (r) => r.timings.duration < 5000,
    'transaction time < 10s': (r) => r.timings.duration < 10000,
    'transaction time < 20s': (r) => r.timings.duration < 20000,
  });
}