import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import EmployeesScreen from '../screens/admin/EmployeesScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Bookings" component={AdminBookingsScreen} />
      <Tab.Screen name="Employees" component={EmployeesScreen} />
      <Tab.Screen name="Events" component={AdminEventsScreen} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
};

export default AdminTabs;