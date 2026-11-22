export interface ApiError {
  message: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
}

export interface AdminExample {
  _id: string;
  title: string;
  code: string;
  createdBy?: { name: string; email: string } | string;
  createdAt?: string;
}

export interface RemoteExample {
  _id: string;
  title: string;
  code: string;
}
