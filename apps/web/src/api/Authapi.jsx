import { apiRequest } from "./Client.jsx";

const USER_KEY = "user";
const TOKEN_KEY = "token";

const persistAuth = ({ user, token }) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const registerApi = async (formData) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData),
  });
};

export const loginApi = async (formData) => {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData),
  });
  persistAuth(data);
  return data;
};

export const meApi = async () => apiRequest("/auth/me");

export const logoutApi = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY));
