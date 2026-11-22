import type { AuthResponse, LoginInput, RegisterInput } from "@jsflow/shared";

import type { AuthUser } from "../types";
import { apiRequest } from "./Client";

const USER_KEY = "user";
const TOKEN_KEY = "token";

const persistAuth = ({ user, token }: Partial<AuthResponse>): void => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const registerApi = async (
  formData: RegisterInput,
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData),
  });
};

export const loginApi = async (formData: LoginInput): Promise<AuthResponse> => {
  const data = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData),
  });
  persistAuth(data);
  return data;
};

export const meApi = async (): Promise<{ user: AuthUser }> =>
  apiRequest<{ user: AuthUser }>("/auth/me");

export const logoutApi = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
};

export const getStoredUser = (): AuthUser | null => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(USER_KEY) || "null",
    );
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const hasToken = (): boolean => Boolean(localStorage.getItem(TOKEN_KEY));
