import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Image,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';

import { createBooking } from '../../services/bookingService';

const BookSlotScreen = ({ route }: any) => {
  const { slot } = route.params;

  const [name, setName] = useState('');
  const [image, setImage] = useState<any>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibrary({
      mediaType: 'photo',
    });
    if (res.assets) setImage(res.assets[0]);
  };

  const submit = async () => {
    const formData = new FormData();

    formData.append('userName', name);
    formData.append('slotTime', slot.time);
    formData.append('date', new Date().toISOString());

    if (image) {
      formData.append('paymentScreenshot', {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
      } as any);
    }

    await createBooking(formData);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Button title="Upload Payment" onPress={pickImage} />

      {image && (
        <Image source={{ uri: image.uri }} style={styles.image} />
      )}

      <Button title="Confirm Booking" onPress={submit} />
    </View>
  );
};

export default BookSlotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10 },
  image: { width: 120, height: 120, marginVertical: 10 },
});