import API from './api';

export const loginAdmin = async (email: string, password: string) => {
  const res = await API.post('/auth/login', { email, password });
  return res.data;
};