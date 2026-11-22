import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginApi, registerApi } from "./Authapi";

const store = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
};

const jsonResponse = {
  ok: true,
  headers: { get: () => "application/json" },
  json: async () => ({
    message: "ok",
    token: "t",
    user: { id: "1", name: "A", email: "a@b.c", role: "user" },
  }),
};

describe("auth API client", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse));
  });

  it("does not persist auth on register but does on login", async () => {
    await registerApi({ name: "A", email: "a@b.c", password: "123456" });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    await loginApi({ email: "a@b.c", password: "123456" });
    expect(localStorageMock.setItem).toHaveBeenCalledWith("token", "t");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      expect.any(String),
    );
  });
});
