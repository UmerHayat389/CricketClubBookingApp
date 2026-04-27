import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEvents, addEvent } from '../../store/slices/eventSlice';
import { getEvents, createEvent } from '../../services/eventService';

const AdminEventsScreen = () => {
  const dispatch = useDispatch<any>();
  const events = useSelector((state: RootState) => state.event.events);

  const [title, setTitle] = useState('');

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

  const handleAdd = async () => {
    if (!title) return;

    await createEvent({ title });
    setTitle('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <Button title="Add Event" onPress={handleAdd} />

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.title}</Text>
        )}
      />
    </View>
  );
};

export default AdminEventsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  item: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
  },
});