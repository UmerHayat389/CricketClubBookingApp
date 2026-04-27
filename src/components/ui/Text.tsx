import React from 'react';
import { Text, StyleSheet } from 'react-native';

const UIText = ({ children, style }: any) => {
  return <Text style={[styles.text, style]}>{children}</Text>;
};

export default UIText;

const styles = StyleSheet.create({
  text: {
    color: '#222',
    fontSize: 14,
  },
});