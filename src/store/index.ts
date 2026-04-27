import { configureStore } from '@reduxjs/toolkit';

import bookingReducer from './slices/bookingSlice';
import eventReducer from './slices/eventSlice';
import employeeReducer from './slices/employeeSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    event: eventReducer,
    employee: employeeReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;