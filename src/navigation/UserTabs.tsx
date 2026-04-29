import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/user/HomeScreen';
import BookSlotScreen from '../screens/user/BookSlotScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import EventsScreen from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="BookSlot" component={BookSlotScreen} />
    </Stack.Navigator>
  );
};

const UserTabs = ({ openAdminLogin }: { openAdminLogin: () => void }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0A8F3C',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Icon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings">
        {(props) => <SettingsScreen {...props} openAdminLogin={openAdminLogin} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapperActive: {
    backgroundColor: '#E8F5EE',
  },
});

export default UserTabs;