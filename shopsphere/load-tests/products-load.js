import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "15s", target: 10 }, // ramp up to 10 users
    { duration: "15s", target: 30 }, // ramp up to 30 users
    { duration: "15s", target: 60 }, // ramp up to 60 users
    { duration: "15s", target: 0 },  // ramp down to 0
  ],
};

export default function () {
  const res = http.get("http://localhost:4000/api/v1/products");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
