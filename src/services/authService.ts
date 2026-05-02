import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

// ── Admin ──────────────────────────────────────────────────────────────────
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

// ── User (name-based, no password) ────────────────────────────────────────
// FIX: was '/auth/user/login' — server registers it at '/api/user-auth/login'
export const loginUser = async (name: string) => {
  const res = await API.post('/user-auth/login', { name });
  // Persist session so app restart auto-logs in
  await AsyncStorage.setItem('userId',   res.data._id);
  await AsyncStorage.setItem('userName', res.data.name);
  return res.data; // { _id, name }
};

export const registerUser = async (name: string) => {
  const res = await API.post('/user-auth/register', { name });
  await AsyncStorage.setItem('userId',   res.data._id);
  await AsyncStorage.setItem('userName', res.data.name);
  return res.data; // { _id, name }
};

export const logoutUser = async () => {
  await AsyncStorage.multiRemove(['userId', 'userName']);
};

// Called on app start — restores session if user was previously logged in
export const restoreUserSession = async (): Promise<{ userId: string; name: string } | null> => {
  const userId   = await AsyncStorage.getItem('userId');
  const userName = await AsyncStorage.getItem('userName');
  if (userId && userName) return { userId, name: userName };
  return null;
};