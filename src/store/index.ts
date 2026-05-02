import { configureStore, combineReducers } from '@reduxjs/toolkit';

import bookingReducer from './slices/bookingSlice';
import eventReducer from './slices/eventSlice';
import employeeReducer from './slices/employeeSlice';
import authReducer from './slices/authSlice';

const appReducer = combineReducers({
  booking: bookingReducer,
  event: eventReducer,
  employee: employeeReducer,
  auth: authReducer,
});

// Root reducer: when userLogout fires, wipe ALL slice state back to initialState
const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/userLogout') {
    state = undefined; // forces every slice to return its own initialState
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;