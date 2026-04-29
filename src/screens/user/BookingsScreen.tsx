import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const STATUS_CONFIG: any = {
  pending:  { color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline',             label: 'Pending'  },
  approved: { color: '#0A8F3C', bg: '#F0FFF6', icon: 'checkmark-circle-outline', label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline',     label: 'Rejected' },
};

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const BookingsScreen = () => {
  // ── ALL HOOKS FIRST – never conditionally ──────────────────────
  const dispatch   = useDispatch();
  const bookings   = useSelector((state: RootState) => state.booking.bookings);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<FilterType>('all');

  const loadBookings = useCallback(async () => {
    try {
      const data = await getBookings();
      dispatch(setBookings(data));
    } catch (e) {
      console.log('Error loading bookings', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadBookings();

    const handleCreate = (b: any) => dispatch(addBooking(b));
    const handleUpdate = (b: any) => dispatch(updateBooking(b));

    socket.on('bookingCreated', handleCreate);
    socket.on('bookingUpdated', handleUpdate);

    return () => {
      socket.off('bookingCreated', handleCreate);
      socket.off('bookingUpdated', handleUpdate);
    };
  }, [loadBookings]);

  // ── Derived data (no hooks below this point) ───────────────────
  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {
    all:      bookings.length,
    pending:  bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  // ── Render helpers ─────────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    return (
      <View style={styles.card}>
        <View style={[styles.statusStrip, { backgroundColor: sc.color }]} />
        <View style={styles.cardContent}>

          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.groundName}>Green Field Arena</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={12} color="#888" />
                <Text style={styles.locationText}>Lahore, Punjab</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Icon name={sc.icon} size={13} color={sc.color} />
              <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Detail Grid */}
          <View style={styles.detailGrid}>
            {[
              { icon: 'calendar-outline',  label: 'Date',     val: item.date },
              { icon: 'time-outline',      label: 'Time Slot',val: item.slotTime },
              { icon: 'hourglass-outline', label: 'Duration', val: `${item.duration} Hr` },
              { icon: 'people-outline',    label: 'Players',  val: String(item.numberOfPlayers) },
            ].map(d => (
              <View key={d.label} style={styles.detailItem}>
                <Icon name={d.icon} size={14} color="#0A8F3C" />
                <View>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailVal}>{d.val}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.bookedBy}>
              <Text style={{ color: '#888' }}>Booked by  </Text>
              {item.userName}
            </Text>
            <Text style={styles.amount}>PKR {Number(item.totalAmount).toLocaleString()}</Text>
          </View>

          {/* Status message */}
          {{
            pending:  { icon: 'information-circle-outline', msg: 'Awaiting admin approval' },
            approved: { icon: 'checkmark-circle-outline',   msg: 'Your booking is confirmed!' },
            rejected: { icon: 'close-circle-outline',       msg: 'Booking was rejected. Contact support.' },
          }[item.status as string] && (
            <View style={styles.statusMsg}>
              <Icon
                name={({ pending: 'information-circle-outline', approved: 'checkmark-circle-outline', rejected: 'close-circle-outline' } as any)[item.status]}
                size={14} color={sc.color}
              />
              <Text style={[styles.statusMsgText, { color: sc.color }]}>
                {({ pending: 'Awaiting admin approval', approved: 'Your booking is confirmed!', rejected: 'Booking was rejected. Contact support.' } as any)[item.status]}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh-outline" size={22} color="#0A8F3C" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { key: 'pending',  color: '#F59E0B', bg: '#FFF7ED' },
          { key: 'approved', color: '#0A8F3C', bg: '#F0FFF6' },
          { key: 'rejected', color: '#EF4444', bg: '#FEF2F2' },
          { key: 'all',      color: '#555555', bg: '#F5F5F5' },
        ].map(s => (
          <View key={s.key} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{counts[s.key as FilterType]}</Text>
            <Text style={styles.statLabel}>{s.key.charAt(0).toUpperCase() + s.key.slice(1)}</Text>
          </View>
        ))}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#0A8F3C" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A8F3C" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Icon name="calendar-outline" size={56} color="#DDD" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' ? 'You have not made any bookings yet' : `No ${filter} bookings`}
              </Text>
            </View>
          )}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default BookingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  statsRow: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  statCard:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  statNum:   { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },

  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  filterTab:       { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterTabActive: { backgroundColor: '#0A8F3C' },
  filterText:      { fontSize: 12, color: '#777', fontWeight: '600' },
  filterTextActive:{ color: '#fff' },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    overflow: 'hidden',
  },
  statusStrip: { width: 5 },
  cardContent: { flex: 1, padding: 14 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  groundName: { fontSize: 15, fontWeight: '800', color: '#111' },
  locationRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText:{ fontSize: 11, color: '#888' },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  detailLabel:{ fontSize: 10, color: '#AAA' },
  detailVal:  { fontSize: 12, fontWeight: '700', color: '#111' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5', marginBottom: 8,
  },
  bookedBy: { fontSize: 13, fontWeight: '600', color: '#333' },
  amount:   { fontSize: 16, fontWeight: '900', color: '#0A8F3C' },

  statusMsg:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAFAFA', padding: 8, borderRadius: 8 },
  statusMsgText: { fontSize: 12, fontWeight: '600' },

  empty:        { alignItems: 'center', marginTop: 70 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#CCC', marginTop: 16 },
  emptySubtitle:{ fontSize: 13, color: '#DDD', marginTop: 6 },
});