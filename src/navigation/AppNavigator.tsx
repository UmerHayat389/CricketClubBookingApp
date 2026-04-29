import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';

const Stack = createNativeStackNavigator();

// ─── User flow: UserTabs + AdminLogin as a modal stack ───────────
const UserStack = ({ onAdminLogin }: { onAdminLogin: () => void }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs">
        {(props) => (
          <UserTabs
            {...props}
            openAdminLogin={() =>
              (props.navigation as any).navigate('AdminLogin')
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AdminLogin"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      >
        {() => <AdminLoginScreen onLogin={onAdminLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// ─── Root navigator ───────────────────────────────────────────────
const AppNavigator = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    // Single NavigationContainer — never conditionally swap it
    <NavigationContainer>
      {isAdmin ? (
        <AdminTabs />
      ) : (
        <UserStack onAdminLogin={() => setIsAdmin(true)} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;