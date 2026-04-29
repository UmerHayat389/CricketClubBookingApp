import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, Modal,
  Animated, Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { createBooking, getBookedSlots } from '../../services/bookingService';
import {
  setBookedSlots, addBookedSlot, removeBookedSlot, addBooking,
} from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const ALL_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM',
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

const DURATIONS = [
  { label: '1 Hour',    value: 1,   slots: 1 },
  { label: '1.5 Hours', value: 1.5, slots: 2 },
  { label: '2 Hours',   value: 2,   slots: 2 },
  { label: '2.5 Hours', value: 2.5, slots: 3 },
  { label: '3 Hours',   value: 3,   slots: 3 },
];

const PRICE_PER_HOUR = 1200;

const getDays = () => {
  const days = [];
  const dayNames  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dayName:   dayNames[d.getDay()],
      dayNum:    d.getDate(),
      month:     monthNames[d.getMonth()],
      year:      d.getFullYear(),
      full:      d.toISOString().split('T')[0],
      monthName: monthNames[d.getMonth()],
    });
  }
  return days;
};

// ─── Toast ────────────────────────────────────────────────────────
const Toast = ({ visible, message, type }: {
  visible: boolean; message: string; type: 'error' | 'success' | 'info';
}) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const colors: any = {
    error:   { bg: '#FEF2F2', border: '#EF4444', icon: 'close-circle',       iconColor: '#EF4444' },
    success: { bg: '#F0FFF6', border: '#0A8F3C', icon: 'checkmark-circle',   iconColor: '#0A8F3C' },
    info:    { bg: '#FFF7ED', border: '#F59E0B', icon: 'information-circle', iconColor: '#F59E0B' },
  };
  const c = colors[type];

  return (
    <Animated.View style={[
      toastStyles.container,
      { opacity, transform: [{ translateY }], backgroundColor: c.bg, borderLeftColor: c.border },
    ]}>
      <Icon name={c.icon} size={20} color={c.iconColor} />
      <Text style={[toastStyles.text, { color: c.border }]}>{message}</Text>
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderLeftWidth: 4,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, zIndex: 999,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────
const BookSlotScreen = ({ navigation }: any) => {
  const dispatch    = useDispatch();
  const bookedSlots = useSelector((state: RootState) => state.booking.bookedSlots);

  const days = getDays();
  const [selectedDate,     setSelectedDate]     = useState(days[0]);
  const [selectedSlots,    setSelectedSlots]    = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [players, setPlayers] = useState(1);
  const [notes,   setNotes]   = useState('');
  const [image,   setImage]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'error' | 'success' | 'info' });
  const toastTimer = useRef<any>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const totalAmount = Math.round(PRICE_PER_HOUR * selectedDuration.value);

  useEffect(() => {
    loadBooked(selectedDate.full);
    socket.on('slotBooked', ({ date, slotTime }: any) => dispatch(addBookedSlot({ date, slotTime })));
    socket.on('slotFreed',  ({ date, slotTime }: any) => dispatch(removeBookedSlot({ date, slotTime })));
    return () => { socket.off('slotBooked'); socket.off('slotFreed'); };
  }, []);

  useEffect(() => {
    loadBooked(selectedDate.full);
    setSelectedSlots([]);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlots.length > selectedDuration.slots) {
      setSelectedSlots(selectedSlots.slice(0, selectedDuration.slots));
    }
  }, [selectedDuration]);

  const loadBooked = async (date: string) => {
    try {
      const data = await getBookedSlots(date);
      dispatch(setBookedSlots(data));
    } catch (e) {}
  };

  const isSlotBooked = (slot: string) =>
    bookedSlots.some(s => s.slotTime === slot && s.date === selectedDate.full);

  const handleSlotPress = (slot: string) => {
    if (isSlotBooked(slot)) { showToast('This slot is already booked!', 'error'); return; }

    const maxSlots      = selectedDuration.slots;
    const alreadySelected = selectedSlots.includes(slot);

    if (alreadySelected) { setSelectedSlots(selectedSlots.filter(s => s !== slot)); return; }

    if (selectedSlots.length >= maxSlots) {
      showToast(`You can only select ${maxSlots} slot(s) for ${selectedDuration.label}`, 'info');
      return;
    }

    if (selectedSlots.length > 0) {
      const allSorted = [...selectedSlots, slot].sort(
        (a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b),
      );
      const indices = allSorted.map(s => ALL_SLOTS.indexOf(s));
      const isConsecutive = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
      if (!isConsecutive) { showToast('Please select consecutive time slots', 'info'); return; }
    }

    setSelectedSlots([...selectedSlots, slot]);
  };

  const pickImage = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo' });
    if (res.assets && res.assets[0]) setImage(res.assets[0]);
  };

  const handleConfirmBooking = () => {
    if (selectedSlots.length === 0)                          { showToast('Please select a time slot', 'error'); return; }
    if (selectedSlots.length < selectedDuration.slots)       { showToast(`Please select ${selectedDuration.slots} consecutive slots for ${selectedDuration.label}`, 'info'); return; }
    if (!name.trim())                                        { showToast('Please enter your full name', 'error'); return; }
    if (!phone.trim())                                       { showToast('Please enter your phone number', 'error'); return; }
    setPaymentModal(true);
  };

  const submitBooking = async () => {
    if (!image) { showToast('Please upload payment screenshot', 'error'); return; }
    setLoading(true);
    try {
      const sortedSlots = [...selectedSlots].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));
      const formData = new FormData();
      formData.append('userName',        name);
      formData.append('phone',           phone);
      formData.append('slotTime',        sortedSlots.join(' - '));
      formData.append('date',            selectedDate.full);
      formData.append('duration',        String(selectedDuration.value));
      formData.append('numberOfPlayers', String(players));
      formData.append('notes',           notes);
      formData.append('totalAmount',     String(totalAmount));
      formData.append('paymentScreenshot', {
        uri:  image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'payment.jpg',
      } as any);

      const res = await createBooking(formData);
      dispatch(addBooking(res.booking));
      setPaymentModal(false);
      showToast('Booking submitted! Awaiting admin approval.', 'success');
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Booking failed';
      setPaymentModal(false);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedSelected = [...selectedSlots].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b));

  const canGoBack = navigation.canGoBack ? navigation.canGoBack() : false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>Booking</Text>
        <TouchableOpacity
          style={styles.myBookingsBtn}
          onPress={() => navigation.navigate('Bookings')}
        >
          <Icon name="calendar-outline" size={15} color="#0A8F3C" />
          <Text style={styles.myBookingsText}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Ground Card ── */}
        <View style={styles.groundCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400' }}
            style={styles.groundImg}
          />
          <View style={styles.groundInfo}>
            <Text style={styles.groundName}>Green Field Arena</Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={13} color="#888" />
              <Text style={styles.locationText}>Lahore, Punjab</Text>
            </View>
            <View style={styles.tagsWrap}>
              {['Turf', 'Flood Light', 'Parking', 'Changing Room'].map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── 1. Select Date ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Select Date</Text>
            <View style={styles.monthBadge}>
              <Icon name="calendar-outline" size={13} color="#0A8F3C" />
              <Text style={styles.monthText}>{selectedDate.monthName} {selectedDate.year}</Text>
              <Icon name="chevron-down" size={13} color="#0A8F3C" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {days.map(d => {
              const active = selectedDate.full === d.full;
              return (
                <TouchableOpacity
                  key={d.full}
                  style={[styles.dayCard, active && styles.dayCardActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dayName,  active && styles.dayTextActive]}>{d.dayName}</Text>
                  <Text style={[styles.dayNum,   active && styles.dayTextActive]}>{d.dayNum}</Text>
                  <Text style={[styles.dayMonth, active && styles.dayTextActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 2. Select Time Slot ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Time Slot</Text>
          <Text style={styles.sectionHint}>
            Select {selectedDuration.slots} consecutive slot{selectedDuration.slots > 1 ? 's' : ''} for {selectedDuration.label}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ALL_SLOTS.map(slot => {
              const booked   = isSlotBooked(slot);
              const selected = selectedSlots.includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotCard,
                    selected && styles.slotCardSelected,
                    booked   && styles.slotCardBooked,
                  ]}
                  onPress={() => handleSlotPress(slot)}
                  activeOpacity={booked ? 1 : 0.7}
                >
                  <Text style={[styles.slotTime,  selected && styles.slotTimeSelected,  booked && styles.slotTimeBooked]}>
                    {slot}
                  </Text>
                  <Text style={[styles.slotPrice, selected && styles.slotPriceSelected, booked && styles.slotPriceBooked]}>
                    {booked ? 'Booked' : `PKR ${PRICE_PER_HOUR.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selectedSlots.length > 0 && (
            <View style={styles.selectedSlotInfo}>
              <Icon name="time-outline" size={14} color="#0A8F3C" />
              <Text style={styles.selectedSlotText}>Selected: {sortedSelected.join(' → ')}</Text>
            </View>
          )}
        </View>

        {/* ── 3. Duration ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DURATIONS.map(d => {
              const active = selectedDuration.value === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.durationCard, active && styles.durationCardActive]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>
                    {d.label}
                  </Text>
                  {active && <Icon name="checkmark-circle" size={15} color="#0A8F3C" style={{ marginLeft: 5 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 4. Booking Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Booking Details</Text>

          <View style={styles.fieldRow}>
            <Icon name="person-outline" size={18} color="#AAAAAA" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Full Name"
              placeholderTextColor="#BBBBBB"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.fieldRow}>
            <Icon name="call-outline" size={18} color="#AAAAAA" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Phone Number"
              placeholderTextColor="#BBBBBB"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.fieldRow}>
            <Icon name="people-outline" size={18} color="#AAAAAA" />
            <Text style={styles.fieldLabel}>No. of Players</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setPlayers(p => Math.max(1, p - 1))}
              >
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterVal}>{players}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setPlayers(p => Math.min(22, p + 1))}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Icon name="document-text-outline" size={18} color="#AAAAAA" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Notes (Optional)"
              placeholderTextColor="#BBBBBB"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* ── Payment Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Price (PKR {PRICE_PER_HOUR.toLocaleString()} x {selectedDuration.value} Hour{selectedDuration.value !== 1 ? 's' : ''})
            </Text>
            <Text style={styles.summaryVal}>PKR {totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>PKR {totalAmount.toLocaleString()}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total Amount</Text>
          <Text style={styles.bottomAmount}>PKR {totalAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking}>
          <Icon name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.confirmBtnText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>

      {/* ── Payment Modal ── */}
      <Modal visible={paymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Make Payment</Text>
            <Text style={styles.modalSubtitle}>
              Transfer{' '}
              <Text style={{ color: '#0A8F3C', fontWeight: '800' }}>
                PKR {totalAmount.toLocaleString()}
              </Text>
              {' '}to the account below and upload receipt
            </Text>

            <View style={styles.accountBox}>
              <Text style={styles.accountTitle}>Payment Details</Text>
              {[
                { k: 'Account Title', v: 'Cricket Club' },
                { k: 'Bank',          v: 'HBL' },
                { k: 'Account No.',   v: '1234-5678-9012' },
              ].map(row => (
                <View key={row.k} style={styles.accountRow}>
                  <Text style={styles.accountKey}>{row.k}</Text>
                  <Text style={styles.accountVal}>{row.v}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Icon name="cloud-upload-outline" size={22} color="#0A8F3C" />
              <Text style={styles.uploadBtnText}>
                {image ? '✓ Screenshot Selected' : 'Upload Payment Screenshot'}
              </Text>
            </TouchableOpacity>

            {image && (
              <Image source={{ uri: image.uri }} style={styles.previewImg} resizeMode="cover" />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={submitBooking}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>Submit Booking</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Toast ── */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
};

export default BookSlotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },

  // Header — flush to top, no extra paddingTop on Android
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 8,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#0A8F3C' },
  myBookingsBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FFF6', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8EDD8',
  },
  myBookingsText: { fontSize: 12, color: '#0A8F3C', fontWeight: '600' },

  // Ground Card
  groundCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: 16, borderRadius: 16, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  groundImg:    { width: 100, height: 90, borderRadius: 12 },
  groundInfo:   { flex: 1, marginLeft: 12 },
  groundName:   { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 5 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { fontSize: 12, color: '#888', marginLeft: 3 },
  tagsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:          { backgroundColor: '#F0FFF6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: '#C8EDD8' },
  tagText:      { fontSize: 11, color: '#0A8F3C' },

  // Sections
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 14 },
  sectionHint:   { fontSize: 12, color: '#888', marginTop: -10, marginBottom: 12 },
  monthBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FFF6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  monthText:     { fontSize: 12, color: '#0A8F3C', fontWeight: '600' },

  // Date cards
  dayCard:       { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#EBEBEB', marginRight: 8, minWidth: 66 },
  dayCardActive: { backgroundColor: '#0A8F3C', borderColor: '#0A8F3C' },
  dayName:       { fontSize: 11, color: '#999', marginBottom: 4 },
  dayNum:        { fontSize: 22, fontWeight: '800', color: '#111' },
  dayMonth:      { fontSize: 11, color: '#999', marginTop: 2 },
  dayTextActive: { color: '#fff' },

  // Slot cards
  slotCard:          { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#EBEBEB', marginRight: 8, minWidth: 94 },
  slotCardSelected:  { backgroundColor: '#0A8F3C', borderColor: '#0A8F3C' },
  slotCardBooked:    { backgroundColor: '#FAFAFA', borderColor: '#EEEEEE' },
  slotTime:          { fontSize: 13, fontWeight: '700', color: '#111' },
  slotTimeSelected:  { color: '#fff' },
  slotTimeBooked:    { color: '#CCCCCC' },
  slotPrice:         { fontSize: 11, color: '#0A8F3C', marginTop: 3, fontWeight: '600' },
  slotPriceSelected: { color: 'rgba(255,255,255,0.85)' },
  slotPriceBooked:   { color: '#CCCCCC' },
  selectedSlotInfo:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FFF6', padding: 10, borderRadius: 10, marginTop: 12 },
  selectedSlotText:  { fontSize: 13, color: '#0A8F3C', fontWeight: '600', flex: 1 },

  // Duration cards
  durationCard:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#EBEBEB', marginRight: 8 },
  durationCardActive: { borderColor: '#0A8F3C', backgroundColor: '#F0FFF6' },
  durationText:       { fontSize: 13, color: '#666' },
  durationTextActive: { color: '#0A8F3C', fontWeight: '700' },

  // Fields
  fieldRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  fieldLabel:    { flex: 1, marginLeft: 12, fontSize: 14, color: '#444' },
  fieldInput:    { flex: 1, marginLeft: 12, fontSize: 14, color: '#111', padding: 0 },
  counter:       { flexDirection: 'row', alignItems: 'center' },
  counterBtn:    { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#DDDDDD', alignItems: 'center', justifyContent: 'center' },
  counterBtnText:{ fontSize: 18, color: '#333', lineHeight: 20 },
  counterVal:    { marginHorizontal: 14, fontSize: 16, fontWeight: '700', color: '#111' },

  // Summary
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryLabel:{ fontSize: 13, color: '#888' },
  summaryVal:  { fontSize: 13, color: '#444' },
  divider:     { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  totalLabel:  { fontSize: 15, fontWeight: '700', color: '#111' },
  totalVal:    { fontSize: 18, fontWeight: '900', color: '#0A8F3C' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 12,
  },
  bottomLabel:  { fontSize: 12, color: '#999', marginBottom: 2 },
  bottomAmount: { fontSize: 22, fontWeight: '900', color: '#0A8F3C' },
  confirmBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0A8F3C', paddingHorizontal: 22, paddingVertical: 15, borderRadius: 14 },
  confirmBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  modalSubtitle:{ fontSize: 14, color: '#666', marginBottom: 18, lineHeight: 20 },

  accountBox:   { backgroundColor: '#F8FFFC', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#D4EDE0' },
  accountTitle: { fontSize: 13, fontWeight: '700', color: '#0A8F3C', marginBottom: 10 },
  accountRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  accountKey:   { fontSize: 13, color: '#888' },
  accountVal:   { fontSize: 13, fontWeight: '700', color: '#111' },

  uploadBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#0A8F3C', borderStyle: 'dashed', borderRadius: 14, padding: 16, marginBottom: 14 },
  uploadBtnText: { color: '#0A8F3C', fontWeight: '700', fontSize: 14 },
  previewImg:    { width: '100%', height: 150, borderRadius: 12, marginBottom: 16 },

  modalActions:   { flexDirection: 'row', gap: 12 },
  cancelBtn:      { flex: 1, padding: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelBtnText:  { color: '#666', fontWeight: '700', fontSize: 14 },
  submitBtn:      { flex: 2, padding: 15, borderRadius: 14, backgroundColor: '#0A8F3C', alignItems: 'center' },
  submitBtnText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});