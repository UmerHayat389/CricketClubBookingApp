import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';

const AppNavigator = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin && !isAdmin) {
    return <AdminLoginScreen onLogin={() => setIsAdmin(true)} />;
  }

  return (
    <NavigationContainer>
      {isAdmin ? (
        <AdminTabs />
      ) : (
        <UserTabs openAdminLogin={() => setShowLogin(true)} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;