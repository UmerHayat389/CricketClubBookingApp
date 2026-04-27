import React, { useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEvents, addEvent } from '../../store/slices/eventSlice';
import { getEvents } from '../../services/eventService';

const EventsScreen = () => {
  const dispatch = useDispatch<any>();
  const events = useSelector((state: RootState) => state.event.events);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEvents();
        dispatch(setEvents(data));
      } catch (err) {
        console.log('Error loading events');
      }
    };

    loadData();

    const handleEvent = (data: any) => {
      dispatch(addEvent(data));
    };

    socket.on('eventCreated', handleEvent);

    return () => {
      socket.off('eventCreated', handleEvent);
    };
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>No events</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', marginTop: 20 },
  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontWeight: '600',
  },
});