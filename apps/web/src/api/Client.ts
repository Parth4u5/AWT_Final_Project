const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const buildHeaders = (
  customHeaders: Record<string, string> = {},
): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: buildHeaders(options.headers as Record<string, string>),
    });
  } catch {
    throw new Error(
      "Cannot connect to backend server. Please check backend deployment and VITE_API_BASE_URL.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = (
    contentType.includes("application/json")
      ? await response.json()
      : { message: "Unexpected response" }
  ) as T & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
};
