import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Platform, StatusBar, ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking, Booking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

// ── Constants ──────────────────────────────────────────────────────────────
const GREEN     = '#0A8F3C';
const BG        = '#F7F8FA';
const SCREEN_W  = Dimensions.get('window').width;
const HERO_W    = SCREEN_W - 28; // marginHorizontal: 14 each side

const GROUND_IMAGES = [
  {
    uri:      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
    name:     'Green Field Arena',
    location: 'Lahore, Punjab',
  },
  {
    uri:      'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800',
    name:     'Green Field Arena',
    location: 'Lahore, Punjab',
  },
  {
    uri:      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
    name:     'Green Field Arena',
    location: 'Lahore, Punjab',
  },
];

const QUICK_STATS = [
  { icon: 'time-outline',   label: 'Hours Open',  value: '6AM–10PM',  star: false },
  { icon: 'people-outline', label: 'Max Players', value: '22',         star: false },
  { icon: 'cash-outline',   label: 'Per Hour',    value: 'PKR 1,200', star: false },
  { icon: 'star',           label: 'Rating',      value: '4.8',       star: true  },
];

const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Confirmed', rejected: 'Cancelled', completed: 'Completed' };
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: GREEN,       rejected: '#EF4444',  completed: '#888'      };
const STATUS_BG:    Record<string, string> = { pending: '#FFF8EC', approved: '#EAF7EE',   rejected: '#FFF0F0',  completed: '#F3F3F3'   };

const parseDate = (dateStr: string) => {
  if (!dateStr) return { day: '', date: '', month: '' };
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    const parts = dateStr.split(' ');
    return { date: parts[0] ?? '', month: (parts[1] ?? '').toUpperCase(), day: '' };
  }
  const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return { day: days[d.getDay()], date: String(d.getDate()), month: months[d.getMonth()] };
};

// ── Booking Card ───────────────────────────────────────────────────────────
const BookingCard = ({ item, onPress }: { item: Booking; onPress: () => void }) => {
  const { day, date, month } = parseDate(item.date);
  const label = STATUS_LABEL[item.status] ?? item.status;
  const color = STATUS_COLOR[item.status] ?? '#888';
  const bg    = STATUS_BG[item.status]    ?? '#F5F5F5';

  const slotParts   = item.slotTime?.split(' - ') ?? [];
  const timeDisplay = slotParts.length > 1
    ? `${slotParts[0]} – ${slotParts[slotParts.length - 1]}`
    : item.slotTime;

  const startHour = slotParts[0]
    ? parseInt(slotParts[0].replace(/[^0-9]/g, ''), 10) +
      (slotParts[0].toLowerCase().includes('pm') && !slotParts[0].startsWith('12') ? 12 : 0)
    : 0;
  const matchLabel = startHour < 12 ? 'Morning Match'
    : startHour < 17 ? 'Afternoon Match'
    : 'Evening Match';

  return (
    <TouchableOpacity style={s.bookCard} activeOpacity={0.8} onPress={onPress}>

      {/* Date column */}
      <View style={s.bookDateCol}>
        <Text style={s.bookDay}>{day}</Text>
        <Text style={s.bookDate}>{date}</Text>
        <Text style={s.bookMonth}>{month}</Text>
      </View>

      <View style={s.bookDivider} />

      {/* Info */}
      <View style={s.bookInfo}>
        <Text style={s.bookTitle}>{matchLabel}</Text>
        <View style={s.bookMetaRow}>
          <Icon name="time-outline" size={11} color="#C0C0C0" />
          <Text style={s.bookMeta}>{timeDisplay}</Text>
        </View>
        <View style={s.bookMetaRow}>
          <Icon name="people-outline" size={11} color="#C0C0C0" />
          <Text style={s.bookMeta}>{item.numberOfPlayers} / 22 Players</Text>
        </View>
      </View>

      {/* Status + amount */}
      <View style={s.bookRight}>
        <View style={[s.statusChip, { backgroundColor: bg }]}>
          <Text style={[s.statusChipText, { color }]}>{label}</Text>
          {(item.status === 'approved' || item.status === 'completed') && (
            <Icon name="checkmark" size={9} color={color} />
          )}
        </View>
        <View style={s.bookAmountRow}>
          <Text style={s.bookAmount}>PKR {Number(item.totalAmount).toLocaleString()}</Text>
          <Icon name="chevron-forward" size={12} color="#DDD" />
        </View>
      </View>

    </TouchableOpacity>
  );
};

// ── HomeScreen ─────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }: any) => {
  const dispatch       = useDispatch();
  const bookings       = useSelector((state: RootState) => state.booking.bookings);
  const loading        = useSelector((state: RootState) => (state as any).booking.homeLoading ?? false);
  const userName       = useSelector((state: RootState) => (state as any).auth.userName);
  const userId         = useSelector((state: RootState) => (state as any).auth.userId);
  const insets         = useSafeAreaInsets();

  // Slider
  const sliderRef    = useRef<ScrollView>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  // Only 3 most recent bookings
  const recentBookings = bookings.slice(0, 3);

  // Auto-advance slider every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(prev => {
        const next = (prev + 1) % GROUND_IMAGES.length;
        sliderRef.current?.scrollTo({ x: next * HERO_W, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const loadBookings = useCallback(async () => {
    if (!userId) return; // no user logged in yet, don't fetch
    try {
      const data = await getBookings(userId);
      dispatch(setBookings(data));
    } catch (e) {}
  }, [dispatch, userId]);

  useEffect(() => {
    loadBookings();
    const onNew    = (b: Booking) => dispatch(addBooking(b));
    const onUpdate = (b: Booking) => dispatch(updateBooking(b));
    socket.on('bookingCreated', onNew);
    socket.on('bookingUpdated', onUpdate);
    return () => { socket.off('bookingCreated', onNew); socket.off('bookingUpdated', onUpdate); };
  }, [loadBookings]); // re-runs whenever userId changes (new user login)

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
        bounces={false}
        contentInsetAdjustmentBehavior="never"
      >

        {/* ── Header — top padding uses real safe area inset ── */}
        <View style={[s.header, { paddingTop: insets.top + 6 }]}>
          <View>
            <Text style={s.greeting}>Welcome back{userName ? `, ${userName}` : ''}!</Text>
            <Text style={s.headerTitle}>Green Feild Arena</Text>
          </View>
          <TouchableOpacity style={s.notifBtn} activeOpacity={0.7}>
            <Icon name="notifications-outline" size={20} color="#333" />
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Slider ── */}
        <View style={s.heroWrap}>
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_W);
              setSlideIdx(idx);
            }}
            style={{ width: HERO_W, height: 185, borderRadius: 16 }}
            contentContainerStyle={{ borderRadius: 16 }}
          >
            {GROUND_IMAGES.map((img, i) => (
              <View key={i} style={{ width: HERO_W, height: 185, overflow: 'hidden', borderRadius: 16 }}>
                <Image source={{ uri: img.uri }} style={s.heroImg} />
                <View style={s.heroOverlay} />
                <View style={s.heroBottom}>
                  <Text style={s.heroName}>{img.name}</Text>
                  <View style={s.heroLocRow}>
                    <Icon name="location-outline" size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={s.heroLoc}>{img.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={s.heroDots}>
            {GROUND_IMAGES.map((_, i) => (
              <View key={i} style={[s.dot, i === slideIdx && s.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          {QUICK_STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <View style={s.statItem}>
                <Icon
                  name={stat.star ? 'star-outline' : stat.icon}
                  size={18}
                  color={GREEN}
                />
                <Text style={s.statLabel}>{stat.label}</Text>
                <View style={s.statValueRow}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  {stat.star && (
                    <Icon name="star-outline" size={9} color={GREEN} style={{ marginLeft: 2, marginTop: 2 }} />
                  )}
                </View>
              </View>
              {i < QUICK_STATS.length - 1 && <View style={s.statDiv} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Book Now Banner ── */}
        <TouchableOpacity
          style={s.bookBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('BookNow')}
        >
          <View style={s.bookBannerLeft}>
            <View style={s.bookIconBox}>
              <Icon name="calendar-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={s.bookBannerTitle}>Ready to play?</Text>
              <Text style={s.bookBannerSub}>Book your slot in seconds</Text>
            </View>
          </View>
          <View style={s.bookNowBtn}>
            <Text style={s.bookNowText}>Book Now</Text>
            <Icon name="chevron-forward" size={13} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* ── Your Bookings ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Your Bookings</Text>
          <TouchableOpacity style={s.viewAllBtn} onPress={() => navigation.navigate('Bookings')}>
            <Text style={s.viewAllText}>View All</Text>
            <Icon name="chevron-forward" size={13} color={GREEN} />
          </TouchableOpacity>
        </View>

        {loading && bookings.length === 0 ? (
          <ActivityIndicator color={GREEN} style={{ marginVertical: 20 }} />
        ) : recentBookings.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
              <Icon name="calendar-outline" size={28} color={GREEN} />
            </View>
            <Text style={s.emptyTitle}>No upcoming bookings</Text>
            <Text style={s.emptySub}>Tap "Book Now" to reserve your slot</Text>
          </View>
        ) : (
          recentBookings.map(b => (
            <BookingCard key={b._id} item={b} onPress={() => navigation.navigate('Bookings')} />
          ))
        )}

      </ScrollView>
    </View>
  );
};

export default HomeScreen;

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: {
    paddingBottom: 0,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: BG,
  },
  greeting: {
    fontSize: 11,
    color: GREEN,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: GREEN, borderWidth: 1.5, borderColor: '#fff',
  },

  // ── Hero ────────────────────────────────────────────────────────────────
  heroWrap: {
    marginHorizontal: 14,
    marginTop: 4,
    borderRadius: 16,
    height: 185,
    overflow: 'hidden',  // clips the slider images to rounded corners
  },
  heroImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.38)' },
  heroDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 10,
  },
  dot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: GREEN, width: 18, borderRadius: 4 },
  heroBottom:{ position: 'absolute', bottom: 30, left: 14, zIndex: 10 },
  heroName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  heroLocRow:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroLoc:   { fontSize: 11.5, color: 'rgba(255,255,255,0.88)', fontWeight: '500' },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statLabel: {
    fontSize: 9.5,
    color: '#BBBBBB',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  statValueRow: { flexDirection: 'row', alignItems: 'center' },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statDiv: { width: 1, height: 34, backgroundColor: '#F0F0F0' },

  // ── Book Now Banner ──────────────────────────────────────────────────────
  bookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GREEN,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: GREEN,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  bookBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bookIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bookBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.1,
  },
  bookBannerSub: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 1,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookNowText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // ── Section header ───────────────────────────────────────────────────────
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', color: '#1A1A1A' },
  viewAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 1 },
  viewAllText:  { fontSize: 12, color: GREEN, fontWeight: '600' },

  // ── Booking card ─────────────────────────────────────────────────────────
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  bookDateCol: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  bookDay:   { fontSize: 9, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  bookDate:  { fontSize: 24, fontWeight: '900', color: '#1A1A1A', lineHeight: 28 },
  bookMonth: { fontSize: 9, fontWeight: '600', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: 0.5 },

  bookDivider: { width: 1, height: 44, backgroundColor: '#F0F0F0', marginHorizontal: 12 },

  bookInfo:   { flex: 1 },
  bookTitle:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 6, letterSpacing: -0.1 },
  bookMetaRow:{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  bookMeta:   { fontSize: 11, color: '#AAAAAA', fontWeight: '400' },

  bookRight:  { alignItems: 'flex-end', justifyContent: 'center', gap: 6, paddingLeft: 4 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  bookAmountRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bookAmount: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center', paddingVertical: 28,
    marginHorizontal: 14, backgroundColor: '#fff',
    borderRadius: 14, marginBottom: 8,
  },
  emptyIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EAF7EE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 13.5, fontWeight: '700', color: '#333', marginBottom: 4 },
  emptySub:   { fontSize: 11.5, color: '#CCC', textAlign: 'center', paddingHorizontal: 24 },
});