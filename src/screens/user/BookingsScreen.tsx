import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { getBookings } from '../../services/bookingService';

import {
  setBookings,
  addBooking,
  updateBooking,
} from '../../store/slices/bookingSlice';

import { RootState } from '../../store';
import BookingCard from '../../components/common/BookingCard';
import Header from '../../components/common/Header';

const BookingsScreen = () => {
  const dispatch = useDispatch<any>();
  const bookings = useSelector(
    (state: RootState) => state.booking.bookings
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getBookings();
        dispatch(setBookings(data));
      } catch (err) {
        console.log('Error loading bookings');
      }
    };

    loadData();

    const handleCreate = (data: any) => {
      dispatch(addBooking(data));
    };

    const handleUpdate = (data: any) => {
      dispatch(updateBooking(data));
    };

    socket.on('bookingCreated', handleCreate);
    socket.on('bookingUpdated', handleUpdate);

    return () => {
      socket.off('bookingCreated', handleCreate);
      socket.off('bookingUpdated', handleUpdate);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header title="My Bookings" />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>No bookings yet</Text>
        )}
        renderItem={({ item }) => (
          <BookingCard item={item} isAdmin={false} />
        )}
      />
    </View>
  );
};

export default BookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});