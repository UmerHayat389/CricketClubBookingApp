import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/user/HomeScreen';
import BookSlotScreen from '../screens/user/BookSlotScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import EventsScreen from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🔥 Stack for Home → BookSlot
const HomeStack = ({ openAdminLogin }: any) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookSlot" component={BookSlotScreen} />
    </Stack.Navigator>
  );
};

const UserTabs = ({ openAdminLogin }: any) => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home">
        {(props) => <HomeStack {...props} />}
      </Tab.Screen>

      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />

      <Tab.Screen name="Settings">
        {(props) => (
          <SettingsScreen {...props} openAdminLogin={openAdminLogin} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default UserTabs;