import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Modal,
  ScrollView, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import socket from '../../socket/socket';
import { getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const GREEN       = '#0A8F3C';
const GREEN_SOFT  = '#E8F5EE';
const BG          = '#F4F6FA';

// ─── These two constants are the ONLY source of truth for card image size ───
const CARD_IMG_W = 90;
const CARD_IMG_H = 130;

const GROUND_IMG = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400';

type TabType = 'upcoming' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FFF8E7', icon: 'time-outline'             },
  approved:  { label: 'Approved',  color: GREEN,     bg: GREEN_SOFT, icon: 'checkmark-circle-outline' },
  rejected:  { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline'     },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6', icon: 'checkmark-done-outline'   },
};
const getCfg = (st: string) =>
  STATUS_CONFIG[st] ?? { label: st, color: '#888', bg: '#F5F5F5', icon: 'help-circle-outline' };
const shortId = (id: string) => `GF${id.slice(-6).toUpperCase()}`;

/** True when slot + duration has already elapsed */
const isSlotCompleted = (b: any): boolean => {
  try {
    const [timeStr, period] = (b.slotTime as string).split(' ');
    let [h, m] = timeStr.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const start = new Date(`${b.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    const end   = new Date(start.getTime() + (Number(b.duration) || 1) * 3_600_000);
    return Date.now() > end.getTime();
  } catch { return false; }
};

// ── Detail Row ───────────────────────────────────────────────────
const DetailRow = ({
  icon, label, value, valueColor, last,
}: { icon: string; label: string; value: string; valueColor?: string; last?: boolean }) => (
  <View style={[dr.row, !last && dr.border]}>
    <View style={dr.iconWrap}>
      <Icon name={icon} size={15} color={GREEN} />
    </View>
    <Text style={dr.label}>{label}</Text>
    <Text style={[dr.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
  </View>
);
const dr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border:  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EAECF0' },
  iconWrap:{ width: 30, alignItems: 'center' },
  label:   { flex: 1, fontSize: 13, color: '#9CA3AF', marginLeft: 10, fontWeight: '500' },
  value:   { fontSize: 13, color: '#111827', fontWeight: '700', textAlign: 'right', flexShrink: 1, marginLeft: 8 },
});

// ── Main Screen ──────────────────────────────────────────────────
const BookingsScreen = ({ navigation }: any) => {
  const dispatch  = useDispatch();
  const insets    = useSafeAreaInsets();
  const bookings  = useSelector((state: RootState) => state.booking.bookings);
  const userId    = useSelector((state: RootState) => (state as any).auth.userId);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<TabType>('upcoming');
  const [selected,   setSelected]   = useState<any>(null);

  const loadBookings = useCallback(async (showLoader = false) => {
    if (!userId) { setLoading(false); return; }
    if (showLoader) setLoading(true);
    try {
      const data = await getBookings(userId);
      // Only overwrite store if API actually returned bookings.
      // If it returns empty (userId not stored in booking doc on backend),
      // keep whatever is already in Redux (populated via socket).
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setBookings(data));
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [dispatch, userId]);

  // Re-fetch every time this tab gains focus (catches newly created bookings)
  useFocusEffect(
    useCallback(() => {
      loadBookings(true);
    }, [loadBookings])
  );

  useEffect(() => {
    const onAdd = (b: any) => dispatch(addBooking(b));
    const onUpd = (b: any) => dispatch(updateBooking(b));
    socket.on('bookingCreated', onAdd);
    socket.on('bookingUpdated', onUpd);
    return () => { socket.off('bookingCreated', onAdd); socket.off('bookingUpdated', onUpd); };
  }, [dispatch]);

  const tabData: Record<TabType, any[]> = {
    upcoming:  bookings.filter(b => (b.status === 'pending' || b.status === 'approved') && !isSlotCompleted(b)),
    completed: bookings.filter(b => b.status === 'completed' || (b.status === 'approved' && isSlotCompleted(b))),
    cancelled: bookings.filter(b => b.status === 'rejected'),
  };

  const MAX      = 10;
  const filtered = tabData[activeTab].slice(0, MAX);
  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  const TABS: { key: TabType; label: string }[] = [
    { key: 'upcoming',  label: 'Upcoming'  },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // ── Card ─────────────────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const cfg = getCfg(item.status);
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.92} onPress={() => setSelected(item)}>

        {/* LEFT — explicit pixel width + height; image fills exactly this box */}
        <View style={s.cardImgCol}>
          <Image source={{ uri: GROUND_IMG }} style={s.cardImg} resizeMode="cover" />
          <View style={s.imgDim} />
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={9} color={cfg.color} />
            <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* RIGHT — flex column fills remaining width; height constrained by image */}
        <View style={s.cardBody}>
          {/* name + id */}
          <View style={s.cardTopRow}>
            <Text style={s.groundName} numberOfLines={1}>Green Field Arena</Text>
            <View style={s.idPill}>
              <Text style={s.idTiny}>BOOKING ID</Text>
              <Text style={s.idVal}>{shortId(item._id)}</Text>
            </View>
          </View>

          {/* location */}
          <View style={s.locRow}>
            <Icon name="location-outline" size={10} color="#9CA3AF" />
            <Text style={s.locText}>Lahore, Punjab</Text>
          </View>

          {/* chips */}
          <View style={s.chipsRow}>
            <View style={s.chip}>
              <Icon name="calendar-outline" size={10} color={GREEN} />
              <Text style={s.chipText}>{item.date}</Text>
            </View>
            <View style={s.chip}>
              <Icon name="time-outline" size={10} color={GREEN} />
              <Text style={s.chipText}>{item.slotTime}</Text>
            </View>
            <View style={s.chip}>
              <Icon name="hourglass-outline" size={10} color={GREEN} />
              <Text style={s.chipText}>{item.duration} Hr</Text>
            </View>
          </View>

          {/* footer */}
          <View style={s.cardFooter}>
            <Text style={s.amount}>PKR {Number(item.totalAmount).toLocaleString()}</Text>
            <View style={s.viewBtn}>
              <Text style={s.viewBtnText}>View Details</Text>
              <Icon name="chevron-forward" size={11} color={GREEN} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Modal ────────────────────────────────────────────────────
  const renderModal = () => {
    if (!selected) return null;
    const cfg = getCfg(selected.status);
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom + 10, 24) }]}>

            <View style={s.handle} />

            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Booking Details</Text>
              <TouchableOpacity style={s.closeIcon} onPress={() => setSelected(null)}>
                <Icon name="close" size={17} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Icon name={cfg.icon} size={13} color={cfg.color} />
              <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* venue */}
              <View style={s.venueCard}>
                <Image source={{ uri: GROUND_IMG }} style={s.venueThumb} resizeMode="cover" />
                <View style={s.venueInfo}>
                  <Text style={s.venueName}>Green Field Arena</Text>
                  <View style={s.locRow}>
                    <Icon name="location-outline" size={10} color="#9CA3AF" />
                    <Text style={s.locText}>Lahore, Punjab</Text>
                  </View>
                </View>
              </View>

              {/* detail rows — Payment Method removed */}
              <View style={s.detailBox}>
                <DetailRow icon="bookmark-outline"         label="Booking ID"     value={shortId(selected._id)} />
                <DetailRow icon="person-outline"           label="Name"           value={selected.userName ?? '—'} />
                <DetailRow icon="call-outline"             label="Phone"          value={selected.phone ?? '—'} />
                <DetailRow icon="calendar-outline"         label="Date"           value={selected.date ?? '—'} />
                <DetailRow icon="time-outline"             label="Time Slot"      value={selected.slotTime ?? '—'} />
                <DetailRow icon="hourglass-outline"        label="Duration"       value={`${selected.duration} Hour${selected.duration !== 1 ? 's' : ''}`} />
                <DetailRow icon="people-outline"           label="No. of Players" value={String(selected.numberOfPlayers ?? 1)} />
                <DetailRow icon="cash-outline"             label="Amount Paid"    value={`PKR ${Number(selected.totalAmount).toLocaleString()}`} />
                <DetailRow icon="shield-checkmark-outline" label="Payment Status" value="Paid" valueColor={GREEN} last />
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
              <Text style={s.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Root render ──────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={s.headerTitle}>My Bookings</Text>
          <Text style={s.headerSub}>Track and manage your bookings</Text>
        </View>
        <TouchableOpacity style={s.notifBtn}>
          <Icon name="notifications-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          const count  = tabData[t.key].length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
            >
              {active && (
                <Icon name="checkmark-circle" size={12} color={GREEN} style={{ marginRight: 3 }} />
              )}
              <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabBadge, active && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, active && s.tabBadgeTextActive]}>
                    {count > MAX ? `${MAX}+` : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={GREEN} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 150 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={s.listHead}>
                <Text style={s.listHeadText}>
                  {TABS.find(t => t.key === activeTab)?.label} Bookings
                </Text>
                <TouchableOpacity style={s.filterBtn}>
                  <Icon name="filter-outline" size={12} color="#6B7280" />
                  <Text style={s.filterText}>Filter</Text>
                  <Icon name="chevron-down" size={12} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon name="calendar-outline" size={34} color={GREEN} />
              </View>
              <Text style={s.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={s.emptySub}>
                {activeTab === 'upcoming'
                  ? 'Book a slot to get started'
                  : `No ${activeTab} bookings found`}
              </Text>
            </View>
          )}
          renderItem={renderItem}
        />
      )}

      {/* Book Now — pinned above bottom nav */}
      <TouchableOpacity
        style={[s.bookBanner, { bottom: insets.bottom + 70 }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('BookNow')}
      >
        <View style={s.bannerIconWrap}>
          <Icon name="calendar-outline" size={22} color={GREEN} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.bannerTitle}>Ready for another game?</Text>
          <Text style={s.bannerSub}>Book your next slot and enjoy 🏏</Text>
        </View>
        <View style={s.bookNowBtn}>
          <Text style={s.bookNowText}>Book Now</Text>
          <Icon name="chevron-forward" size={13} color="#fff" />
        </View>
      </TouchableOpacity>

      {renderModal()}
    </View>
  );
};

export default BookingsScreen;

// ── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row', gap: 8, backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  tabActive:          { borderColor: GREEN, backgroundColor: GREEN_SOFT },
  tabText:            { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  tabTextActive:      { color: GREEN, fontWeight: '700' },
  tabBadge:           { marginLeft: 4, backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: '#BBF7D0' },
  tabBadgeText:       { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  tabBadgeTextActive: { color: GREEN },

  // List
  listContent:  { padding: 14 },
  listHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  listHeadText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  // ── Card ─────────────────────────────────────────────────────
  // No height set here. Height is driven purely by cardImgCol.
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    marginBottom: 12, flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 10,
  },

  // Image column — explicit W & H in pixels. This defines the card height.
  cardImgCol: {
    width: CARD_IMG_W,
    height: CARD_IMG_H,   // ← drives card height
  },
  cardImg: {
    width: CARD_IMG_W,
    height: CARD_IMG_H,   // same explicit pixels
  },
  imgDim: {
    position: 'absolute', top: 0, left: 0,
    width: CARD_IMG_W, height: CARD_IMG_H,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  badge: {
    position: 'absolute', top: 8, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },

  // Right body — flex fills remaining width; justifyContent spaces out children
  cardBody: {
    flex: 1, padding: 11,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  groundName: { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#111827', marginRight: 6 },
  idPill:     { alignItems: 'flex-end' },
  idTiny:     { fontSize: 7.5, color: '#D1D5DB', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  idVal:      { fontSize: 10, fontWeight: '800', color: '#6B7280' },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 10.5, color: '#9CA3AF' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 7, borderWidth: 1, borderColor: '#D1FAE5',
  },
  chipText: { fontSize: 10, color: '#065F46', fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6',
  },
  amount:  { fontSize: 13.5, fontWeight: '900', color: '#111827' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4',
  },
  viewBtnText: { fontSize: 11, fontWeight: '700', color: GREEN },

  // Empty state
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: '#D1FAE5',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  emptySub:   { fontSize: 12, color: '#9CA3AF' },

  // Book Now banner
  bookBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    elevation: 6, shadowColor: '#000',
    shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  bannerIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#D1FAE5',
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  bannerSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GREEN, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12,
  },
  bookNowText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },

  // ── Modal ────────────────────────────────────────────────────
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.50)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  sheetHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  closeIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16,
  },
  statusPillText: { fontSize: 13, fontWeight: '700' },

  venueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  venueThumb: { width: 68, height: 52, borderRadius: 10 },
  venueInfo:  { flex: 1 },
  venueName:  { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4 },

  detailBox: {
    borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 16, paddingHorizontal: 14,
    backgroundColor: '#fff', marginBottom: 4,
  },

  closeBtn: {
    marginTop: 12, backgroundColor: GREEN,
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});