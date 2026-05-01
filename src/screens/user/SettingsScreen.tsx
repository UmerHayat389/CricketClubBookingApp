import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  openAdminLogin: () => void;
}

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const RowArrow = ({
  icon, iconBg, label, sublabel, onPress, danger,
}: {
  icon: string; iconBg: string; label: string;
  sublabel?: string; onPress: () => void; danger?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={18} color="#fff" />
    </View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && { color: '#E53935' }]}>{label}</Text>
      {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
    </View>
    <Icon name="chevron-forward" size={16} color="#CCCCCC" />
  </TouchableOpacity>
);

const RowToggle = ({
  icon, iconBg, label, sublabel, value, onChange,
}: {
  icon: string; iconBg: string; label: string;
  sublabel?: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <View style={styles.row}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={18} color="#fff" />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#E0E0E0', true: '#A8D8BC' }}
      thumbColor={value ? '#0A8F3C' : '#f4f3f4'}
    />
  </View>
);

const RowValue = ({
  icon, iconBg, label, value,
}: {
  icon: string; iconBg: string; label: string; value: string;
}) => (
  <View style={styles.row}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={18} color="#fff" />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const SettingsScreen = ({ openAdminLogin }: Props) => {
  const insets   = useSafeAreaInsets();
  const userName = useSelector((state: RootState) => state.auth.userName);
  const [notifications, setNotifications] = useState(true);
  const [bookingAlerts, setBookingAlerts]   = useState(true);
  const [eventAlerts, setEventAlerts]       = useState(false);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Manage your preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="person" size={32} color="#0A8F3C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{userName ?? 'Guest User'}</Text>
            <Text style={styles.profileRole}>Cricket Club Member</Text>
          </View>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Member</Text>
          </View>
        </View>

        {/* Booking */}
        <SectionHeader title="Booking" />
        <View style={styles.card}>
          <RowArrow icon="calendar-outline" iconBg="#0A8F3C" label="My Bookings"
            sublabel="View all your reservations"
            onPress={() => Alert.alert('My Bookings', 'Go to the Bookings tab to view your reservations.')} />
          <View style={styles.divider} />
          <RowValue icon="cash-outline" iconBg="#2E7D32" label="Price per Hour" value="PKR 1,200" />
          <View style={styles.divider} />
          <RowArrow icon="time-outline" iconBg="#388E3C" label="Available Hours"
            sublabel="6:00 AM – 9:00 PM daily"
            onPress={() => Alert.alert('Hours', 'Ground is open from 6:00 AM to 9:00 PM every day.')} />
          <View style={styles.divider} />
          <RowArrow icon="location-outline" iconBg="#43A047" label="Ground Location"
            sublabel="Green Field Arena, Lahore"
            onPress={() => Alert.alert('Location', 'Green Field Arena\nLahore, Punjab, Pakistan')} />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <RowToggle icon="notifications-outline" iconBg="#1565C0" label="Push Notifications"
            sublabel="Receive app alerts" value={notifications} onChange={setNotifications} />
          <View style={styles.divider} />
          <RowToggle icon="checkmark-circle-outline" iconBg="#1976D2" label="Booking Status Alerts"
            sublabel="Approved / rejected updates" value={bookingAlerts} onChange={setBookingAlerts} />
          <View style={styles.divider} />
          <RowToggle icon="trophy-outline" iconBg="#1E88E5" label="Event Announcements"
            sublabel="New events & tournaments" value={eventAlerts} onChange={setEventAlerts} />
        </View>

        {/* Club Info */}
        <SectionHeader title="Club Info" />
        <View style={styles.card}>
          <RowArrow icon="information-circle-outline" iconBg="#6A1B9A" label="About the Club"
            sublabel="History, facilities & rules"
            onPress={() => Alert.alert('About', 'Green Field Arena — Est. 2010\nTurf · Flood Lights · Parking · Changing Room')} />
          <View style={styles.divider} />
          <RowArrow icon="trophy-outline" iconBg="#7B1FA2" label="Upcoming Events"
            sublabel="Tournaments & matches"
            onPress={() => Alert.alert('Events', 'Go to the Events tab to see upcoming matches.')} />
          <View style={styles.divider} />
          <RowArrow icon="call-outline" iconBg="#8E24AA" label="Contact Support"
            sublabel="support@cricketclub.com"
            onPress={() => Linking.openURL('mailto:support@cricketclub.com')} />
        </View>

        {/* App */}
        <SectionHeader title="App" />
        <View style={styles.card}>
          <RowValue icon="code-slash-outline" iconBg="#455A64" label="Version" value="v1.0.0" />
          <View style={styles.divider} />
          <RowArrow icon="document-text-outline" iconBg="#546E7A" label="Terms & Conditions"
            onPress={() => Alert.alert('Terms', 'Terms & Conditions apply.')} />
          <View style={styles.divider} />
          <RowArrow icon="shield-checkmark-outline" iconBg="#607D8B" label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'We respect your privacy.')} />
          <View style={styles.divider} />
          <RowArrow icon="trash-outline" iconBg="#78909C" label="Clear Cache"
            onPress={() =>
              Alert.alert('Clear Cache', 'Clear app cache?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', 'Cache cleared.') },
              ])
            } />
          <View style={styles.divider} />
          <RowArrow icon="star-outline" iconBg="#FF8F00" label="Rate the App"
            onPress={() => Alert.alert('Rate', 'Thank you for your support!')} />
          <View style={styles.divider} />
          <RowArrow icon="share-social-outline" iconBg="#F57C00" label="Share App"
            onPress={() => Alert.alert('Share', 'Share link copied!')} />
        </View>

        {/* Admin Login */}
        <SectionHeader title="Administration" />
        <TouchableOpacity style={styles.adminBtn} onPress={openAdminLogin} activeOpacity={0.85}>
          <View style={styles.adminBtnIcon}>
            <Icon name="shield-outline" size={22} color="#0A8F3C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.adminBtnLabel}>Admin Login</Text>
            <Text style={styles.adminBtnSub}>Access club management panel</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#0A8F3C" />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    backgroundColor: '#fff',
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },

  scroll: { paddingTop: 20, paddingHorizontal: 16 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E8F5EE',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111' },
  profileRole: { fontSize: 13, color: '#888', marginTop: 2 },
  memberBadge: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#C8EDD8',
  },
  memberBadgeText: { fontSize: 11, color: '#0A8F3C', fontWeight: '700' },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#999',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 14,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  rowSub: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  rowValue: { fontSize: 13, color: '#666', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 64 },

  adminBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#C8EDD8',
    elevation: 1,
    shadowColor: '#0A8F3C',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  adminBtnIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#E8F5EE',
    alignItems: 'center', justifyContent: 'center',
  },
  adminBtnLabel: { fontSize: 15, fontWeight: '700', color: '#0A8F3C' },
  adminBtnSub: { fontSize: 12, color: '#888', marginTop: 1 },
});