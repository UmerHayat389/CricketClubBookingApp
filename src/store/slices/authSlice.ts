import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  isAdmin: boolean;
  token: string | null;
}

const initialState: AuthState = {
  isAdmin: false,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAdmin = true;
      state.token = action.payload;
    },
    logout: (state) => {
      state.isAdmin = false;
      state.token = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;