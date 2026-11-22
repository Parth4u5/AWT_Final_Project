const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const buildHeaders = (customHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: buildHeaders(options.headers),
    });
  } catch (_error) {
    throw new Error(
      "Cannot connect to backend server. Please check backend deployment and VITE_API_BASE_URL.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: "Unexpected response" };

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
};
