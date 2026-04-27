import { createSlice } from '@reduxjs/toolkit';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
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
  },
});

export const { setEvents, addEvent } = eventSlice.actions;
export default eventSlice.reducer;