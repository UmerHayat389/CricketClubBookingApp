import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Button,
} from 'react-native';

const BookingCard = ({ item, isAdmin, onApprove, onReject }: any) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.userName}</Text>
      <Text>{item.slotTime}</Text>
      <Text>{item.date}</Text>

      <Text
        style={[
          styles.status,
          item.status === 'approved' && { color: 'green' },
          item.status === 'rejected' && { color: 'red' },
          item.status === 'pending' && { color: 'orange' },
        ]}
      >
        {item.status.toUpperCase()}
      </Text>

      {item.paymentScreenshot && (
        <Image
          source={{
            uri: `http://192.168.100.4:5000/uploads/${item.paymentScreenshot}`,
          }}
          style={styles.image}
        />
      )}

      {isAdmin && item.status === 'pending' && (
        <View style={styles.actions}>
          <Button title="Approve" onPress={onApprove} />
          <Button title="Reject" onPress={onReject} />
        </View>
      )}
    </View>
  );
};

export default BookingCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    marginTop: 6,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});