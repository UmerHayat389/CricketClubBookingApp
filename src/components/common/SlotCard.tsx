import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const SlotCard = ({ slot, onBook }: any) => {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.time}>{slot.time}</Text>
        <Text style={styles.price}>₹{slot.price}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onBook}>
        <Text style={styles.buttonText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SlotCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  price: {
    marginTop: 4,
    color: '#777',
  },
  button: {
    backgroundColor: '#0A8F3C',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});