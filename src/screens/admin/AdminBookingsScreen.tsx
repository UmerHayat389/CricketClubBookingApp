import React, { useEffect } from 'react';
import { FlatList, View, Text, Button, StyleSheet } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import API from '../../services/api';

import {
  setBookings,
  addBooking,
  updateBooking,
} from '../../store/slices/bookingSlice';

import { RootState } from '../../store';

const AdminBookingsScreen = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(
    (state: RootState) => state.booking.bookings
  );

  const load = async () => {
    const res = await API.get('/bookings');
    dispatch(setBookings(res.data));
  };

  const approve = async (id: string) => {
    await API.put(`/bookings/approve/${id}`);
  };

  const reject = async (id: string) => {
    await API.put(`/bookings/reject/${id}`);
  };

  useEffect(() => {
    load();

    socket.on('bookingCreated', (b) => dispatch(addBooking(b)));
    socket.on('bookingUpdated', (b) => dispatch(updateBooking(b)));

    return () => {
      socket.off('bookingCreated');
      socket.off('bookingUpdated');
    };
  }, []);

  return (
    <FlatList
      data={bookings}
      keyExtractor={(i) => i._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.userName}</Text>
          <Text>{item.slotTime}</Text>
          <Text>Status: {item.status}</Text>

          {item.status === 'pending' && (
            <View style={styles.row}>
              <Button title="Approve" onPress={() => approve(item._id)} />
              <Button title="Reject" onPress={() => reject(item._id)} />
            </View>
          )}
        </View>
      )}
    />
  );
};

export default AdminBookingsScreen;

const styles = StyleSheet.create({
  card: {
    padding: 15,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  name: { fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});