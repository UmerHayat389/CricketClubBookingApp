import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const GROUND_IMAGE = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600';

const FEATURES = [
  { icon: 'leaf-outline',       label: 'Turf'          },
  { icon: 'flashlight-outline', label: 'Flood Light'   },
  { icon: 'car-outline',        label: 'Parking'       },
  { icon: 'shirt-outline',      label: 'Changing Room' },
];

const QUICK_STATS = [
  { icon: 'time-outline',     label: 'Hours Open',    value: '6AM–10PM' },
  { icon: 'people-outline',   label: 'Max Players',   value: '22'       },
  { icon: 'cash-outline',     label: 'Per Hour',      value: 'PKR 1,200'},
  { icon: 'star-outline',     label: 'Rating',        value: '4.8 ★'    },
];

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero Image ── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: GROUND_IMAGE }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          {/* Top bar over image */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Welcome back!</Text>
              <Text style={styles.heroAppName}>Cricket Club</Text>
            </View>
            <View style={styles.notifBtn}>
              <Icon name="notifications-outline" size={22} color="#fff" />
            </View>
          </View>

          {/* Ground name over image */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroGroundName}>Green Field Arena</Text>
            <View style={styles.heroLocationRow}>
              <Icon name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroLocation}>Lahore, Punjab</Text>
            </View>
          </View>
        </View>

        {/* ── Features tags ── */}
        <View style={styles.featuresRow}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.featureTag}>
              <Icon name={f.icon} size={14} color="#0A8F3C" />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsGrid}>
          {QUICK_STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Icon name={s.icon} size={20} color="#0A8F3C" />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Book Now Banner ── */}
        <TouchableOpacity
          style={styles.bookBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('BookSlot')}
        >
          <View>
            <Text style={styles.bookBannerTitle}>Ready to play?</Text>
            <Text style={styles.bookBannerSub}>Book your slot in seconds</Text>
          </View>
          <View style={styles.bookBannerBtn}>
            <Icon name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.bookBannerBtnText}>Book Now</Text>
          </View>
        </TouchableOpacity>

        {/* ── About Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Ground</Text>
          <Text style={styles.aboutText}>
            Green Field Arena is a premium cricket facility located in the heart of Lahore.
            With professional turf, floodlights, and ample parking, it's the perfect venue
            for your cricket matches, tournaments, and practice sessions.
          </Text>
        </View>

        {/* ── How It Works ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {[
            { n: '1', t: 'Select a Date & Time',   s: 'Choose your preferred slot from available timings' },
            { n: '2', t: 'Fill Booking Details',    s: 'Enter your name, phone and number of players'       },
            { n: '3', t: 'Make Payment',             s: 'Transfer fee and upload screenshot as proof'        },
            { n: '4', t: 'Get Confirmation',         s: 'Admin approves and your booking is confirmed!'      },
          ].map(step => (
            <View key={step.n} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.t}</Text>
                <Text style={styles.stepSub}>{step.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Floating Book Button ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('BookSlot')}
        activeOpacity={0.88}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },

  // Hero
  heroWrap:    { height: 260, position: 'relative' },
  heroImage:   { width: '100%', height: '100%', resizeMode: 'cover' },
heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.42)' },
  heroTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 24) + 8,
    left: 20, right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroAppName:  { fontSize: 22, color: '#fff', fontWeight: '900' },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroBottom: {
    position: 'absolute',
    bottom: 20, left: 20, right: 20,
  },
  heroGroundName: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroLocationRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Features
  featuresRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  featureTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0FFF6', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#C8EDD8',
  },
  featureLabel: { fontSize: 12, color: '#0A8F3C', fontWeight: '600' },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 12, gap: 10,
  },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 11, color: '#888' },

  // Book Banner
  bookBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0A8F3C', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 18,
    elevation: 4, shadowColor: '#0A8F3C', shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
  bookBannerTitle:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  bookBannerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bookBannerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25 },
  bookBannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Section
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 12 },
  aboutText:    { fontSize: 13, color: '#666', lineHeight: 20 },

  // Steps
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#0A8F3C', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepTitle:   { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  stepSub:     { fontSize: 12, color: '#888', lineHeight: 18 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0A8F3C', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#0A8F3C',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
});