import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import socket from '../../socket/socket';
import API from '../../services/api';

const { width: SW } = Dimensions.get('window');

const GREEN        = '#0A8F3C';
const GREEN_LIGHT  = '#E8F5EE';
const GREEN_MID    = '#C6E8D3';
const TEAL         = '#0D9488';
const TEAL_LIGHT   = '#CCFBF1';
const AMBER        = '#D97706';
const AMBER_LIGHT  = '#FEF3C7';
const RED          = '#DC2626';
const RED_LIGHT    = '#FEE2E2';
const PURPLE       = '#7C3AED';
const PURPLE_LIGHT = '#EDE9FE';
const DARK         = '#111827';
const MID          = '#6B7280';
const MUTED        = '#9CA3AF';
const BG           = '#F4F6F9';
const CARD         = '#FFFFFF';
const BORDER       = '#E5E7EB';

type Filter = 'today' | 'week' | 'month';

interface Stats {
  total: number; pending: number; approved: number;
  rejected: number; revenue: number; recent: any[]; filter: string;
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Today',      value: 'today' },
  { label: 'This Week',  value: 'week'  },
  { label: 'This Month', value: 'month' },
];

const STATUS_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: AMBER, bg: AMBER_LIGHT, label: 'Pending'   },
  approved: { color: GREEN, bg: GREEN_LIGHT,  label: 'Approved'  },
  rejected: { color: RED,   bg: RED_LIGHT,    label: 'Cancelled' },
};

const FILTER_LABEL: Record<string, string> = {
  today: 'Today', week: 'This Week', month: 'This Month',
};

const fmtPKR = (n: number) => `PKR ${n.toLocaleString()}`;

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimNumber = ({ value, style }: { value: number; style: any }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration: 950, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={style}>{display.toLocaleString()}</Text>;
};

// ── Spark bars ────────────────────────────────────────────────────────────────
const SparkBars = ({ approved, total }: { approved: number; total: number }) => {
  const vals = [
    Math.max(total * 0.3, 1), Math.max(total * 0.5, 1),
    Math.max(total * 0.4, 1), Math.max(total * 0.7, 1),
    Math.max(total * 0.6, 1), Math.max(total * 0.85, 1),
    Math.max(approved, 1),
  ];
  const max = Math.max(...vals);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28 }}>
      {vals.map((v, i) => (
        <View key={i} style={{ width: 5, borderRadius: 3, height: Math.max((v / max) * 28, 3), backgroundColor: 'rgba(255,255,255,0.5)' }} />
      ))}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE card — Revenue hero on top, then ONE progress row per status.
// Approved / Pending / Cancelled appear exactly ONCE. No chips, no bar chart,
// no KPI row — just one clean breakdown.
// ══════════════════════════════════════════════════════════════════════════════
const DashboardOverview = ({
  approved, pending, rejected, total, revenue, filter,
}: { approved: number; pending: number; rejected: number; total: number; revenue: number; filter: string }) => {

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
  }, [approved, pending, rejected, total]);

  const approvalPct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const rows = [
    { label: 'Approved',  value: approved, color: GREEN, bg: GREEN_LIGHT, icon: 'checkmark-circle' },
    { label: 'Pending',   value: pending,  color: AMBER, bg: AMBER_LIGHT, icon: 'time-outline'     },
    { label: 'Cancelled', value: rejected, color: RED,   bg: RED_LIGHT,   icon: 'close-circle'     },
  ];

  return (
    <View style={ov.wrapper}>

      {/* ── Revenue Hero ── */}
      <View style={ov.hero}>
        <View style={ov.blob1} /><View style={ov.blob2} /><View style={ov.blob3} />
        <View style={{ flex: 1 }}>
          <View style={ov.eyeRow}>
            <View style={ov.eyeDot} />
            <Text style={ov.eyeTxt}>TOTAL REVENUE · {FILTER_LABEL[filter] ?? filter}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
            <Text style={ov.pkrLabel}>PKR</Text>
            <AnimNumber value={revenue} style={ov.revenueAmt} />
          </View>
          <View style={ov.heroSub}>
            <Icon name="trending-up-outline" size={12} color="rgba(255,255,255,0.65)" />
            <Text style={ov.heroSubTxt}>{total} booking{total !== 1 ? 's' : ''} · {approvalPct}% approved</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 5 }}>
          <SparkBars approved={approved} total={total} />
          <Text style={ov.sparkLbl}>TREND</Text>
        </View>
      </View>

      {/* ── Breakdown body ── */}
      <View style={ov.body}>

        {/* Approval rate banner */}
        <View style={ov.rateBanner}>
          <View style={ov.rateLeft}>
            <View style={ov.rateIcon}>
              <Icon name="trending-up-outline" size={16} color={GREEN} />
            </View>
            <View>
              <Text style={ov.rateSub}>Approval Rate</Text>
              <Text style={ov.rateDesc}>{approved} of {total} bookings approved</Text>
            </View>
          </View>
          <Text style={ov.ratePct}>{approvalPct}%</Text>
        </View>

        {/* Colour segmented bar */}
        <View style={ov.segTrack}>
          {total > 0 && rows.filter(r => r.value > 0).map((r, i, arr) => (
            <View
              key={r.label}
              style={[
                ov.segFill,
                { flex: r.value / total, backgroundColor: r.color },
                i === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                i === arr.length - 1 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
              ]}
            />
          ))}
        </View>

        {/* ── ONE row per status — no repetition anywhere ── */}
        {rows.map(row => {
          const ratio = total > 0 ? row.value / total : 0;
          const animW = anim.interpolate({
            inputRange:  [0, 1],
            outputRange: ['0%', `${Math.max(Math.round(ratio * 100), row.value > 0 ? 4 : 0)}%`],
          });
          const pct = total > 0 ? Math.round(ratio * 100) : 0;
          return (
            <View key={row.label} style={ov.row}>
              <View style={[ov.rowIcon, { backgroundColor: row.bg }]}>
                <Icon name={row.icon as any} size={16} color={row.color} />
              </View>
              <View style={ov.rowRight}>
                <View style={ov.rowTop}>
                  <Text style={ov.rowLabel}>{row.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[ov.rowPct, { color: row.color }]}>{pct}%</Text>
                    <Text style={[ov.rowVal, { color: row.color }]}>{row.value}</Text>
                  </View>
                </View>
                <View style={ov.track}>
                  <Animated.View style={[ov.fill, { width: animW, backgroundColor: row.color }]} />
                </View>
              </View>
            </View>
          );
        })}

        {/* Avg per booking */}
        {total > 0 && (
          <View style={ov.avgRow}>
            <View style={ov.avgIcon}><Icon name="receipt-outline" size={13} color={GREEN} /></View>
            <Text style={ov.avgLabel}>Avg per booking</Text>
            <Text style={ov.avgVal}>{fmtPKR(Math.round(revenue / total))}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const ov = StyleSheet.create({
  wrapper: { marginBottom: 12 },

  hero:       { backgroundColor: GREEN, borderRadius: 20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  blob1:      { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)', top: -35, right: -25 },
  blob2:      { position: 'absolute', width: 65,  height: 65,  borderRadius: 33, backgroundColor: 'rgba(255,255,255,0.09)', bottom: -20, right: 80 },
  blob3:      { position: 'absolute', width: 40,  height: 40,  borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', top: 10, left: SW * 0.4 },
  eyeRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  eyeDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  eyeTxt:     { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  pkrLabel:   { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  revenueAmt: { fontSize: 32, fontWeight: '900', color: CARD, letterSpacing: -0.5 },
  heroSub:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroSubTxt: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  sparkLbl:   { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5 },

  body:       { backgroundColor: CARD, borderTopWidth: 1.5, borderTopColor: GREEN_MID, borderRadius: 20, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },

  rateBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: GREEN_LIGHT, borderRadius: 14, padding: 12, marginBottom: 14 },
  rateLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rateIcon:   { width: 34, height: 34, borderRadius: 10, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  rateSub:    { fontSize: 10, color: MID, fontWeight: '500', marginBottom: 1 },
  rateDesc:   { fontSize: 12, fontWeight: '700', color: DARK },
  ratePct:    { fontSize: 28, fontWeight: '900', color: GREEN, letterSpacing: -0.5 },

  segTrack:   { height: 8, backgroundColor: '#F0F3F7', borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 },
  segFill:    { height: 8 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rowIcon:    { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowRight:   { flex: 1, gap: 6 },
  rowTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:   { fontSize: 13, fontWeight: '600', color: DARK },
  rowPct:     { fontSize: 11, fontWeight: '700' },
  rowVal:     { fontSize: 15, fontWeight: '900', minWidth: 20, textAlign: 'right' },
  track:      { height: 7, backgroundColor: '#F0F2F5', borderRadius: 4, overflow: 'hidden' },
  fill:       { height: 7, borderRadius: 4 },

  avgRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN_LIGHT, borderRadius: 12, padding: 11, marginTop: 4 },
  avgIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  avgLabel:   { flex: 1, fontSize: 12, color: MID, fontWeight: '500' },
  avgVal:     { fontSize: 13, fontWeight: '800', color: GREEN },
});

// ══════════════════════════════════════════════════════════════════════════════
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
    } catch (e) { console.log('Stats error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); loadStats(filter); }, [filter]);

  useEffect(() => {
    const refresh = () => loadStats(filter);
    socket.on('bookingCreated', refresh);
    socket.on('bookingUpdated', refresh);
    return () => { socket.off('bookingCreated', refresh); socket.off('bookingUpdated', refresh); };
  }, [filter, loadStats]);

  const onRefresh      = () => { setRefreshing(true); loadStats(filter); };
  const activeStaff    = employees.filter(e => e.status === 'active').length;
  const upcomingEvents = events.filter(e => !e.date || new Date(e.date) >= new Date()).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={CARD} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={s.headerEye}>ADMIN PANEL</Text>
          <Text style={s.headerTitle}>Dashboard</Text>
        </View>
        <View style={s.headerRight}>
          {(stats?.pending ?? 0) > 0 && (
            <View style={s.pendingPill}>
              <View style={s.pendingDot} />
              <Text style={s.pendingText}>{stats?.pending} pending</Text>
            </View>
          )}
          <View style={s.notifBtn}>
            <Icon name="notifications-outline" size={20} color={DARK} />
            {(stats?.pending ?? 0) > 0 && <View style={s.notifDot} />}
          </View>
        </View>
      </View>

      {/* Filter pills */}
      <View style={s.filterWrap}>
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[s.filterPill, filter === f.value && s.filterPillActive]}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, filter === f.value && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={GREEN} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        >
          {/* ─────────────────────────────────────────────────────────────
              ONE unified card. Approved / Pending / Cancelled shown ONCE.
              No separate KPI row. No separate StatusDistribution card.
              ───────────────────────────────────────────────────────────── */}
          <DashboardOverview
            approved={stats?.approved ?? 0}
            pending={stats?.pending   ?? 0}
            rejected={stats?.rejected ?? 0}
            total={stats?.total       ?? 0}
            revenue={stats?.revenue   ?? 0}
            filter={filter}
          />

          {/* Staff & Events */}
          <View style={s.twoCol}>
            <View style={[s.miniCard, { borderLeftColor: PURPLE }]}>
              <View style={[s.miniIconWrap, { backgroundColor: PURPLE_LIGHT }]}>
                <Icon name="people-circle-outline" size={22} color={PURPLE} />
              </View>
              <Text style={s.miniVal}>{activeStaff}</Text>
              <Text style={s.miniLabel}>Active Staff</Text>
              <Text style={s.miniSub}>of {employees.length} total</Text>
            </View>
            <View style={[s.miniCard, { borderLeftColor: AMBER }]}>
              <View style={[s.miniIconWrap, { backgroundColor: AMBER_LIGHT }]}>
                <Icon name="ribbon-outline" size={22} color={AMBER} />
              </View>
              <Text style={s.miniVal}>{upcomingEvents}</Text>
              <Text style={s.miniLabel}>Upcoming Events</Text>
              <Text style={s.miniSub}>of {events.length} total</Text>
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View>
                <Text style={s.cardTitle}>Recent Bookings</Text>
                <Text style={s.cardSub}>Latest activity</Text>
              </View>
            </View>
            {(stats?.recent ?? []).length === 0 ? (
              <View style={s.empty}>
                <View style={s.emptyIconWrap}><Icon name="receipt-outline" size={26} color={MUTED} /></View>
                <Text style={s.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              (stats?.recent ?? []).map((b: any, i: number) => {
                const cfg = STATUS_COLOR[b.status] ?? { color: MID, bg: '#F5F5F5', label: b.status };
                return (
                  <View key={b._id} style={[s.bookRow, i < (stats?.recent.length ?? 0) - 1 && s.bookDivider]}>
                    <View style={s.bookAvatar}>
                      <Text style={s.bookAvatarTxt}>{(b.userName ?? 'U').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={s.bookInfo}>
                      <Text style={s.bookName} numberOfLines={1}>{b.userName}</Text>
                      <View style={s.bookMeta}>
                        <Icon name="calendar-outline" size={10} color={MUTED} />
                        <Text style={s.bookMetaTxt}>{b.date}</Text>
                        <Icon name="time-outline" size={10} color={MUTED} />
                        <Text style={s.bookMetaTxt}>{b.slotTime}</Text>
                      </View>
                    </View>
                    <View style={s.bookRight}>
                      <Text style={s.bookAmt}>{fmtPKR(b.totalAmount)}</Text>
                      <View style={[s.bookBadge, { backgroundColor: cfg.bg }]}>
                        <View style={[s.bookBadgeDot, { backgroundColor: cfg.color }]} />
                        <Text style={[s.bookBadgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Ground Info */}
          <View style={s.card}>
            <Text style={[s.cardTitle, { marginBottom: 14 }]}>Ground Info</Text>
            {[
              { icon: 'location-outline', color: GREEN,  bg: GREEN_LIGHT,  label: 'Venue',        value: 'Green Field Arena, Lahore' },
              { icon: 'wallet-outline',   color: TEAL,   bg: TEAL_LIGHT,   label: 'Price / Hour', value: 'PKR 1,200'                 },
              { icon: 'sunny-outline',    color: AMBER,  bg: AMBER_LIGHT,  label: 'Open Hours',   value: '4:00 PM – 1:00 AM'         },
              { icon: 'people-outline',   color: PURPLE, bg: PURPLE_LIGHT, label: 'Max Players',  value: '22 per booking'            },
            ].map((row, i) => (
              <View key={row.label} style={[s.infoRow, i < 3 && s.infoRowDivider]}>
                <View style={[s.infoIcon, { backgroundColor: row.bg }]}>
                  <Icon name={row.icon as any} size={14} color={row.color} />
                </View>
                <Text style={s.infoLabel}>{row.label}</Text>
                <Text style={s.infoVal}>{row.value}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default AdminHomeScreen;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:           { backgroundColor: CARD, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: BORDER },
  headerEye:        { fontSize: 9.5, color: GREEN, fontWeight: '700', letterSpacing: 2, marginBottom: 3 },
  headerTitle:      { fontSize: 24, fontWeight: '800', color: DARK, letterSpacing: -0.4 },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: AMBER_LIGHT, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pendingDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: AMBER },
  pendingText:      { fontSize: 11, color: AMBER, fontWeight: '700' },
  notifBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  notifDot:         { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 3.5, backgroundColor: RED, borderWidth: 1.5, borderColor: CARD },

  filterWrap:       { backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, paddingHorizontal: 16, paddingVertical: 10 },
  filterRow:        { flexDirection: 'row', gap: 8 },
  filterPill:       { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: BORDER },
  filterPillActive: { backgroundColor: GREEN, borderColor: GREEN },
  filterText:       { fontSize: 12.5, fontWeight: '600', color: MID },
  filterTextActive: { color: CARD },

  scroll: { paddingHorizontal: 14, paddingTop: 14 },

  card:      { backgroundColor: CARD, borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1 },
  cardHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: DARK, letterSpacing: -0.2 },
  cardSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  twoCol:       { flexDirection: 'row', gap: 10, marginBottom: 12 },
  miniCard:     { flex: 1, backgroundColor: CARD, borderRadius: 16, padding: 14, alignItems: 'center', borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1 },
  miniIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  miniVal:      { fontSize: 22, fontWeight: '900', color: DARK },
  miniLabel:    { fontSize: 12, color: MID, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  miniSub:      { fontSize: 10.5, color: MUTED, marginTop: 2 },

  bookRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 11 },
  bookDivider:  { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  bookAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  bookAvatarTxt:{ fontSize: 15, fontWeight: '800', color: GREEN },
  bookInfo:     { flex: 1 },
  bookName:     { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 3 },
  bookMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookMetaTxt:  { fontSize: 10.5, color: MUTED },
  bookRight:    { alignItems: 'flex-end', gap: 4 },
  bookAmt:      { fontSize: 12.5, fontWeight: '800', color: DARK },
  bookBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  bookBadgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  bookBadgeTxt: { fontSize: 10, fontWeight: '700' },

  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  infoRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:       { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  infoLabel:      { flex: 1, fontSize: 12.5, color: MID, fontWeight: '500' },
  infoVal:        { fontSize: 12.5, fontWeight: '700', color: DARK, maxWidth: '55%', textAlign: 'right' },

  empty:         { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  emptyText:     { fontSize: 13, color: MUTED, fontWeight: '500' },
});