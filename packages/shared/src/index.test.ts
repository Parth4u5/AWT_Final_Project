import { describe, expect, it } from "vitest";

import { errorEnvelopeSchema, loginSchema, registerSchema } from "./index";

describe("shared contracts", () => {
  it("accepts the current register payload", () => {
    expect(
      registerSchema.safeParse({
        name: "A",
        email: "a@b.c",
        password: "123456",
      }).success,
    ).toBe(true);
  });

  it("rejects a password shorter than the legacy minimum of 6", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.c", password: "12345" }).success,
    ).toBe(false);
  });

  it("describes the error envelope the API already returns", () => {
    expect(errorEnvelopeSchema.parse({ message: "Server error" })).toEqual({
      message: "Server error",
    });
  });
});
