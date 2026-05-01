import API from './api';

export const getEmployees = async () => {
  const res = await API.get('/employees');
  return res.data;
};

// FormData — supports photo upload
export const createEmployee = async (formData: FormData) => {
  const res = await API.post('/employees', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateEmployee = async (id: string, formData: FormData) => {
  const res = await API.put(`/employees/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteEmployee = async (id: string) => {
  const res = await API.delete(`/employees/${id}`);
  return res.data;
};