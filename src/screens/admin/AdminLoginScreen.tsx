import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';

import { loginAdmin } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';

const AdminLoginScreen = ({ onLogin }: any) => {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await loginAdmin(email, password);
      dispatch(loginSuccess(res.token));
      onLogin();
    } catch (err) {
      console.log('Login error');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button title="Login" onPress={login} />
    </View>
  );
};

export default AdminLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
});