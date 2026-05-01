import API from './api';

export const createBooking = async (formData: any) => {
  const res = await API.post('/bookings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Pass a date string (YYYY-MM-DD) to filter by date on the server
export const getBookings = async (date?: string) => {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  const res = await API.get('/bookings', { params });
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

// Accepts an optional rejectionNote string
export const rejectBooking = async (id: string, rejectionNote?: string) => {
  const res = await API.put(`/bookings/reject/${id}`, { rejectionNote: rejectionNote || '' });
  return res.data;
};