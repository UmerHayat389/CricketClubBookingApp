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
    setShowAdminLogin(true); // go back to Admin Login screen
  };

  return (
    <NavigationContainer>
      {booting ? (
        // Spinner while checking AsyncStorage
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0A8F3C" />
        </View>

      ) : showAdminLogin ? (
        // Admin Login screen — checked first so it works from both
        // UserLoginScreen (not logged in) and UserTabs (logged in)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminLogin">
            {() => (
              <AdminLoginScreen
                onLogin={() => setShowAdminLogin(false)}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>

      ) : isAdmin ? (
        // ✅ isAdmin checked BEFORE !isUserLoggedIn
        // After admin login: isAdmin=true but isUserLoggedIn=false
        // Without this order, !isUserLoggedIn catches first → shows UserLoginScreen (the bug)
        <AdminTabs onLogout={handleAdminLogout} />

      ) : !isUserLoggedIn ? (
        // Not logged in as user — show user login
        <UserLoginScreen
          onLoginSuccess={() => {}}
          onAdminLogin={() => setShowAdminLogin(true)}
        />

      ) : (
        // Logged in as regular user
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