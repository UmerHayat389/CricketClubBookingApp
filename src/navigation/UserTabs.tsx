import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen     from '../screens/user/HomeScreen';
import BookSlotScreen from '../screens/user/BookSlotScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import EventsScreen   from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

/* ─── Dimensions — match reference exactly ──────────────────────────────── */
const FAB_SIZE   = 54;   // green circle diameter
const FAB_RISE   = 20;   // how far FAB centre sits above bar top edge
const BAR_HEIGHT = 62;   // white bar height (excluding safe area)

/* ─── Stacks ─────────────────────────────────────────────────────────────── */
const Tab              = createBottomTabNavigator();
const HomeStackNav     = createNativeStackNavigator();
const BookingsStackNav = createNativeStackNavigator();
const BookNowStackNav  = createNativeStackNavigator();

const HomeStack = () => (
  <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
    <HomeStackNav.Screen name="HomeMain"  component={HomeScreen}     />
    <HomeStackNav.Screen name="BookSlot"  component={BookSlotScreen} />
  </HomeStackNav.Navigator>
);

const BookingsStack = () => (
  <BookingsStackNav.Navigator screenOptions={{ headerShown: false }}>
    <BookingsStackNav.Screen name="BookingsList" component={BookingsScreen} />
    <BookingsStackNav.Screen name="BookSlot"     component={BookSlotScreen} />
  </BookingsStackNav.Navigator>
);

const BookNowStack = () => (
  <BookNowStackNav.Navigator screenOptions={{ headerShown: false }}>
    <BookNowStackNav.Screen name="BookSlotFull" component={BookSlotScreen} />
  </BookNowStackNav.Navigator>
);

/* ─── Tab definitions — matches reference: Home Bookings [FAB] Events Profile ── */
const TABS = [
  { name: 'Home',     label: 'Home',     active: 'home',          inactive: 'home-outline'      },
  { name: 'Bookings', label: 'Bookings', active: 'calendar',      inactive: 'calendar-outline'  },
  { name: 'BookNow',  label: 'Book Now', active: null,             inactive: null                },
  { name: 'Events',   label: 'Events',   active: 'trophy',        inactive: 'trophy-outline'    },
  { name: 'Settings', label: 'Profile',  active: 'person',        inactive: 'person-outline'    },
];

/* ─── Custom Tab Bar ─────────────────────────────────────────────────────── */
const CustomTabBar = ({ state, navigation }: any) => {
  const insets   = useSafeAreaInsets();
  const safeBot  = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 0);
  const barTotal = BAR_HEIGHT + safeBot;
  // Wrapper must be tall enough so the FAB circle (which rises above the bar) never clips
  const wrapperH = barTotal + FAB_RISE + FAB_SIZE / 2;

  return (
    <View style={[styles.wrapper, { height: wrapperH }]}>
      <View style={[styles.bar, { height: barTotal, paddingBottom: safeBot + 4 }]}>

        {TABS.map((tab, index) => {
          const focused  = state.index === index;
          const isCenter = tab.name === 'BookNow';

          const navigate = () => {
            const route = state.routes[index];
            const ev = navigation.emit({
              type: 'tabPress',
              target: route?.key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) {
              navigation.navigate(route?.name ?? tab.name);
            }
          };

          /* ── Centre FAB ── */
          if (isCenter) {
            // FAB circle top = negative of (FAB_RISE + FAB_SIZE/2) relative to bar top
            const fabTop = -(FAB_RISE + FAB_SIZE / 2);
            return (
              <View key={tab.name} style={styles.fabSlot}>
                <TouchableOpacity
                  onPress={navigate}
                  activeOpacity={0.85}
                  style={[styles.fabCircle, { top: fabTop }]}
                >
                  <Icon name="add" size={30} color="#fff" />
                </TouchableOpacity>
                {/* Label sits in the bar below the FAB — same vertical level as other labels */}
                <Text style={[styles.fabLabel, focused && styles.fabLabelFocused]}>
                  {tab.label}
                </Text>
              </View>
            );
          }

          /* ── Normal tab ── */
          const iconName = focused ? tab.active! : tab.inactive!;
          const color    = focused ? '#0A8F3C' : '#AAAAAA';

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={navigate}
              activeOpacity={0.75}
            >
              {/* Icon — no pill/background, just icon color changes like reference */}
              <Icon name={iconName} size={24} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}

      </View>
    </View>
  );
};

/* ─── UserTabs navigator ─────────────────────────────────────────────────── */
const UserTabs = ({ openAdminLogin }: { openAdminLogin: () => void }) => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={HomeStack}     />
    <Tab.Screen name="Bookings" component={BookingsStack} />
    <Tab.Screen name="BookNow"  component={BookNowStack}  />
    <Tab.Screen name="Events"   component={EventsScreen}  />
    <Tab.Screen name="Settings">
      {(props) => <SettingsScreen {...props} openAdminLogin={openAdminLogin} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default UserTabs;

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({

  // Outer wrapper — tall enough to show FAB above bar, transparent background
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },

  // White bar — always pinned to bottom of wrapper
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    // Center items vertically in bar so icons + labels sit mid-bar
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 18,
    overflow: 'visible',   // REQUIRED — lets FAB render above
  },

  // ── Normal tab ──────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },

  // ── FAB centre slot ──────────────────────────────────────────
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    // Push content down so label aligns with other tab labels
    // The circle is absolutely positioned so it doesn't affect layout
    gap: 3,
    paddingTop: FAB_SIZE * 0.6,
  },

  // Green circle floating above bar
  fabCircle: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0A8F3C',
    alignItems: 'center',
    justifyContent: 'center',
    // White ring border — visible in reference
    borderWidth: 4,
    borderColor: '#FFFFFF',
    // Green shadow
    shadowColor: '#0A8F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 99,
  },

  fabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#AAAAAA',
    lineHeight: 13,
  },
  fabLabelFocused: {
    color: '#0A8F3C',
    fontWeight: '700',
  },
});