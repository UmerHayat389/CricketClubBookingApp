import API from './api';

export const createBooking = async (formData: any) => {
  const res = await API.post('/bookings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getBookings = async () => {
  const res = await API.get('/bookings');
  return res.data;
};

export const getBookedSlots = async (date: string) => {
  const res = await API.get(`/bookings/booked-slots?date=${date}`);
  return res.data;
};

export const approveBooking = async (id: string) => {
  const res = await API.put(`/bookings/approve/${id}`);
  return res.data;
};

export const rejectBooking = async (id: string) => {
  const res = await API.put(`/bookings/reject/${id}`);
  return res.data;
};