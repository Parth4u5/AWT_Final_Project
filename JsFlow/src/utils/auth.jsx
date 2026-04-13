import {
    getStoredUser,
    hasToken,
    loginApi,
    logoutApi,
    registerApi,
} from "../api/Authapi.jsx";

export const registerUser = registerApi;
export const loginUser = loginApi;
export const logoutUser = logoutApi;
export const getCurrentUser = getStoredUser;
export const isAuthenticated = hasToken;