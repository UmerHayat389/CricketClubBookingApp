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
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

// ─── Props ────────────────────────────────────────────────────────
// onLogout is passed from AppNavigator to flip isAdmin → false
interface Props {
  onLogout?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────
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
    <Icon name="chevron-forward" size={16} color={danger ? '#FFCDD2' : '#CCCCCC'} />
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

// ─── Main Screen ──────────────────────────────────────────────────
const AdminSettingsScreen = ({ onLogout }: Props) => {
  const dispatch = useDispatch();

  const [bookingAlerts, setBookingAlerts]   = useState(true);
  const [autoApprove, setAutoApprove]       = useState(false);
  const [employeeAlerts, setEmployeeAlerts] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from the admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());   // clear Redux auth state
            onLogout?.();         // flip AppNavigator isAdmin → false
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This would open the change password screen.');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSub}>Admin panel preferences</Text>
          </View>
          <View style={styles.adminBadge}>
            <Icon name="shield-checkmark" size={13} color="#0A8F3C" />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Admin profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="shield" size={28} color="#0A8F3C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Club Administrator</Text>
            <Text style={styles.profileRole}>Full access · All permissions</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleChangePassword}>
            <Icon name="pencil-outline" size={16} color="#0A8F3C" />
          </TouchableOpacity>
        </View>

        {/* Booking Management */}
        <SectionHeader title="Booking Management" />
        <View style={styles.card}>
          <RowArrow
            icon="calendar-outline" iconBg="#0A8F3C"
            label="All Bookings"
            sublabel="View & manage reservations"
            onPress={() => Alert.alert('Bookings', 'Navigate to the Bookings tab.')}
          />
          <View style={styles.divider} />
          <RowToggle
            icon="flash-outline" iconBg="#2E7D32"
            label="Auto-Approve Bookings"
            sublabel="Skip manual approval step"
            value={autoApprove} onChange={setAutoApprove}
          />
          <View style={styles.divider} />
          <RowArrow
            icon="cash-outline" iconBg="#388E3C"
            label="Payment Screenshots"
            sublabel="Review uploaded receipts"
            onPress={() => Alert.alert('Payments', 'Navigate to Bookings tab to review payments.')}
          />
          <View style={styles.divider} />
          <RowValue
            icon="pricetag-outline" iconBg="#43A047"
            label="Current Rate"
            value="PKR 1,200/hr"
          />
        </View>

        {/* Employee Management */}
        <SectionHeader title="Employee Management" />
        <View style={styles.card}>
          <RowArrow
            icon="people-outline" iconBg="#1565C0"
            label="Manage Employees"
            sublabel="Add, edit or remove staff"
            onPress={() => Alert.alert('Employees', 'Navigate to the Employees tab.')}
          />
          <View style={styles.divider} />
          <RowToggle
            icon="notifications-outline" iconBg="#1976D2"
            label="Employee Alerts"
            sublabel="Shift & schedule notifications"
            value={employeeAlerts} onChange={setEmployeeAlerts}
          />
        </View>

        {/* Events */}
        <SectionHeader title="Events" />
        <View style={styles.card}>
          <RowArrow
            icon="trophy-outline" iconBg="#7B1FA2"
            label="Manage Events"
            sublabel="Create & update events"
            onPress={() => Alert.alert('Events', 'Navigate to the Events tab.')}
          />
          <View style={styles.divider} />
          <RowToggle
            icon="megaphone-outline" iconBg="#8E24AA"
            label="Booking Status Alerts"
            sublabel="Notify on new bookings"
            value={bookingAlerts} onChange={setBookingAlerts}
          />
        </View>

        {/* Ground & Club */}
        <SectionHeader title="Ground & Club" />
        <View style={styles.card}>
          <RowArrow
            icon="location-outline" iconBg="#E65100"
            label="Ground Details"
            sublabel="Green Field Arena, Lahore"
            onPress={() => Alert.alert('Ground', 'Green Field Arena\nLahore, Punjab, Pakistan')}
          />
          <View style={styles.divider} />
          <RowArrow
            icon="time-outline" iconBg="#F57C00"
            label="Operating Hours"
            sublabel="6:00 AM – 9:00 PM"
            onPress={() => Alert.alert('Hours', 'Ground operates 6:00 AM to 9:00 PM daily.')}
          />
          <View style={styles.divider} />
          <RowArrow
            icon="construct-outline" iconBg="#FF8F00"
            label="Facilities"
            sublabel="Turf · Flood Light · Parking · Changing Room"
            onPress={() => Alert.alert('Facilities', 'Turf\nFlood Lights\nParking\nChanging Room')}
          />
        </View>

        {/* App & System */}
        <SectionHeader title="App & System" />
        <View style={styles.card}>
          <RowValue
            icon="code-slash-outline" iconBg="#455A64"
            label="Version" value="v1.0.0"
          />
          <View style={styles.divider} />
          <RowArrow
            icon="key-outline" iconBg="#546E7A"
            label="Change Password"
            onPress={handleChangePassword}
          />
          <View style={styles.divider} />
          <RowArrow
            icon="call-outline" iconBg="#607D8B"
            label="Contact Developer"
            sublabel="support@cricketclub.com"
            onPress={() => Linking.openURL('mailto:support@cricketclub.com')}
          />
          <View style={styles.divider} />
          <RowArrow
            icon="document-text-outline" iconBg="#78909C"
            label="Terms & Conditions"
            onPress={() => Alert.alert('Terms', 'Terms & Conditions apply.')}
          />
        </View>

        {/* Logout */}
        <SectionHeader title="Account" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <View style={styles.logoutIcon}>
            <Icon name="log-out-outline" size={22} color="#E53935" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoutLabel}>Logout</Text>
            <Text style={styles.logoutSub}>Return to user mode</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#FFCDD2" />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default AdminSettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    backgroundColor: '#fff',
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8EDD8',
  },
  adminBadgeText: { fontSize: 12, color: '#0A8F3C', fontWeight: '700' },

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
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5EE',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#C8EDD8',
  },

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

  logoutBtn: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    elevation: 1,
    shadowColor: '#E53935',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  logoutIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutLabel: { fontSize: 15, fontWeight: '700', color: '#E53935' },
  logoutSub: { fontSize: 12, color: '#888', marginTop: 1 },
});