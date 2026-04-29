import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 200, // reduce for debugging
  duration: "30s",
};

const BASE_URL = "http://localhost:3000/api/v1/content";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjA0YjIxZDE4NmUzMjY0MjdjODBjYyIsImlhdCI6MTc3NzQ4NzYyMSwiZXhwIjoxNzc3NDg4NTIxfQ.PM39riwV5nTZZDbAI71YUwLDSCaktnqiyt9spbUL5RY";

export default function () {
  const res = http.get(`${BASE_URL}?limit=10`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  console.log("STATUS:", res.status);
  console.log("BODY:", res.body);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}