import api from "./api";

export const createCheckoutSession = async (appointmentId) => {
  const response = await api.post("/stripe/checkout", {
    appointmentId,
  });

  return response.data;
};