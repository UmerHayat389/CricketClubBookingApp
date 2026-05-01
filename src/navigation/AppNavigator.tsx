import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import UserTabs         from './UserTabs';
import AdminTabs        from './AdminTabs';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import UserLoginScreen  from '../screens/user/UserLoginScreen';

import { restoreUserSession } from '../services/authService';
import { userLoginSuccess }   from '../store/slices/authSlice';
import { RootState }          from '../store';

const Stack = createNativeStackNavigator();

// ─── User flow: Login guard → UserTabs + AdminLogin modal ────────
const UserStack = ({ onAdminLogin }: { onAdminLogin: () => void }) => {
  const dispatch        = useDispatch();
  const isUserLoggedIn  = useSelector((s: RootState) => s.auth.isUserLoggedIn);
  const [checking, setChecking] = useState(true);

  // On mount: restore session from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const session = await restoreUserSession();
        if (session) {
          dispatch(userLoginSuccess({ name: session.name, userId: session.userId }));
        }
      } catch (_) {}
      finally { setChecking(false); }
    })();
  }, []);

  // While checking AsyncStorage show nothing (avoids flash)
  if (checking) return null;

  // Not logged in → show login screen
  if (!isUserLoggedIn) {
    return (
      <UserLoginScreen
        onLoginSuccess={() => {/* Redux state update triggers re-render */}}
      />
    );
  }

  // Logged in → show main tabs + admin login modal
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
        options={{ presentation: 'modal', headerShown: false }}
      >
        {() => <AdminLoginScreen onLogin={onAdminLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// ─── Root navigator ───────────────────────────────────────────────
const AppNavigator = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAdminLogin  = () => setIsAdmin(true);
  const handleAdminLogout = () => setIsAdmin(false);

  return (
    <NavigationContainer>
      {isAdmin ? (
        <AdminTabs onLogout={handleAdminLogout} />
      ) : (
        <UserStack onAdminLogin={handleAdminLogin} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;