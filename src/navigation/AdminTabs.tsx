import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import AdminBookingsScreen  from '../screens/admin/AdminBookingsScreen';
import AdminHomeScreen      from '../screens/admin/AdminHomeScreen';
import EmployeesScreen      from '../screens/admin/EmployeesScreen';
import AdminEventsScreen    from '../screens/admin/AdminEventsScreen';
import AdminSettingsScreen  from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

const AdminTabs = ({ onLogout }: { onLogout?: () => void }) => {
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
          if (route.name === 'Dashboard')      iconName = focused ? 'grid'     : 'grid-outline';
          else if (route.name === 'Bookings')  iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Employees') iconName = focused ? 'people'   : 'people-outline';
          else if (route.name === 'Events')    iconName = focused ? 'trophy'   : 'trophy-outline';
          else                                 iconName = focused ? 'settings' : 'settings-outline';

          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Icon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
      <Tab.Screen name="Bookings"  component={AdminBookingsScreen} />
      <Tab.Screen name="Employees" component={EmployeesScreen} />
      <Tab.Screen name="Events"    component={AdminEventsScreen} />
      <Tab.Screen name="Settings">
        {() => <AdminSettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default AdminTabs;

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
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  iconWrapper: {
    width: 40, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapperActive: { backgroundColor: '#E8F5EE' },
});