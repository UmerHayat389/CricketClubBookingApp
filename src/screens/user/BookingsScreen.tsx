import React, { useEffect, useState, useCallback } from 'react';
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

const GREEN      = '#0A8F3C';
const BG         = '#F6F7FB';
const GROUND_IMG = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400';

type TabType = 'upcoming' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FFF7ED', icon: 'time-outline'             },
  approved:  { label: 'Approved',  color: GREEN,     bg: '#E8F5EE', icon: 'checkmark-circle-outline' },
  rejected:  { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline'     },
  completed: { label: 'Completed', color: '#888',    bg: '#F3F3F3', icon: 'checkmark-done-outline'   },
};
const getCfg = (st: string) =>
  STATUS_CONFIG[st] ?? { label: st, color: '#888', bg: '#F5F5F5', icon: 'help-circle-outline' };
const shortId = (id: string) => `GF${id.slice(-6).toUpperCase()}`;

// ── Detail Row ────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value, valueColor, last }: {
  icon: string; label: string; value: string; valueColor?: string; last?: boolean;
}) => (
  <View style={[dr.row, !last && dr.border]}>
    <View style={dr.iconBox}><Icon name={icon} size={16} color={GREEN} /></View>
    <Text style={dr.label}>{label}</Text>
    <Text style={[dr.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);
const dr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  iconBox:{ width: 28, alignItems: 'center' },
  label:  { flex: 1, fontSize: 13, color: '#999', marginLeft: 10 },
  value:  { fontSize: 13, color: '#111', fontWeight: '700', textAlign: 'right', maxWidth: '55%' },
});

// ── Main Screen ───────────────────────────────────────────────────
const BookingsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();
  const bookings = useSelector((state: RootState) => state.booking.bookings);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<TabType>('upcoming');
  const [selected,   setSelected]   = useState<any>(null);

  const loadBookings = useCallback(async () => {
    try { const data = await getBookings(); dispatch(setBookings(data)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [dispatch]);

  useEffect(() => {
    loadBookings();
    const onAdd = (b: any) => dispatch(addBooking(b));
    const onUpd = (b: any) => dispatch(updateBooking(b));
    socket.on('bookingCreated', onAdd);
    socket.on('bookingUpdated', onUpd);
    return () => { socket.off('bookingCreated', onAdd); socket.off('bookingUpdated', onUpd); };
  }, [loadBookings]);

  const tabData: Record<TabType, any[]> = {
    upcoming:  bookings.filter(b => b.status === 'pending'),
    completed: bookings.filter(b => b.status === 'approved' || b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'rejected'),
  };
  const filtered = tabData[activeTab];
  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  const TABS: { key: TabType; label: string }[] = [
    { key: 'upcoming',  label: 'Upcoming'  },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // ── Card ──────────────────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const cfg = getCfg(item.status);
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.92} onPress={() => setSelected(item)}>
        {/* Left: fixed-size image */}
        <View style={s.cardLeft}>
          <Image source={{ uri: GROUND_IMG }} style={s.cardImg} resizeMode="cover" />
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={10} color={cfg.color} />
            <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Right: info */}
        <View style={s.cardRight}>
          {/* Name + ID */}
          <View style={s.cardTopRow}>
            <Text style={s.groundName} numberOfLines={1}>Green Field Arena</Text>
            <View style={s.idBox}>
              <Text style={s.idLabel}>BOOKING ID</Text>
              <Text style={s.idVal}>{shortId(item._id)}</Text>
            </View>
          </View>

          <View style={s.locRow}>
            <Icon name="location-outline" size={10} color="#BBBBBB" />
            <Text style={s.locText}>Lahore, Punjab</Text>
          </View>

          {/* Chips */}
          <View style={s.chipsRow}>
            <View style={s.chip}>
              <Icon name="calendar-outline" size={11} color={GREEN} />
              <Text style={s.chipText}>{item.date}</Text>
            </View>
            <View style={s.chip}>
              <Icon name="time-outline" size={11} color={GREEN} />
              <Text style={s.chipText}>{item.slotTime}</Text>
            </View>
            <View style={s.chip}>
              <Icon name="hourglass-outline" size={11} color={GREEN} />
              <Text style={s.chipText}>{item.duration} Hr</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={s.cardFooter}>
            <Text style={s.amount}>PKR {Number(item.totalAmount).toLocaleString()}</Text>
            <View style={s.viewBtn}>
              <Text style={s.viewBtnText}>View Details</Text>
              <Icon name="chevron-forward" size={12} color={GREEN} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Modal ─────────────────────────────────────────────────────
  const renderModal = () => {
    if (!selected) return null;
    const cfg = getCfg(selected.status);
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
            <View style={s.handle} />

            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Booking Details</Text>
              <TouchableOpacity style={s.closeIcon} onPress={() => setSelected(null)}>
                <Icon name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Icon name={cfg.icon} size={13} color={cfg.color} />
              <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Ground card */}
              <View style={s.groundCard}>
                <Image source={{ uri: GROUND_IMG }} style={s.groundThumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.groundCardName}>Green Field Arena</Text>
                  <View style={s.locRow}>
                    <Icon name="location-outline" size={10} color="#BBBBBB" />
                    <Text style={s.locText}>Lahore, Punjab</Text>
                  </View>
                </View>
              </View>

              {/* Details */}
              <View style={s.detailsBox}>
                <DetailRow icon="bookmark-outline"          label="Booking ID"     value={shortId(selected._id)} />
                <DetailRow icon="person-outline"            label="Name"           value={selected.userName ?? '—'} />
                <DetailRow icon="call-outline"              label="Phone"          value={selected.phone ?? '—'} />
                <DetailRow icon="calendar-outline"          label="Date"           value={selected.date ?? '—'} />
                <DetailRow icon="time-outline"              label="Time Slot"      value={selected.slotTime ?? '—'} />
                <DetailRow icon="hourglass-outline"         label="Duration"       value={`${selected.duration} Hour${selected.duration !== 1 ? 's' : ''}`} />
                <DetailRow icon="people-outline"            label="No. of Players" value={String(selected.numberOfPlayers ?? 1)} />
                <DetailRow icon="cash-outline"              label="Amount Paid"    value={`PKR ${Number(selected.totalAmount).toLocaleString()}`} />
                <DetailRow icon="card-outline"              label="Payment Method" value="EasyPaisa" />
                <DetailRow icon="shield-checkmark-outline"  label="Payment Status" value="Paid" valueColor={GREEN} last />
              </View>

              <View style={{ height: 12 }} />
            </ScrollView>

            <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
              <Text style={s.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <View>
          <Text style={s.headerTitle}>My Bookings</Text>
          <Text style={s.headerSub}>Track and manage your bookings</Text>
        </View>
        <TouchableOpacity style={s.notifBtn}>
          <Icon name="notifications-outline" size={20} color="#444" />
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
              {active && <Icon name="checkmark-circle" size={12} color={GREEN} style={{ marginRight: 3 }} />}
              <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabBadge, active && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, active && s.tabBadgeTextActive]}>{count}</Text>
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
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={s.listHead}>
                <Text style={s.listHeadText}>
                  {TABS.find(t => t.key === activeTab)?.label} Bookings
                </Text>
                <TouchableOpacity style={s.filterBtn}>
                  <Icon name="filter-outline" size={12} color="#666" />
                  <Text style={s.filterText}>Filter</Text>
                  <Icon name="chevron-down" size={12} color="#666" />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={
            <TouchableOpacity
              style={s.bookBanner}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BookNow')}
            >
              <Icon name="calendar-outline" size={26} color={GREEN} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.bannerTitle}>Ready for another game?</Text>
                <Text style={s.bannerSub}>Book your next slot and enjoy the game 🏏</Text>
              </View>
              <View style={s.bookNowBtn}>
                <Text style={s.bookNowText}>Book Now</Text>
                <Icon name="chevron-forward" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
          }
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon name="calendar-outline" size={36} color={GREEN} />
              </View>
              <Text style={s.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={s.emptySub}>
                {activeTab === 'upcoming' ? 'Book a slot to get started' : `No ${activeTab} bookings found`}
              </Text>
            </View>
          )}
          renderItem={renderItem}
        />
      )}

      {renderModal()}
    </View>
  );
};

export default BookingsScreen;

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: '#BBBBBB', marginTop: 2 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F6F7FB', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
  },

  tabsRow: {
    flexDirection: 'row', gap: 8, backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 22,
    borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA',
  },
  tabActive:          { borderColor: GREEN, backgroundColor: '#F0FFF6' },
  tabText:            { fontSize: 12, color: '#999', fontWeight: '600' },
  tabTextActive:      { color: GREEN, fontWeight: '700' },
  tabBadge:           { marginLeft: 4, backgroundColor: '#EBEBEB', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: '#C8EDD8' },
  tabBadgeText:       { fontSize: 10, color: '#999', fontWeight: '700' },
  tabBadgeTextActive: { color: GREEN },

  listContent: { padding: 14 },
  listHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  listHeadText: { fontSize: 15, fontWeight: '700', color: '#111' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#F5F5F5',
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  filterText: { fontSize: 12, color: '#666', fontWeight: '600' },

  // Card with fixed height — prevents image from stretching
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    marginBottom: 12, flexDirection: 'row',
    height: 138,
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  cardLeft: { width: 92, position: 'relative' },
  cardImg:  { width: 92, height: '100%' },
  badge: {
    position: 'absolute', top: 8, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  badgeText: { fontSize: 9.5, fontWeight: '700' },

  cardRight:   { flex: 1, padding: 11, justifyContent: 'space-between' },
  cardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  groundName:  { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#111', marginRight: 6 },
  idBox:       { alignItems: 'flex-end' },
  idLabel:     { fontSize: 8, color: '#CCCCCC', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  idVal:       { fontSize: 10.5, fontWeight: '800', color: '#666', letterSpacing: 0.2 },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 6 },
  locText:     { fontSize: 10.5, color: '#BBBBBB' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F4FBF7', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 7,
  },
  chipText: { fontSize: 10.5, color: '#333', fontWeight: '500' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 7, borderTopWidth: 1, borderTopColor: '#F4F4F4',
  },
  amount:      { fontSize: 14, fontWeight: '900', color: '#111' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1,
    borderColor: '#C8EDD8', backgroundColor: '#F0FFF6',
  },
  viewBtnText: { fontSize: 11.5, fontWeight: '700', color: GREEN },

  // Empty state
  empty:     { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#EAF7EE', alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#999', marginBottom: 5 },
  emptySub:   { fontSize: 12, color: '#CCC' },

  // Book Now — part of list footer, never overlaps tab bar
  bookBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginTop: 6, marginBottom: 8,
    borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 1, shadowColor: '#000',
    shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  bannerSub:   { fontSize: 11, color: '#BBBBBB', marginTop: 2 },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GREEN, paddingHorizontal: 13,
    paddingVertical: 9, borderRadius: 12,
  },
  bookNowText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.46)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '92%',
  },
  handle:    { width: 38, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle:{ fontSize: 19, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  closeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },

  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  statusPillText: { fontSize: 13, fontWeight: '700' },

  groundCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F6F7FB', borderRadius: 14, padding: 10, marginBottom: 8,
  },
  groundThumb:    { width: 72, height: 56, borderRadius: 10 },
  groundCardName: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 3 },

  detailsBox: {
    borderWidth: 1, borderColor: '#F0F0F0',
    borderRadius: 14, paddingHorizontal: 12,
    backgroundColor: '#fff', marginTop: 4,
  },

  closeBtn:     { marginTop: 12, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});