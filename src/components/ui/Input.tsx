import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const UIInput = ({
  value,
  onChangeText,
  placeholder,
  style,
}: any) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={[styles.input, style]}
    />
  );
};

export default UIInput;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
  },
});