import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen     from '../screens/user/HomeScreen';
import BookSlotScreen from '../screens/user/BookSlotScreen';
import BookingsScreen from '../screens/user/BookingsScreen';
import EventsScreen   from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

/* ─── Dimensions ─────────────────────────────────────────────────────────── */
const TAB_HEIGHT   = Platform.OS === 'ios' ? 82 : 64;
const FAB_SIZE     = 56;
const FAB_RADIUS   = FAB_SIZE / 2;
// How many px the circle protrudes above the tab bar top edge
const FAB_PROTRUDE = 18;

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

/* ─── Tab config ─────────────────────────────────────────────────────────── */
const TABS = [
  { name: 'Home',     label: 'Home',     active: 'home',     inactive: 'home-outline'     },
  { name: 'Bookings', label: 'Bookings', active: 'calendar', inactive: 'calendar-outline' },
  { name: 'BookNow',  label: 'Book Now', active: null,        inactive: null               },
  { name: 'Events',   label: 'Events',   active: 'trophy',   inactive: 'trophy-outline'   },
  { name: 'Settings', label: 'Settings', active: 'settings', inactive: 'settings-outline' },
];

/* ─── Custom Tab Bar ─────────────────────────────────────────────────────── */
const CustomTabBar = ({ state, navigation }: any) => {
  return (
    /**
     * Outer wrapper is taller than the visual bar to give the FAB
     * circle room to protrude upward without clipping.
     * overflow: 'visible' is critical on both wrapper and bar.
     */
    <View style={styles.wrapper}>
      {/* White bar surface */}
      <View style={styles.bar}>

        {TABS.map((tab, index) => {
          const focused   = state.index === index;
          const isCenter  = tab.name === 'BookNow';

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

          /* ── Centre FAB slot ── */
          if (isCenter) {
            return (
              <View key={tab.name} style={styles.fabSlot}>
                {/* Circle floats above bar */}
                <TouchableOpacity
                  onPress={navigate}
                  activeOpacity={0.85}
                  style={styles.fabCircle}
                >
                  <Icon name="add" size={32} color="#fff" />
                </TouchableOpacity>
                {/* Label below, inside bar */}
                <Text style={styles.fabLabel}>{tab.label}</Text>
              </View>
            );
          }

          /* ── Normal tab ── */
          const iconName  = focused ? tab.active! : tab.inactive!;
          const color     = focused ? '#0A8F3C' : '#AAAAAA';

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={navigate}
              activeOpacity={0.7}
            >
              <Icon name={iconName} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ─── UserTabs ───────────────────────────────────────────────────────────── */
const UserTabs = ({ openAdminLogin, onLogout }: { openAdminLogin: () => void; onLogout: () => void }) => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={HomeStack}     />
    <Tab.Screen name="Bookings" component={BookingsStack} />
    <Tab.Screen name="BookNow"  component={BookNowStack}  />
    <Tab.Screen name="Events"   component={EventsScreen}  />
    <Tab.Screen name="Settings">
      {(props) => <SettingsScreen {...props} openAdminLogin={openAdminLogin} onLogout={onLogout} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default UserTabs;

/* ─────────────────────────── Styles ─────────────────────────────────────── */
const styles = StyleSheet.create({

  /**
   * Outer wrapper:
   * - sits at the very bottom of the screen, full width, no side margins
   * - height = bar + the protrusion so the FAB circle is never clipped
   * - overflow visible so the circle shadow also shows
   */
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT + FAB_PROTRUDE,
    overflow: 'visible',
    // push bottom-of-bar to screen bottom on iOS (home indicator)
    paddingBottom: 0,
  },

  /**
   * White bar:
   * - positioned at the bottom of wrapper
   * - top border line like the screenshot
   * - NO rounded corners (screenshot shows full-width flat bar)
   */
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    alignItems: 'flex-start',   // items align from bar top so FAB can go above
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 8,
    // shadow upward
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
    overflow: 'visible',
  },

  /* Regular tab */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },

  /**
   * Centre FAB slot:
   * flex:1 like other tabs, but the circle is absolutely positioned
   * so it floats FAB_PROTRUDE px above the bar top.
   */
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    paddingTop: 0,
  },

  /**
   * The green circle:
   * - top: -(FAB_SIZE - FAB_PROTRUDE - 8) pulls it above the bar top edge
   *   so exactly FAB_PROTRUDE px of it sticks out above
   * - position absolute so it doesn't affect bar layout
   */
  fabCircle: {
    position: 'absolute',
    top: -(FAB_PROTRUDE + 2),
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    backgroundColor: '#0A8F3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A8F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 14,
    zIndex: 10,
  },

  /* "Book Now" text label — sits inside the bar below the circle */
  fabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0A8F3C',
    marginTop: FAB_SIZE - FAB_PROTRUDE + 4, // push below the protruding circle
  },
});