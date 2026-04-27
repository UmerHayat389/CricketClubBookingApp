import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';

import Header from '../../components/common/Header';
import SlotCard from '../../components/common/SlotCard';

const slots = [
  { id: '1', time: '07:00 AM - 09:00 AM', price: 800 },
  { id: '2', time: '09:00 AM - 11:00 AM', price: 800 },
];

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Header title="Book Cricket Slot" />

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SlotCard
            slot={item}
            onBook={() =>
              navigation.navigate('BookSlot', { slot: item })
            }
          />
        )}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  list: {
    padding: 16,
  },
});