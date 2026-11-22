import { apiRequest } from "./Client.jsx";

export const fetchExamplesApi = async () => {
  const data = await apiRequest("/examples");
  return data.examples || [];
};

export const createExampleApi = async (payload) => {
  const data = await apiRequest("/examples", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.example;
};

export const deleteExampleApi = async (id) => {
  await apiRequest(`/examples/${id}`, {
    method: "DELETE",
  });
};

export const fetchUsersApi = async () => {
  const data = await apiRequest("/users");
  return data.users || [];
};

export const deleteUserApi = async (id) => {
  await apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
};
