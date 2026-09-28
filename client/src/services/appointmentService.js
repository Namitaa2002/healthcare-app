import api from "./api";

export const createAppointment = async (appointmentData) => {
  const response = await api.post("/appointments", appointmentData);

  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get("/appointments/my");

  return response.data;
};

export const getAvailableSlots = async ({
  providerId,
  serviceId,
  date,
}) => {
  const response = await api.get("/appointments/available-slots", {
    params: {
      providerId,
      serviceId,
      date,
    },
  });

  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await api.patch(
    `/appointments/${appointmentId}/cancel`
  );

  return response.data;
};