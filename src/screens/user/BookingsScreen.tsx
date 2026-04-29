import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

// Map status → tab key
// Upcoming  = pending + approved
// Completed = approved (treated as completed for display; adjust if you have a 'completed' status)
// Cancelled = rejected
type TabType = 'upcoming' | 'completed' | 'cancelled';

const GROUND_IMAGE = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400';

const BookingsScreen = ({ navigation }: any) => {
  const dispatch   = useDispatch();
  const bookings   = useSelector((state: RootState) => state.booking.bookings);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<TabType>('upcoming');

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

  // ── Filter logic ───────────────────────────────────────────────
  const upcomingList  = bookings.filter(b => b.status === 'pending' || b.status === 'approved');
  const completedList = bookings.filter(b => b.status === 'approved');
  const cancelledList = bookings.filter(b => b.status === 'rejected');

  const tabData: Record<TabType, any[]> = {
    upcoming:  upcomingList,
    completed: completedList,
    cancelled: cancelledList,
  };

  const filtered = tabData[activeTab];

  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  // Short booking ID from _id
  const shortId = (id: string) => `#GF${id.slice(-5).toUpperCase()}`;

  // ── Render card ────────────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const statusColor =
      item.status === 'approved' ? '#0A8F3C' :
      item.status === 'rejected' ? '#EF4444' : '#F59E0B';

    const statusLabel =
      item.status === 'approved' ? 'Upcoming' :
      item.status === 'rejected' ? 'Cancelled' : 'Upcoming';

    const statusBg =
      item.status === 'approved' ? '#E8F5EE' :
      item.status === 'rejected' ? '#FEF2F2' : '#FFF7ED';

    return (
      <View style={styles.card}>
        {/* Status badge over image */}
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: GROUND_IMAGE }} style={styles.cardImage} />
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          {/* Top row */}
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.groundName}>Green Field Arena</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={12} color="#888" />
                <Text style={styles.locationText}>Lahore, Punjab</Text>
              </View>
            </View>
            <View style={styles.bookingIdWrap}>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdVal}>{shortId(item._id)}</Text>
            </View>
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="calendar-outline" size={13} color="#0A8F3C" />
              <Text style={styles.infoText}>{item.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="time-outline" size={13} color="#0A8F3C" />
              <Text style={styles.infoText}>{item.slotTime}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="hourglass-outline" size={13} color="#0A8F3C" />
              <Text style={styles.infoText}>{item.duration} Hr</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.amountText}>
              PKR {Number(item.totalAmount).toLocaleString()}
            </Text>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>View Details</Text>
              <Icon name="chevron-forward" size={14} color="#0A8F3C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: 'upcoming',  label: 'Upcoming'  },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh-outline" size={22} color="#0A8F3C" />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            {activeTab === t.key && (
              <Icon name="checkmark-circle-outline" size={14} color="#0A8F3C" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A8F3C" />
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bookings
                </Text>
                <TouchableOpacity style={styles.filterBtn}>
                  <Icon name="filter-outline" size={14} color="#555" />
                  <Text style={styles.filterBtnText}>Filter</Text>
                  <Icon name="chevron-down" size={13} color="#555" />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Icon name="calendar-outline" size={60} color="#DDD" />
              <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming' ? 'Book a slot to get started' : `No ${activeTab} bookings found`}
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  tabActive: {
    borderColor: '#0A8F3C',
    backgroundColor: '#F0FFF6',
  },
  tabText: { fontSize: 12, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#0A8F3C' },

  listContent: { padding: 16, paddingBottom: 32 },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText: { fontSize: 16, fontWeight: '700', color: '#111' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardImageWrap: {
    width: 100,
    position: 'relative',
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 110,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  cardBody: { flex: 1, padding: 12 },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groundName:   { fontSize: 14, fontWeight: '800', color: '#111' },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  locationText: { fontSize: 11, color: '#888' },

  bookingIdWrap: { alignItems: 'flex-end' },
  bookingIdLabel: { fontSize: 9, color: '#AAA', fontWeight: '500' },
  bookingIdVal:   { fontSize: 11, fontWeight: '700', color: '#555' },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: '#555', fontWeight: '500' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  amountText: { fontSize: 15, fontWeight: '900', color: '#111' },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8EDD8',
    backgroundColor: '#F0FFF6',
  },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: '#0A8F3C' },

  // Empty
  empty:         { alignItems: 'center', marginTop: 80 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#CCC', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#DDD', marginTop: 6 },
});