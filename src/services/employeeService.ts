import API from './api';

export const getEmployees = async () => {
  const res = await API.get('/employees');
  return res.data;
};

export const createEmployee = async (data: any) => {
  const res = await API.post('/employees', data);
  return res.data;
};