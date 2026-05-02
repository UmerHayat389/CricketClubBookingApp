import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAdmin:        boolean;
  token:          string | null;
  isUserLoggedIn: boolean;   // ← drives AppNavigator gate
  userName:       string | null;
  userId:         string | null;
}

const initialState: AuthState = {
  isAdmin:        false,
  token:          null,
  isUserLoggedIn: false,
  userName:       null,
  userId:         null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ── Admin ──────────────────────────────────────────────────
    loginSuccess: (state, action: PayloadAction<string>) => {
      state.isAdmin = true;
      state.token   = action.payload;
    },
    adminLogout: (state) => {
      state.isAdmin = false;
      state.token   = null;
    },

    // ── User ───────────────────────────────────────────────────
    userLoginSuccess: (state, action: PayloadAction<{ name: string; userId: string }>) => {
      state.isUserLoggedIn = true;
      state.userName       = action.payload.name;
      state.userId         = action.payload.userId;
    },
    userLogout: (state) => {
      state.isUserLoggedIn = false;
      state.userName       = null;
      state.userId         = null;
    },
  },
});

export const { loginSuccess, adminLogout, userLoginSuccess, userLogout } = authSlice.actions;
export default authSlice.reducer;