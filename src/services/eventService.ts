import API from './api';

export const getEvents = async () => {
  const res = await API.get('/events');
  return res.data;
};

export const createEvent = async (data: FormData) => {
  const res = await API.post('/events', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateEvent = async (id: string, data: FormData) => {
  const res = await API.put(`/events/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteEvent = async (id: string) => {
  const res = await API.delete(`/events/${id}`);
  return res.data;
};

export const toggleFreeEvent = async (id: string, restoreFee: number = 0) => {
  const res = await API.patch(`/events/${id}/toggle-free`, { restoreFee });
  return res.data;
};