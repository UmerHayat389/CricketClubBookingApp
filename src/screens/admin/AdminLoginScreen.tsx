import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { loginAdmin } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';

const AdminLoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginAdmin(email, password);
      dispatch(loginSuccess(res.token));
      onLogin();
    } catch (err: any) {
      // Show full error details in Alert for debugging
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      
      Alert.alert(
        'Login Error',
        `Status: ${status}\nMessage: ${msg}`,
      );
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <Text style={styles.subtitle}>Cricket Booking App</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={login}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default AdminLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A8F3C',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 32,
  },
  error: {
    backgroundColor: '#FFE8E8',
    color: '#D00',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    color: '#222',
  },
  button: {
    backgroundColor: '#0A8F3C',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    backgroundColor: '#7BC49A',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});