import React from 'react';
import { View, Button } from 'react-native';

const SettingsScreen = ({ openAdminLogin }: any) => {
  return (
    <View style={{ padding: 20 }}>
      <Button title="Login as Admin" onPress={openAdminLogin} />
    </View>
  );
};

export default SettingsScreen;