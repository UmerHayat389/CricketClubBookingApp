import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer }     from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector }   from 'react-redux';

import UserTabs         from './UserTabs';
import AdminTabs        from './AdminTabs';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import UserLoginScreen  from '../screens/user/UserLoginScreen';

import { restoreUserSession, logoutUser } from '../services/authService';
import { userLoginSuccess, userLogout, adminLogout } from '../store/slices/authSlice';
import { RootState } from '../store';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch       = useDispatch();
  const isUserLoggedIn = useSelector((s: RootState) => s.auth.isUserLoggedIn);
  const isAdmin        = useSelector((s: RootState) => s.auth.isAdmin);
  const userId         = useSelector((s: RootState) => s.auth.userId);

  const [booting,        setBooting]        = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const session = await restoreUserSession();
        if (session) {
          dispatch(userLoginSuccess({ name: session.name, userId: session.userId }));
        }
      } catch (_) {}
      finally { setBooting(false); }
    })();
  }, []);

  const handleUserLogout = async () => {
    await logoutUser();
    dispatch(userLogout());
    dispatch(adminLogout());
    setShowAdminLogin(false);
  };

  const handleAdminLogout = () => {
    dispatch(adminLogout());
  };

  // ── Single NavigationContainer always rendered ───────────────
  return (
    <NavigationContainer>
      {booting ? (
        // Spinner while checking AsyncStorage
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0A8F3C" />
        </View>
      ) : !isUserLoggedIn ? (
        // Not logged in — onLoginSuccess was empty () => {}, fixed below
        <UserLoginScreen onLoginSuccess={() => {}} />
      ) : isAdmin ? (
        // Admin dashboard
        <AdminTabs onLogout={handleAdminLogout} />
      ) : showAdminLogin ? (
        // Admin login modal
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminLogin">
            {() => (
              <AdminLoginScreen
                onLogin={() => setShowAdminLogin(false)}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // key=userId forces full remount of UserTabs when a different user logs in
        // This guarantees all screens are fresh with no stale data from previous user
        <UserTabs
          key={userId}
          openAdminLogin={() => setShowAdminLogin(true)}
          onLogout={handleUserLogout}
        />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;