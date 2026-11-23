import { describe, expect, it } from "vitest";

import { assertEnv } from "./env.js";

const valid = () => ({
  JWT_SECRET: "x".repeat(40),
  MONGO_URI: "mongodb://127.0.0.1:27017/jsflow",
  ALLOWED_ORIGINS: "http://localhost:5173",
});

describe("assertEnv", () => {
  it("accepts a valid configuration", () => {
    expect(assertEnv(valid()).ALLOWED_ORIGINS).toEqual([
      "http://localhost:5173",
    ]);
  });

  it("rejects the fallback secret", () => {
    expect(() => assertEnv({ ...valid(), JWT_SECRET: "changeme" })).toThrow(
      "JWT_SECRET is set to the fallback value",
    );
  });

  it("rejects a wildcard origin", () => {
    expect(() => assertEnv({ ...valid(), ALLOWED_ORIGINS: "*" })).toThrow(
      'ALLOWED_ORIGINS must not be "*"',
    );
  });
});
