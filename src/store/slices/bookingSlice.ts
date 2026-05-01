import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Booking {
  _id: string;
  userName: string;
  phone: string;
  slotTime: string;
  date: string;
  duration: number;
  numberOfPlayers: number;
  notes: string;
  totalAmount: number;
  status: string;
  paymentScreenshot?: string;
  rejectionNote?: string;
}

interface BookingState {
  bookings: Booking[];
  bookedSlots: { slotTime: string; date: string; status: string }[];
}

const initialState: BookingState = {
  bookings: [],
  bookedSlots: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },

    addBooking: (state, action: PayloadAction<Booking>) => {
      const exists = state.bookings.find((b) => b._id === action.payload._id);
      if (!exists) state.bookings.unshift(action.payload);
    },

    updateBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings = state.bookings.map((b) =>
        b._id === action.payload._id ? action.payload : b
      );
    },

    setBookedSlots: (state, action: PayloadAction<any[]>) => {
      state.bookedSlots = action.payload;
    },

    addBookedSlot: (state, action: PayloadAction<{ date: string; slotTime: string }>) => {
      const exists = state.bookedSlots.find(
        (s) => s.slotTime === action.payload.slotTime && s.date === action.payload.date
      );
      if (!exists) state.bookedSlots.push({ ...action.payload, status: 'pending' });
    },

    removeBookedSlot: (state, action: PayloadAction<{ date: string; slotTime: string }>) => {
      state.bookedSlots = state.bookedSlots.filter(
        (s) => !(s.slotTime === action.payload.slotTime && s.date === action.payload.date)
      );
    },
  },
});

export const {
  setBookings,
  addBooking,
  updateBooking,
  setBookedSlots,
  addBookedSlot,
  removeBookedSlot,
} = bookingSlice.actions;

export default bookingSlice.reducer;