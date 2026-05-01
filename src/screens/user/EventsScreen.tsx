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

// Format "2026-05-25" → "May 25, 2026"
const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
};

// ── Cricket placeholder (shown when no banner image uploaded) ──────────────
const CricketPlaceholder = ({ style }: { style: any }) => (
  <View style={[style, { backgroundColor: CRICKET_BG, alignItems: 'center', justifyContent: 'center' }]}>
    <Icon name="baseball-outline" size={style?.height ? style.height / 3 : 38} color="rgba(255,255,255,0.25)" />
  </View>
);

// ── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ date }: { date?: string }) => {
  const isPast = date ? new Date(date) < new Date() : false;
  const label  = isPast ? 'Past' : 'Upcoming';
  const color  = isPast ? '#888' : GREEN;
  const bg     = isPast ? '#F0F0F0' : GREEN_LIGHT;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════
const EventsScreen = () => {
  const dispatch = useDispatch<any>();
  const insets   = useSafeAreaInsets();
  const events   = useSelector((state: RootState) => state.event.events);
  const [selected,   setSelected]   = useState<Event | null>(null);
  const [search,     setSearch]     = useState('');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  // ── Real-time ────────────────────────────────────────────────
  useEffect(() => {
    (async () => { try { dispatch(setEvents(await getEvents())); } catch {} })();

    const onCreate = (e: Event)              => dispatch(addEvent(e));
    const onUpdate = (e: Event)              => { dispatch(updateEvent(e)); setSelected(s => s?._id === e._id ? e : s); };
    const onDelete = (id: string)            => { dispatch(deleteEvent(id)); setSelected(s => s?._id === id ? null : s); };

    socket.on('eventCreated', onCreate);
    socket.on('eventUpdated', onUpdate);
    socket.on('eventDeleted', onDelete);
    return () => {
      socket.off('eventCreated', onCreate);
      socket.off('eventUpdated', onUpdate);
      socket.off('eventDeleted', onDelete);
    };
  }, []);

  // ── Filter by search only ────────────────────────────────────
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
      await Share.share({
        title:   e.title,
        message: `${e.title}\n${e.description ?? ''}\nDate: ${formatDate(e.date)}`,
      });
    } catch {}
  };

  // ── Card ─────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: Event }) => {
    const isBookmarked = bookmarked.has(item._id);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setSelected(item)}>

        {/* Left image */}
        <View style={styles.cardImageWrap}>
          {item.banner ? (
            <Image
              source={{ uri: `${MEDIA_URL}/uploads/events/${item.banner}` }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <CricketPlaceholder style={styles.cardImage} />
          )}
          <StatusBadge date={item.date} />
        </View>

        {/* Right body */}
        <View style={styles.cardBody}>
          <TouchableOpacity style={styles.bookmarkBtn} onPress={() => toggleBookmark(item._id)}>
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
              <Text style={styles.cardMetaText}>{item.location}</Text>
            </View>
          )}

          <View style={styles.cardMeta}>
            <Icon name="baseball-outline" size={12} color="#888" />
            <Text style={styles.cardMetaText}>Cricket</Text>
          </View>

          <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => setSelected(item)}>
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
            <Icon name="chevron-forward" size={12} color={GREEN} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Detail Modal ──────────────────────────────────────────────
  const DetailModal = () => {
    if (!selected) return null;
    const isBookmarked = bookmarked.has(selected._id);

    return (
      <Modal visible animationType="slide" transparent={false} onRequestClose={() => setSelected(null)}>
        <View style={styles.detailRoot}>
          <StatusBar barStyle="light-content" />

          {/* Banner */}
          <View style={styles.detailBanner}>
            {selected.banner ? (
              <Image
                source={{ uri: `${MEDIA_URL}/uploads/events/${selected.banner}` }}
                style={styles.detailBannerFill}
                resizeMode="cover"
              />
            ) : (
              <CricketPlaceholder style={styles.detailBannerFill} />
            )}

            {/* Dark overlay */}
            <View style={styles.detailBannerOverlay} />

            {/* Top bar */}
            <View style={[styles.detailTopBar, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={styles.detailBackBtn} onPress={() => setSelected(null)}>
                <Icon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.detailTopRight}>
                <TouchableOpacity style={styles.detailIconBtn} onPress={() => toggleBookmark(selected._id)}>
                  <Icon name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailIconBtn} onPress={() => handleShare(selected)}>
                  <Icon name="share-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status */}
            <View style={styles.detailStatusRow}>
              <StatusBadge date={selected.date} />
            </View>

            {/* Title on banner */}
            <View style={styles.detailBannerText}>
              <Text style={styles.detailBannerTitle}>{selected.title}</Text>
              {!!selected.location && (
                <View style={styles.detailLocationRow}>
                  <Icon name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.detailLocationText}>{selected.location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Scrollable content */}
          <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

            {/* Stats row */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Icon name="calendar-outline" size={20} color={GREEN} />
                <Text style={styles.statValue}>{formatDate(selected.date) || '—'}</Text>
                <Text style={styles.statLabel}>Date</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="baseball-outline" size={20} color={GREEN} />
                <Text style={styles.statValue}>Cricket</Text>
                <Text style={styles.statLabel}>Sport</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="cash-outline" size={20} color={GREEN} />
                <Text style={styles.statValue}>
                  {selected.entryFee > 0 ? `Rs. ${selected.entryFee}` : 'Free'}
                </Text>
                <Text style={styles.statLabel}>Entry</Text>
              </View>
            </View>

            {/* About */}
            {!!selected.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Event</Text>
                <Text style={styles.sectionText}>{selected.description}</Text>
              </View>
            )}

            {/* Event Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Details</Text>

              {!!selected.date && (
                <View style={styles.detailRow}>
                  <View style={[styles.detailRowIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="calendar-outline" size={16} color="#F59E0B" />
                  </View>
                  <View style={styles.detailRowText}>
                    <Text style={styles.detailRowLabel}>Date</Text>
                    <Text style={styles.detailRowValue}>{formatDate(selected.date)}</Text>
                  </View>
                </View>
              )}

              {!!selected.location && (
                <View style={styles.detailRow}>
                  <View style={[styles.detailRowIcon, { backgroundColor: GREEN_LIGHT }]}>
                    <Icon name="location-outline" size={16} color={GREEN} />
                  </View>
                  <View style={styles.detailRowText}>
                    <Text style={styles.detailRowLabel}>Venue</Text>
                    <Text style={styles.detailRowValue}>{selected.location}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={[styles.detailRowIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Icon name="cash-outline" size={16} color="#7C3AED" />
                </View>
                <View style={styles.detailRowText}>
                  <Text style={styles.detailRowLabel}>Entry Fee</Text>
                  <Text style={styles.detailRowValue}>
                    {selected.entryFee > 0 ? `Rs. ${selected.entryFee}` : 'Free Entry'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Organizer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organized By</Text>
              <View style={styles.organizerRow}>
                <View style={styles.organizerLogo}>
                  <Icon name="shield-checkmark" size={22} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.organizerName}>Green Field Cricket Club</Text>
                  <View style={styles.verifiedRow}>
                    <Icon name="checkmark-circle" size={13} color={GREEN} />
                    <Text style={styles.verifiedText}>Official organizer</Text>
                  </View>
                </View>
              </View>
            </View>

          </ScrollView>

          {/* Bottom share button */}
          <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(selected)}>
              <Icon name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share Event</Text>
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
        <View style={styles.notifBtn}>
          <Icon name="notifications-outline" size={22} color={DARK} />
          <View style={styles.notifDot} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={17} color="#AAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#BBB"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={17} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderText}>All Events</Text>
        <Text style={styles.listHeaderCount}>{filtered.length} events</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="baseball-outline" size={38} color={GREEN} />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>
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
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 12, color: '#999', marginTop: 2 },
  notifBtn:    { position: 'relative', marginTop: 4 },
  notifDot:    { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBar:  { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: DARK, padding: 0 },

  // List header
  listHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  listHeaderText: { fontSize: 16, fontWeight: '800', color: DARK },
  listHeaderCount:{ fontSize: 13, color: '#999', fontWeight: '500' },

  // List
  list: { paddingHorizontal: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row',
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  cardImageWrap: { width: 110, alignSelf: 'stretch' },
  cardImage:     { width: 110, height: '100%', minHeight: 130 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  cardBody:           { flex: 1, padding: 12 },
  bookmarkBtn:        { position: 'absolute', top: 10, right: 10 },
  cardTitle:          { fontSize: 14, fontWeight: '800', color: DARK, marginBottom: 6, paddingRight: 24, lineHeight: 19 },
  cardMeta:           { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  cardMetaText:       { fontSize: 12, color: '#666' },
  viewDetailsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  viewDetailsBtnText: { fontSize: 12, color: GREEN, fontWeight: '700' },

  // Empty
  empty:         { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontSize: 17, color: '#AAA', fontWeight: '700' },
  emptySubtitle: { fontSize: 13, color: '#CCC', textAlign: 'center', paddingHorizontal: 40 },

  // ── Detail Modal ─────────────────────────────────────────────
  detailRoot:   { flex: 1, backgroundColor: '#F6F7FB' },

  detailBanner:        { height: 280, position: 'relative' },
  detailBannerFill:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  detailBannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },

  detailTopBar:   { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  detailBackBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  detailTopRight: { flexDirection: 'row', gap: 10 },
  detailIconBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },

  detailStatusRow:    { position: 'absolute', top: 110, left: 16 },
  detailBannerText:   { position: 'absolute', bottom: 20, left: 16, right: 16 },
  detailBannerTitle:  { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  detailLocationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  detailLocationText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  detailScroll: { flex: 1 },

  // Stats card
  statsCard:  { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -22, borderRadius: 16, padding: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.09, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
  statItem:   { flex: 1, alignItems: 'center', gap: 5 },
  statValue:  { fontSize: 12, fontWeight: '700', color: DARK, textAlign: 'center' },
  statLabel:  { fontSize: 10, color: '#AAA', fontWeight: '500' },
  statDivider:{ width: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },

  // Sections
  section:      { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 14 },
  sectionText:  { fontSize: 14, color: '#555', lineHeight: 22 },

  // Detail rows
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailRowIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailRowText:  { flex: 1 },
  detailRowLabel: { fontSize: 11, color: '#AAA', fontWeight: '500' },
  detailRowValue: { fontSize: 14, color: DARK, fontWeight: '700', marginTop: 2 },

  // Organizer
  organizerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  organizerName: { fontSize: 15, fontWeight: '800', color: DARK },
  verifiedRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  verifiedText:  { fontSize: 12, color: GREEN, fontWeight: '600' },

  // Footer
  detailFooter: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  shareBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14 },
  shareBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});