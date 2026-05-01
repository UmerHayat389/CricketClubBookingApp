import { createSlice } from '@reduxjs/toolkit';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  entryFee: number;
  banner: string;
}

interface EventState {
  events: Event[];
}

const initialState: EventState = {
  events: [],
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    addEvent: (state, action) => {
      state.events.unshift(action.payload);
    },
    updateEvent: (state, action) => {
      state.events = state.events.map(e =>
        e._id === action.payload._id ? action.payload : e
      );
    },
    deleteEvent: (state, action) => {
      state.events = state.events.filter(e => e._id !== action.payload);
    },
  },
});

export const { setEvents, addEvent, updateEvent, deleteEvent } = eventSlice.actions;
export default eventSlice.reducer;