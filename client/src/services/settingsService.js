import api from "./api";

export const getSettings = async () => {
  const response = await api.get("/settings");

  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.patch("/settings", settings);

  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.patch(
    "/settings/password",
    passwordData
  );

  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete("/settings/account");

  return response.data;
};