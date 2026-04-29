import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/user/HomeScreen';
import BookSlotScreen from '../screens/user/BookSlotScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import EventsScreen from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const BookingsStackNav = createNativeStackNavigator();
const BookNowStackNav = createNativeStackNavigator();

const HomeStack = () => (
  <HomeStackNav.Navigator>
    <HomeStackNav.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <HomeStackNav.Screen
      name="BookSlot"
      component={BookSlotScreen}
      options={{ headerShown: false }}
    />
  </HomeStackNav.Navigator>
);

const BookingsStack = () => (
  <BookingsStackNav.Navigator>
    <BookingsStackNav.Screen
      name="BookingsList"
      component={BookingsScreen}
      options={{ headerShown: false }}
    />
    <BookingsStackNav.Screen
      name="BookSlot"
      component={BookSlotScreen}
      options={{ headerShown: false }}
    />
  </BookingsStackNav.Navigator>
);

const BookNowStack = () => (
  <BookNowStackNav.Navigator>
    <BookNowStackNav.Screen
      name="BookSlotFull"
      component={BookSlotScreen}
      options={{ headerShown: false }}
    />
  </BookNowStackNav.Navigator>
);

const BookNowTabButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.fabOuter}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.fab}>
      <Icon name="add" size={32} color="#fff" />
    </View>
  </TouchableOpacity>
);

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
          if (route.name === 'BookNow') return null;

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
      <Tab.Screen name="Bookings" component={BookingsStack} />

      <Tab.Screen
        name="BookNow"
        component={BookNowStack}
        options={{
          tabBarLabel: 'Book Now',
          tabBarLabelStyle: styles.fabTabLabel,
          tabBarButton: (props) => (
            <BookNowTabButton onPress={props.onPress as any} />
          ),
        }}
      />

      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Settings">
        {(props) => <SettingsScreen {...props} openAdminLogin={openAdminLogin} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default UserTabs;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
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
  fabOuter: {
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0A8F3C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#0A8F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0A8F3C',
    marginTop: 44,
  },
});