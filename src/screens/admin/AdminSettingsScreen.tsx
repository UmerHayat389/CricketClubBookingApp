import React from 'react';
import { View, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const AdminSettingsScreen = () => {
  const dispatch = useDispatch();

  return (
    <View style={{ padding: 20 }}>
      <Button title="Logout" onPress={() => dispatch(logout())} />
    </View>
  );
};

export default AdminSettingsScreen;