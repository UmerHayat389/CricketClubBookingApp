import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform, StatusBar,
  TouchableOpacity, Modal, ScrollView, TextInput, Image, Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEvents, addEvent, updateEvent, deleteEvent, Event } from '../../store/slices/eventSlice';
import { getEvents } from '../../services/eventService';
import { MEDIA_URL } from '../../config/baseUrl';

const GREEN       = '#0A8F3C';
const GREEN_LIGHT = '#E8F5EE';
const DARK        = '#111111';
const CRICKET_BG  = '#1a5c35';

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (d?: string): string => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
};

const isEventPast = (date?: string): boolean => {
  if (!date) return false;
  try { return new Date(date) < new Date(); } catch { return false; }
};

// ── Cricket placeholder ────────────────────────────────────────────────────
const CricketPlaceholder = ({ width, height }: { width: number; height: number }) => (
  <View style={{ width, height, backgroundColor: CRICKET_BG, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name="baseball-outline" size={Math.round(height / 3)} color="rgba(255,255,255,0.2)" />
  </View>
);

// ── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ date, style }: { date?: string; style?: any }) => {
  const isPast = isEventPast(date);
  return (
    <View style={[styles.statusBadge, isPast ? styles.statusBadgePast : styles.statusBadgeLive, style]}>
      <View style={[styles.statusDot, { backgroundColor: isPast ? '#999' : '#5CFF8A' }]} />
      <Text style={[styles.statusBadgeText, { color: isPast ? '#666' : '#fff' }]}>
        {isPast ? 'Past Event' : 'Upcoming'}
      </Text>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════
const EventsScreen = () => {
  const dispatch    = useDispatch<any>();
  const insets      = useSafeAreaInsets();
  const events      = useSelector((state: RootState) => state.event.events);
  const [selected,   setSelected]   = useState<Event | null>(null);
  const [search,     setSearch]     = useState('');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  // ── Real-time ────────────────────────────────────────────────
  useEffect(() => {
    (async () => { try { dispatch(setEvents(await getEvents())); } catch {} })();
    const onCreate = (e: Event)       => dispatch(addEvent(e));
    const onUpdate = (e: Event)       => { dispatch(updateEvent(e)); setSelected(s => s?._id === e._id ? e : s); };
    const onDelete = ({ _id }: { _id: string }) => { dispatch(deleteEvent(_id)); setSelected(s => s?._id === _id ? null : s); };
    socket.on('eventCreated', onCreate);
    socket.on('eventUpdated', onUpdate);
    socket.on('eventDeleted', onDelete);
    return () => {
      socket.off('eventCreated', onCreate);
      socket.off('eventUpdated', onUpdate);
      socket.off('eventDeleted', onDelete);
    };
  }, []);

  // ── Filter ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q)
    );
  }, [events, search]);

  const toggleBookmark = (id: string) =>
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleShare = async (e: Event) => {
    try {
      await Share.share({ title: e.title, message: `${e.title}\n${e.description ?? ''}\nDate: ${formatDate(e.date)}` });
    } catch {}
  };

  // ── Event card ────────────────────────────────────────────────
  const renderCard = ({ item }: { item: Event }) => {
    const isBookmarked = bookmarked.has(item._id);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setSelected(item)}>

        {/* Left: image / placeholder */}
        <View style={styles.cardLeft}>
          {item.banner ? (
            <Image source={{ uri: `${MEDIA_URL}/uploads/events/${item.banner}` }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <CricketPlaceholder width={110} height={130} />
          )}
          <View style={styles.cardBadge}>
            <StatusBadge date={item.date} />
          </View>
        </View>

        {/* Right: info */}
        <View style={styles.cardBody}>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={() => toggleBookmark(item._id)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Icon name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={isBookmarked ? GREEN : '#CCC'} />
          </TouchableOpacity>

          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          {!!item.date && (
            <View style={styles.cardMeta}>
              <Icon name="calendar-outline" size={12} color={GREEN} />
              <Text style={styles.cardMetaText}>{formatDate(item.date)}</Text>
            </View>
          )}

          {!!item.location && (
            <View style={styles.cardMeta}>
              <Icon name="location-outline" size={12} color="#888" />
              <Text style={styles.cardMetaText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}

          <View style={styles.cardMeta}>
            <Icon name="baseball-outline" size={12} color="#888" />
            <Text style={styles.cardMetaText}>Cricket</Text>
          </View>

          <TouchableOpacity style={styles.viewBtn} onPress={() => setSelected(item)}>
            <Text style={styles.viewBtnText}>View Details</Text>
            <Icon name="chevron-forward" size={12} color={GREEN} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Detail Modal ──────────────────────────────────────────────
  const DetailModal = () => {
    if (!selected) return null;
    const isPast      = isEventPast(selected.date);
    const isBookmarked = bookmarked.has(selected._id);

    // Stats items
    const stats = [
      {
        icon: 'calendar-outline',
        iconBg: '#FEF3C7', iconColor: '#F59E0B',
        val: formatDate(selected.date) || '—',
        lbl: 'Date',
      },
      {
        icon: 'baseball-outline',
        iconBg: '#E8F5EE', iconColor: GREEN,
        val: 'Cricket',
        lbl: 'Sport',
      },
      {
        icon: 'wallet-outline',
        iconBg: selected.entryFee > 0 ? '#FFF4E5' : GREEN_LIGHT,
        iconColor: selected.entryFee > 0 ? '#C47A00' : GREEN,
        val: selected.entryFee > 0 ? `Rs.${selected.entryFee}` : 'Free',
        lbl: 'Entry',
      },
      {
        icon: 'people-outline',
        iconBg: '#E0F2FE', iconColor: '#0284C7',
        val: '22',
        lbl: 'Players',
      },
    ];

    return (
      <Modal visible animationType="slide" transparent={false} onRequestClose={() => setSelected(null)}>
        <View style={styles.detailRoot}>
          <StatusBar barStyle="light-content" />

          {/* ── HERO IMAGE (fixed height, not overlapping scroll) ── */}
          <View style={styles.hero}>
            {selected.banner ? (
              <Image
                source={{ uri: `${MEDIA_URL}/uploads/events/${selected.banner}` }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: CRICKET_BG }]}>
                <Icon name="trophy-outline" size={120} color="rgba(255,255,255,0.07)"
                  style={{ position: 'absolute', bottom: -10, right: -10 }} />
              </View>
            )}

            {/* Gradient scrims */}
            <View style={styles.heroScrimTop} />
            <View style={styles.heroScrimBottom} />

            {/* Nav bar */}
            <View style={[styles.heroNav, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={styles.heroBtn} onPress={() => setSelected(null)}>
                <Icon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.heroNavTitle}>Event Details</Text>
              <View style={styles.heroNavRight}>
                <TouchableOpacity style={styles.heroBtn} onPress={() => toggleBookmark(selected._id)}>
                  <Icon name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={isBookmarked ? '#FFD700' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtn} onPress={() => handleShare(selected)}>
                  <Icon name="share-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chips row */}
            <View style={styles.heroChips}>
              <StatusBadge date={selected.date} />
              <View style={styles.heroChipSport}>
                <Icon name="baseball-outline" size={11} color="#fff" />
                <Text style={styles.heroChipText}>Cricket</Text>
              </View>
            </View>

            {/* Title + meta */}
            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle} numberOfLines={2}>{selected.title}</Text>
              <View style={styles.heroMeta}>
                {!!selected.date && (
                  <View style={styles.heroMetaItem}>
                    <Icon name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroMetaText}>{formatDate(selected.date)}</Text>
                  </View>
                )}
                {!!selected.location && (
                  <View style={styles.heroMetaItem}>
                    <Icon name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroMetaText} numberOfLines={1}>{selected.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── SCROLLABLE BODY (starts BELOW hero, no overlap) ── */}
          <ScrollView
            style={styles.detailScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Stats card */}
            <View style={styles.statsCard}>
              {stats.map((item, i) => (
                <React.Fragment key={item.lbl}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconWrap, { backgroundColor: item.iconBg }]}>
                      <Icon name={item.icon} size={17} color={item.iconColor} />
                    </View>
                    <Text style={styles.statVal} numberOfLines={1}>{item.val}</Text>
                    <Text style={styles.statLbl}>{item.lbl}</Text>
                  </View>
                  {i < stats.length - 1 && <View style={styles.statDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* About Event */}
            {!!selected.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>About Event</Text>
                </View>
                <Text style={styles.sectionText}>{selected.description}</Text>
              </View>
            )}

            {/* Event Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Event Details</Text>
              </View>

              {!!selected.date && (
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <View style={[styles.detailRowIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="calendar-outline" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailRowLabel}>Date</Text>
                    <Text style={styles.detailRowValue}>{formatDate(selected.date)}</Text>
                  </View>
                  <View style={[styles.statusPill, isPast ? styles.statusPillPast : styles.statusPillLive]}>
                    <Text style={[styles.statusPillText, { color: isPast ? '#666' : GREEN }]}>
                      {isPast ? 'Past' : 'Upcoming'}
                    </Text>
                  </View>
                </View>
              )}

              {!!selected.location && (
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <View style={[styles.detailRowIcon, { backgroundColor: GREEN_LIGHT }]}>
                    <Icon name="location-outline" size={16} color={GREEN} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailRowLabel}>Venue</Text>
                    <Text style={styles.detailRowValue}>{selected.location}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={[styles.detailRowIcon, { backgroundColor: selected.entryFee > 0 ? '#FFF4E5' : GREEN_LIGHT }]}>
                  <Icon name="wallet-outline" size={16} color={selected.entryFee > 0 ? '#C47A00' : GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailRowLabel}>Entry Fee</Text>
                  <Text style={styles.detailRowValue}>
                    {selected.entryFee > 0 ? `Rs. ${selected.entryFee}` : 'Free Entry'}
                  </Text>
                </View>
                {selected.entryFee === 0 && (
                  <View style={[styles.statusPill, styles.statusPillLive]}>
                    <Text style={[styles.statusPillText, { color: GREEN }]}>FREE</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Organized By */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Organized By</Text>
              </View>
              <View style={styles.organizerRow}>
                <View style={styles.organizerLogo}>
                  <Icon name="shield-checkmark" size={24} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.organizerName}>Green Field Cricket Club</Text>
                  <View style={styles.verifiedRow}>
                    <Icon name="checkmark-circle" size={13} color={GREEN} />
                    <Text style={styles.verifiedText}>Official organizer</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.contactBtn}>
                  <Icon name="call-outline" size={13} color={GREEN} />
                  <Text style={styles.contactBtnText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* ── FOOTER ── */}
          <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={styles.shareCircleBtn}
              onPress={() => handleShare(selected)}
            >
              <Icon name="share-social-outline" size={20} color={GREEN} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Icon name="close-outline" size={18} color="#555" />
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── List screen ───────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.headerSub}>Upcoming cricket events</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Icon name="notifications-outline" size={22} color={DARK} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={16} color="#AAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#BBB"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={16} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderText}>All Events</Text>
        <Text style={styles.listHeaderCount}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="baseball-outline" size={36} color={GREEN} />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Check back soon for upcoming events'}
            </Text>
          </View>
        }
        renderItem={renderCard}
      />

      <DetailModal />
    </View>
  );
};

export default EventsScreen;

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F7FB' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 12, color: '#999', marginTop: 2 },
  notifBtn:    { position: 'relative', marginTop: 4 },
  notifDot:    { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },

  // Search
  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: DARK, padding: 0 },

  // List header
  listHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  listHeaderText: { fontSize: 16, fontWeight: '800', color: DARK },
  listHeaderCount:{ fontSize: 13, color: '#999' },

  // List
  list: { paddingHorizontal: 16, gap: 12 },

  // Card
  card:        { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  cardLeft:    { width: 110, position: 'relative' },
  cardImage:   { width: 110, height: 130 },
  cardBadge:   { position: 'absolute', top: 8, left: 8 },
  cardBody:    { flex: 1, padding: 12, minHeight: 130 },
  bookmarkBtn: { position: 'absolute', top: 10, right: 10 },
  cardTitle:   { fontSize: 14, fontWeight: '800', color: DARK, marginBottom: 6, paddingRight: 26, lineHeight: 19 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  cardMetaText:{ fontSize: 11, color: '#666' },
  viewBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  viewBtnText: { fontSize: 12, color: GREEN, fontWeight: '700' },

  // Status badge
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  statusBadgeLive: { backgroundColor: 'rgba(10,143,60,0.88)' },
  statusBadgePast: { backgroundColor: 'rgba(200,200,200,0.88)' },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty
  empty:     { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: 17, color: '#AAA', fontWeight: '700' },
  emptySub:  { fontSize: 13, color: '#CCC', textAlign: 'center', paddingHorizontal: 40 },

  // ── Detail Modal ─────────────────────────────────────────────

  detailRoot: { flex: 1, backgroundColor: '#F4F6F9' },

  // HERO — fixed height, content BELOW this (no overlap)
  hero:           { height: 260 },
  heroScrimTop:   { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.52)' },
  heroScrimBottom:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150, backgroundColor: 'rgba(0,0,0,0.55)' },

  heroNav:      { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  heroNavTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroNavRight: { flexDirection: 'row', gap: 8 },
  heroBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  heroChips:        { position: 'absolute', top: 100, left: 14, flexDirection: 'row', gap: 8 },
  heroChipSport:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroChipText:     { fontSize: 11, fontWeight: '700', color: '#fff' },

  heroBottom:    { position: 'absolute', bottom: 16, left: 14, right: 14 },
  heroTitle:     { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 26, marginBottom: 8, letterSpacing: -0.3 },
  heroMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  heroMetaItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText:  { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Scroll body starts right below hero — NO negative marginTop
  detailScroll: { flex: 1 },

  // Stats card — sits at top of scroll, NOT floating over image
  statsCard:   { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 6, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  statItem:    { flex: 1, alignItems: 'center', gap: 6 },
  statIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statVal:     { fontSize: 11, fontWeight: '800', color: DARK, textAlign: 'center' },
  statLbl:     { fontSize: 10, color: '#BBB', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },

  // Section
  section:       { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, borderRadius: 18, padding: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: GREEN },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: DARK },
  sectionText:   { fontSize: 14, color: '#555', lineHeight: 22 },

  // Detail rows
  detailRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  detailRowIcon:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailRowLabel:  { fontSize: 11, color: '#BBB', fontWeight: '600', marginBottom: 3 },
  detailRowValue:  { fontSize: 14, color: DARK, fontWeight: '700' },

  // Status pills (inside detail rows)
  statusPill:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillLive: { backgroundColor: GREEN_LIGHT },
  statusPillPast: { backgroundColor: '#F0F0F0' },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // Organizer
  organizerRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  organizerLogo: { width: 52, height: 52, borderRadius: 16, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  organizerName: { fontSize: 14, fontWeight: '800', color: DARK, marginBottom: 4 },
  verifiedRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:  { fontSize: 12, color: GREEN, fontWeight: '600' },
  contactBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: '#C8EDD8', backgroundColor: GREEN_LIGHT, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  contactBtnText:{ fontSize: 12, color: GREEN, fontWeight: '700' },

  // Footer
  detailFooter:   { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', gap: 12 },
  shareCircleBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: '#C8EDD8', backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  closeBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F4F6F9', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#E8E8E8' },
  closeBtnText:   { fontSize: 15, fontWeight: '700', color: '#555' },
});