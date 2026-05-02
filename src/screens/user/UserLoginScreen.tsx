import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, StatusBar,
  ActivityIndicator, KeyboardAvoidingView,
  ScrollView, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { userLoginSuccess } from '../../store/slices/authSlice';
import { loginUser, registerUser } from '../../services/authService';

const GREEN = '#0A8F3C';

interface Props {
  onLoginSuccess: () => void;
}

const UserLoginScreen = ({ onLoginSuccess }: Props) => {
  const dispatch = useDispatch();

  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await loginUser(trimmed)
        : await registerUser(trimmed);

      dispatch(userLoginSuccess({ name: data.name, userId: data._id }));
      onLoginSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isLogin
        ? 'Name not found. Please register first.'
        : 'Could not register. Try a different name.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top illustration / brand ── */}
        <View style={styles.brandWrap}>
          <View style={styles.logoCircle}>
            <Icon name="baseball-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.brandName}>Cricket Club</Text>
          <Text style={styles.brandSub}>Green Field Arena · Lahore</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>

          {/* Mode toggle pills */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
              onPress={() => setMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            {isLogin ? 'Welcome back!' : 'Create account'}
          </Text>
          <Text style={styles.subHeading}>
            {isLogin
              ? 'Enter your name to continue'
              : 'Enter your name to get started'}
          </Text>

          {/* Name input */}
          <Text style={styles.inputLabel}>Your Name</Text>
          <View style={styles.inputWrap}>
            <Icon name="person-outline" size={18} color="#AAA" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Enter Your Name"
              placeholderTextColor="#CCC"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.submitText}>
                    {isLogin ? 'Login' : 'Create Account'}
                  </Text>
                  <Icon name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          {/* Switch mode link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already registered? '}
            </Text>
            <TouchableOpacity onPress={() => { setMode(isLogin ? 'register' : 'login'); setName(''); }}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Bottom note */}
        <Text style={styles.bottomNote}>
          Your name is used to identify your bookings
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UserLoginScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 24) + 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Brand
  brandWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: GREEN, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
    elevation: 8,
  },
  brandName: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  brandSub:  { fontSize: 13, color: '#AAA', marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 3,
    marginBottom: 22,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 2,
  },
  toggleText:       { fontSize: 13.5, fontWeight: '600', color: '#AAA' },
  toggleTextActive: { color: '#111' },

  // Headings
  heading:    { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 5 },
  subHeading: { fontSize: 13, color: '#AAA', marginBottom: 20 },

  // Input
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: '#555', marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EFEFEF',
    borderRadius: 12, paddingHorizontal: 12,
    backgroundColor: '#FAFAFA', marginBottom: 20,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, height: 48,
    fontSize: 14, color: '#111', fontWeight: '500',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 14, height: 50,
    shadowColor: GREEN, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
    elevation: 5,
    marginBottom: 18,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 13, color: '#AAA' },
  switchLink: { fontSize: 13, fontWeight: '700', color: GREEN },

  // Bottom note
  bottomNote: {
    textAlign: 'center', fontSize: 12, color: '#CCC',
    marginTop: 20,
  },
});