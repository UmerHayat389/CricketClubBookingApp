import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const InputField = ({
  value,
  onChangeText,
  placeholder,
}: any) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={styles.input}
    />
  );
};

export default InputField;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
});