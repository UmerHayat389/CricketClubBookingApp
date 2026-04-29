import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

export const loginAdmin = async (email: string, password: string) => {
  const res = await API.post('/auth/login', { email, password });

  if (res.data.token) {
    await AsyncStorage.setItem('adminToken', res.data.token);
  }

  return res.data;
};

export const logoutAdmin = async () => {
  await AsyncStorage.removeItem('adminToken');
};