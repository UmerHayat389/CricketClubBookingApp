import React, { useEffect, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { approveBooking, rejectBooking, getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const BASE = 'http://192.168.100.4:5000/uploads/';

const STATUS_COLOR: any = {
  pending: '#F59E0B',
  approved: '#0A8F3C',
  rejected: '#EF4444',
};

const AdminBookingsScreen = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state: RootState) => state.booking.bookings);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [previewImg, setPreviewImg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadBookings();
    socket.on('bookingCreated', (b) => dispatch(addBooking(b)));
    socket.on('bookingUpdated', (b) => dispatch(updateBooking(b)));
    return () => {
      socket.off('bookingCreated');
      socket.off('bookingUpdated');
    };
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      dispatch(setBookings(data));
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    Alert.alert('Approve Booking', 'Are you sure you want to approve this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          setActionId(id);
          try { await approveBooking(id); }
          catch (e) { Alert.alert('Error', 'Failed to approve'); }
          finally { setActionId(''); }
        }
      },
    ]);
  };

  const handleReject = async (id: string) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setActionId(id);
          try { await rejectBooking(id); }
          catch (e) { Alert.alert('Error', 'Failed to reject'); }
          finally { setActionId(''); }
        }
      },
    ]);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Icon name="calendar-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="time-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{item.slotTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="hourglass-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{item.duration} Hr</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="people-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{item.numberOfPlayers} Players</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountVal}>₨{Number(item.totalAmount).toLocaleString()}</Text>
      </View>

      {/* Payment Screenshot */}
      {item.paymentScreenshot ? (
        <TouchableOpacity
          style={styles.screenshotBtn}
          onPress={() => setPreviewImg(BASE + item.paymentScreenshot)}
        >
          <Icon name="image-outline" size={16} color="#0A8F3C" />
          <Text style={styles.screenshotBtnText}>View Payment Screenshot</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noScreenshot}>No payment screenshot</Text>
      )}

      {/* Notes */}
      {item.notes ? (
        <Text style={styles.notes}>📝 {item.notes}</Text>
      ) : null}

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(item._id)}
            disabled={actionId === item._id}
          >
            {actionId === item._id
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <><Icon name="close-circle-outline" size={16} color="#EF4444" /><Text style={styles.rejectBtnText}>Reject</Text></>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleApprove(item._id)}
            disabled={actionId === item._id}
          >
            {actionId === item._id
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Icon name="checkmark-circle-outline" size={16} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity onPress={loadBookings}>
          <Icon name="refresh-outline" size={22} color="#0A8F3C" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
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

      {loading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#0A8F3C" size="large" />
        : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i._id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Icon name="calendar-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No bookings found</Text>
              </View>
            )}
            renderItem={renderItem}
          />
        )
      }

      {/* Screenshot Preview Modal */}
      <Modal visible={!!previewImg} transparent animationType="fade">
        <View style={styles.imgModalOverlay}>
          <TouchableOpacity style={styles.imgModalClose} onPress={() => setPreviewImg('')}>
            <Icon name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: previewImg }} style={styles.fullImg} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

export default AdminBookingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 50, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },

  filterRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterTabActive: { backgroundColor: '#0A8F3C' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111' },
  phone: { fontSize: 13, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F8F8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailText: { fontSize: 12, color: '#555' },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5', marginBottom: 10 },
  amountLabel: { fontSize: 13, color: '#888' },
  amountVal: { fontSize: 16, fontWeight: '800', color: '#0A8F3C' },

  screenshotBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FFF6', padding: 10, borderRadius: 10, marginBottom: 10 },
  screenshotBtnText: { color: '#0A8F3C', fontWeight: '600', fontSize: 13 },
  noScreenshot: { fontSize: 12, color: '#CCC', marginBottom: 10 },
  notes: { fontSize: 13, color: '#666', backgroundColor: '#FFFBF0', padding: 10, borderRadius: 8, marginBottom: 10 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, backgroundColor: '#0A8F3C' },
  approveBtnText: { color: '#fff', fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#BBB', marginTop: 12 },

  imgModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imgModalClose: { position: 'absolute', top: 50, right: 16, zIndex: 10 },
  fullImg: { width: '90%', height: '70%' },
});