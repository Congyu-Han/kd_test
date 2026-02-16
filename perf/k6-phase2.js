import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const res = http.get(`${baseUrl}/api/v1/companies?page=1&pageSize=20`);
  check(res, {
    'status is 200': (r) => r.status === 200
  });
}
