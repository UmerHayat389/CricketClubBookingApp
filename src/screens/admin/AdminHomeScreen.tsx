import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import socket from '../../socket/socket';
import API from '../../services/api';

const GREEN       = '#0A8F3C';
const GREEN_LIGHT = '#E8F5EE';
const DARK        = '#111111';

type Filter = 'today' | 'week' | 'month';

interface Stats {
  total:    number;
  pending:  number;
  approved: number;
  rejected: number;
  revenue:  number;
  recent:   any[];
  filter:   string;
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const STATUS_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: '#F59E0B', bg: '#FFF7ED', label: 'Pending'   },
  approved: { color: GREEN,     bg: GREEN_LIGHT, label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEF2F2', label: 'Cancelled' },
};

const shortId = (id: string) => `#GF${id.slice(-6).toUpperCase()}`;
const fmtPKR  = (n: number)  => `PKR ${n.toLocaleString()}`;

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({
  icon, iconBg, label, value, sub, subColor,
}: {
  icon: string; iconBg: string; label: string;
  value: string; sub?: string; subColor?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={18} color="#fff" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {!!sub && (
      <Text style={[styles.statSub, subColor ? { color: subColor } : null]}>{sub}</Text>
    )}
  </View>
);

// ── Section Header ────────────────────────────────────────────────
const SectionHeader = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right}
  </View>
);

// ══════════════════════════════════════════════════════════════════
const AdminHomeScreen = () => {
  const insets    = useSafeAreaInsets();
  const employees = useSelector((s: RootState) => s.employee.employees);
  const events    = useSelector((s: RootState) => s.event.events);

  const [filter,     setFilter]     = useState<Filter>('week');
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (f: Filter = filter) => {
    try {
      const res = await API.get(`/bookings/stats?filter=${f}`);
      setStats(res.data);
    } catch (e) {
      console.log('Stats error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadStats(filter);
  }, [filter]);

  // Real-time: refresh stats on any booking change
  useEffect(() => {
    const refresh = () => loadStats(filter);
    socket.on('bookingCreated', refresh);
    socket.on('bookingUpdated', refresh);
    return () => {
      socket.off('bookingCreated', refresh);
      socket.off('bookingUpdated', refresh);
    };
  }, [filter, loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats(filter);
  };

  const activeStaff   = employees.filter(e => e.status === 'active').length;
  const upcomingEvents = events.filter(e => {
    if (!e.date) return true;
    return new Date(e.date) >= new Date();
  }).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>Welcome back, Admin 👋</Text>
        </View>
        <View style={styles.notifBtn}>
          <Icon name="notifications-outline" size={22} color={DARK} />
          {stats && stats.pending > 0 && (
            <View style={styles.notifDot}>
              <Text style={styles.notifDotText}>{stats.pending}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterPill, filter === f.value && styles.filterPillActive]}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        >

          {/* ── Revenue Banner ── */}
          <View style={styles.revenueBanner}>
            <View>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>{fmtPKR(stats?.revenue ?? 0)}</Text>
              <Text style={styles.revenuePeriod}>
                {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </View>
            <View style={styles.revenueIcon}>
              <Icon name="cash-outline" size={28} color={GREEN} />
            </View>
          </View>

          {/* ── Stat Cards ── */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar-outline"
              iconBg={GREEN}
              label="Total Bookings"
              value={String(stats?.total ?? 0)}
            />
            <StatCard
              icon="time-outline"
              iconBg="#F59E0B"
              label="Pending"
              value={String(stats?.pending ?? 0)}
              sub="Awaiting approval"
              subColor="#F59E0B"
            />
            <StatCard
              icon="checkmark-circle-outline"
              iconBg="#10B981"
              label="Approved"
              value={String(stats?.approved ?? 0)}
            />
            <StatCard
              icon="close-circle-outline"
              iconBg="#EF4444"
              label="Cancelled"
              value={String(stats?.rejected ?? 0)}
            />
          </View>

          {/* ── Staff & Events Row ── */}
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                <Icon name="people-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.infoValue}>{activeStaff}</Text>
              <Text style={styles.infoLabel}>Active Staff</Text>
              <Text style={styles.infoTotal}>of {employees.length} total</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="trophy-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.infoValue}>{upcomingEvents}</Text>
              <Text style={styles.infoLabel}>Upcoming Events</Text>
              <Text style={styles.infoTotal}>of {events.length} total</Text>
            </View>
          </View>

          {/* ── Booking Status Breakdown ── */}
          <View style={styles.card}>
            <SectionHeader title="Booking Status" />
            <View style={styles.statusRow}>
              {[
                { label: 'Pending',   count: stats?.pending  ?? 0, color: '#F59E0B', bg: '#FFF7ED' },
                { label: 'Approved',  count: stats?.approved ?? 0, color: GREEN,     bg: GREEN_LIGHT },
                { label: 'Cancelled', count: stats?.rejected ?? 0, color: '#EF4444', bg: '#FEF2F2' },
              ].map(s => (
                <View key={s.label} style={[styles.statusChip, { backgroundColor: s.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.statusChipCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={styles.statusChipLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Progress bar */}
            {(stats?.total ?? 0) > 0 && (
              <View style={styles.progressWrap}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressSegment, {
                    width: `${((stats?.approved ?? 0) / (stats?.total ?? 1)) * 100}%`,
                    backgroundColor: GREEN,
                  }]} />
                  <View style={[styles.progressSegment, {
                    width: `${((stats?.pending ?? 0) / (stats?.total ?? 1)) * 100}%`,
                    backgroundColor: '#F59E0B',
                  }]} />
                  <View style={[styles.progressSegment, {
                    width: `${((stats?.rejected ?? 0) / (stats?.total ?? 1)) * 100}%`,
                    backgroundColor: '#EF4444',
                  }]} />
                </View>
              </View>
            )}
          </View>

          {/* ── Recent Bookings ── */}
          <View style={styles.card}>
            <SectionHeader title="Recent Bookings" />
            {(stats?.recent ?? []).length === 0 ? (
              <View style={styles.emptyWrap}>
                <Icon name="calendar-outline" size={32} color="#DDD" />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              (stats?.recent ?? []).map((b: any, i: number) => {
                const cfg = STATUS_COLOR[b.status] ?? { color: '#888', bg: '#F5F5F5', label: b.status };
                return (
                  <View key={b._id} style={[styles.bookingRow, i < (stats?.recent.length ?? 0) - 1 && styles.bookingRowBorder]}>
                    {/* Avatar */}
                    <View style={styles.bookingAvatar}>
                      <Text style={styles.bookingAvatarText}>
                        {(b.userName ?? 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingName} numberOfLines={1}>{b.userName}</Text>
                      <Text style={styles.bookingMeta}>{b.date}  ·  {b.slotTime}</Text>
                    </View>

                    {/* Right */}
                    <View style={styles.bookingRight}>
                      <Text style={styles.bookingAmount}>{fmtPKR(b.totalAmount)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Quick Info ── */}
          <View style={styles.card}>
            <SectionHeader title="Ground Info" />
            {[
              { icon: 'location-outline',  iconBg: GREEN,     label: 'Venue',         value: 'Green Field Arena, Lahore' },
              { icon: 'cash-outline',      iconBg: '#10B981', label: 'Price / Hour',  value: 'PKR 1,200'                 },
              { icon: 'time-outline',      iconBg: '#F59E0B', label: 'Open Hours',    value: '4:00 PM – 1:00 AM'         },
              { icon: 'people-outline',    iconBg: '#7C3AED', label: 'Max Players',   value: '22 per booking'            },
            ].map(row => (
              <View key={row.label} style={styles.infoListRow}>
                <View style={[styles.infoListIcon, { backgroundColor: row.iconBg }]}>
                  <Icon name={row.icon} size={15} color="#fff" />
                </View>
                <Text style={styles.infoListLabel}>{row.label}</Text>
                <Text style={styles.infoListValue}>{row.value}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default AdminHomeScreen;

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F6F7FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#999', marginTop: 2 },
  notifBtn:    { position: 'relative', marginTop: 4 },
  notifDot: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  notifDotText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  // Filter pills
  filterRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  filterPill:       { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EBEBEB' },
  filterPillActive: { backgroundColor: GREEN, borderColor: GREEN },
  filterText:       { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },

  // Revenue banner
  revenueBanner: {
    backgroundColor: GREEN_LIGHT, borderRadius: 16, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, borderWidth: 1, borderColor: '#C8EDD8',
  },
  revenueLabel:  { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 4 },
  revenueValue:  { fontSize: 26, fontWeight: '900', color: GREEN, letterSpacing: -0.5 },
  revenuePeriod: { fontSize: 11, color: '#888', marginTop: 4 },
  revenueIcon:   { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  statIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  statSub:   { fontSize: 11, color: '#AAA', marginTop: 3 },

  // Info row (staff + events)
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  infoIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoValue: { fontSize: 22, fontWeight: '800', color: DARK },
  infoLabel: { fontSize: 12, color: '#555', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  infoTotal: { fontSize: 11, color: '#BBB', marginTop: 2 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: DARK },

  // Status row
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusChip: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 10, gap: 3 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusChipCount: { fontSize: 18, fontWeight: '800' },
  statusChipLabel: { fontSize: 10, color: '#888', fontWeight: '600' },

  // Progress bar
  progressWrap: { marginTop: 4 },
  progressBar:  { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  progressSegment: { height: 6 },

  // Booking rows
  bookingRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  bookingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  bookingAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  bookingAvatarText: { fontSize: 15, fontWeight: '800', color: GREEN },
  bookingInfo:       { flex: 1 },
  bookingName:       { fontSize: 13, fontWeight: '700', color: DARK },
  bookingMeta:       { fontSize: 11, color: '#AAA', marginTop: 2 },
  bookingRight:      { alignItems: 'flex-end', gap: 4 },
  bookingAmount:     { fontSize: 12, fontWeight: '700', color: DARK },
  statusBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText:   { fontSize: 10, fontWeight: '700' },

  // Info list rows
  infoListRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoListIcon:  { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  infoListLabel: { flex: 1, fontSize: 13, color: '#888', fontWeight: '500' },
  infoListValue: { fontSize: 13, fontWeight: '700', color: DARK, textAlign: 'right', maxWidth: '55%' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: '#CCC' },
});