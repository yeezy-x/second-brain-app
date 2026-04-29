import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    mixed_load: {
      executor: "constant-vus",
      vus: 100,
      duration: "30s",
    },
  },
};

const BASE_URL = "http://localhost:3000/api/v1/content"; 
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjA0YjIxZDE4NmUzMjY0MjdjODBjYyIsImlhdCI6MTc3NzQ4Nzg4MiwiZXhwIjoxNzc3NDg4NzgyfQ._fXNUNGG5xzhLJQZ7vVfivIlgd4PWSgO7t4xB71jc4w"; 

function getRequest() {
  return http.get(`${BASE_URL}?limit=10`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });
}

function postRequest() {
  const payload = JSON.stringify({
    type: "link",
    title: "load-test-" + Math.random(),
    url: "https://example.com/" + Math.random(),
    tags: ["test"],
  });

  return http.post(BASE_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });
}

export default function () {
  if (Math.random() < 0.8) {
    const res = getRequest();
    check(res, { "GET status 200": (r) => r.status === 200 });
  } else {
    const res = postRequest();
    check(res, { "POST status 201": (r) => r.status === 201 });
  }

  sleep(0.5);
}