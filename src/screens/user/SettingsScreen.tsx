import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Linking, Animated, Modal, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoutUser } from '../../services/authService';

interface Props {
  openAdminLogin: () => void;
  onLogout: () => void;
}

// ── Reusable row components (unchanged) ───────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════
const SettingsScreen = ({ openAdminLogin, onLogout }: Props) => {
  const insets   = useSafeAreaInsets();
  const userName = useSelector((state: RootState) => state.auth.userName);

  const [notifications, setNotifications] = useState(true);
  const [bookingAlerts, setBookingAlerts]  = useState(true);
  const [eventAlerts,   setEventAlerts]    = useState(false);

  // ── Custom logout modal state ──────────────────────────────────
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const modalScale = useRef(new Animated.Value(0.88)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const openLogoutModal = () => {
    setLogoutModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeLogoutModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.88, duration: 160, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => setLogoutModalVisible(false));
  };

  // ── Toast ──────────────────────────────────────────────────────
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleLogout = () => {
    openLogoutModal();
  };

  const confirmLogout = async () => {
    closeLogoutModal();
    await logoutUser();
    onLogout();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Manage your preferences</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
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
            onPress={() => Alert.alert('Clear Cache', 'Clear app cache?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => showToast('Cache cleared') },
            ])} />
          <View style={styles.divider} />
          <RowArrow icon="star-outline" iconBg="#FF8F00" label="Rate the App"
            onPress={() => showToast('Thanks for your support! ⭐')} />
          <View style={styles.divider} />
          <RowArrow icon="share-social-outline" iconBg="#F57C00" label="Share App"
            onPress={() => showToast('Share link copied!')} />
        </View>

        {/* ── Account / Logout ── */}
        <SectionHeader title="Account" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.82}>
          <View style={styles.logoutLeft}>
            <View style={styles.logoutIconWrap}>
              <Icon name="log-out-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.logoutLabel}>Log Out</Text>
              <Text style={styles.logoutSub}>Sign out from your account</Text>
            </View>
          </View>
          <View style={styles.logoutArrow}>
            <Icon name="chevron-forward" size={15} color="#E53935" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Custom Logout Confirmation Modal ── */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="none"
        onRequestClose={closeLogoutModal}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={closeLogoutModal}>
          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: modalScale }], opacity: modalOpacity }]}
          >
            <Pressable>
              {/* Icon header */}
              <View style={styles.modalIconWrap}>
                <View style={styles.modalIconRing}>
                  <Icon name="log-out-outline" size={28} color="#E53935" />
                </View>
              </View>

              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalBody}>
                Are you sure you want to log out of your account?
              </Text>

              {/* Divider */}
              <View style={styles.modalDivider} />

              {/* Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeLogoutModal} activeOpacity={0.75}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={confirmLogout} activeOpacity={0.82}>
                  <Icon name="log-out-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Toast ── */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Icon name="checkmark-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

    </View>
  );
};

export default SettingsScreen;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    backgroundColor: '#fff',
    paddingBottom: 18, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: '#999', marginTop: 2 },

  scroll: { paddingTop: 20, paddingHorizontal: 16 },

  profileCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center',
  },
  profileName:     { fontSize: 16, fontWeight: '700', color: '#111' },
  profileRole:     { fontSize: 13, color: '#888', marginTop: 2 },
  memberBadge:     { backgroundColor: '#E8F5EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#C8EDD8' },
  memberBadgeText: { fontSize: 11, color: '#0A8F3C', fontWeight: '700' },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#999',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 24,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    overflow: 'hidden',
  },

  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  iconBox:    { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel:   { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  rowSub:     { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  rowValue:   { fontSize: 13, color: '#666', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 64 },

  // ── Logout button — crisp white card with red accent ──
  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    elevation: 2,
    shadowColor: '#E53935',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  logoutLeft:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoutIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
    shadowColor: '#E53935', shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  logoutLabel:    { fontSize: 15, fontWeight: '800', color: '#E53935' },
  logoutSub:      { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  logoutArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#FFF0F0',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Custom Logout Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    paddingTop: 0,
    paddingBottom: 24,
    paddingHorizontal: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    overflow: 'hidden',
  },
  modalIconWrap: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  modalIconRing: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#FFF0F0',
    borderWidth: 2, borderColor: '#FFCDD2',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#E53935',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Toast
  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1A1A', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 24, elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  toastText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});