import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

// ── Admin ─────────────────────────────────────────────────────────────────────
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

// ── User ──────────────────────────────────────────────────────────────────────

/** Register a new user with just their name */
export const registerUser = async (name: string) => {
  const res = await API.post('/user-auth/register', { name });
  // res.data = { _id, name }
  await AsyncStorage.setItem('userName',   res.data.name);
  await AsyncStorage.setItem('userId',     res.data._id);
  return res.data;
};

/** Login an existing user by name */
export const loginUser = async (name: string) => {
  const res = await API.post('/user-auth/login', { name });
  // res.data = { _id, name }
  await AsyncStorage.setItem('userName',   res.data.name);
  await AsyncStorage.setItem('userId',     res.data._id);
  return res.data;
};

/** Restore user session from AsyncStorage on app start */
export const restoreUserSession = async () => {
  const name   = await AsyncStorage.getItem('userName');
  const userId = await AsyncStorage.getItem('userId');
  if (name && userId) return { name, userId };
  return null;
};

/** Clear user session */
export const logoutUser = async () => {
  await AsyncStorage.removeItem('userName');
  await AsyncStorage.removeItem('userId');
};