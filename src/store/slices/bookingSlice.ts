import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Booking {
  _id: string;
  userName: string;
  slotTime: string;
  date: string;
  status: string;
  paymentScreenshot?: string;
}

interface BookingState {
  bookings: Booking[];
}

const initialState: BookingState = {
  bookings: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },

    addBooking: (state, action: PayloadAction<Booking>) => {
      const exists = state.bookings.find(
        (b) => b._id === action.payload._id
      );
      if (!exists) {
        state.bookings.unshift(action.payload);
      }
    },

    updateBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings = state.bookings.map((b) =>
        b._id === action.payload._id ? action.payload : b
      );
    },
  },
});

export const { setBookings, addBooking, updateBooking } =
  bookingSlice.actions;

export default bookingSlice.reducer;