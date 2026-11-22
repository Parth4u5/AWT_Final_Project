import type { AdminExample, AdminUser } from "../types";
import { apiRequest } from "./Client";

export const fetchExamplesApi = async (): Promise<AdminExample[]> => {
  const data = await apiRequest<{ examples?: AdminExample[] }>("/examples");
  return data.examples || [];
};

export const createExampleApi = async (payload: {
  title: string;
  code: string;
}): Promise<AdminExample> => {
  const data = await apiRequest<{ example: AdminExample }>("/examples", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.example;
};

export const deleteExampleApi = async (id: string): Promise<void> => {
  await apiRequest(`/examples/${id}`, { method: "DELETE" });
};

export const fetchUsersApi = async (): Promise<AdminUser[]> => {
  const data = await apiRequest<{ users?: AdminUser[] }>("/users");
  return data.users || [];
};

export const deleteUserApi = async (id: string): Promise<void> => {
  await apiRequest(`/users/${id}`, { method: "DELETE" });
};
