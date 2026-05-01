import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView,
  Dimensions, Platform, KeyboardAvoidingView, SectionList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { approveBooking, rejectBooking, getBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const BASE = 'http://192.168.100.4:5000/uploads/';
const { width: SW } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────
const C = {
  green:       '#0A8F3C',
  greenLight:  '#E8F5EE',
  amber:       '#F59E0B',
  amberLight:  '#FFF8E8',
  red:         '#EF4444',
  redLight:    '#FEF2F2',
  indigo:      '#6366F1',
  indigoLight: '#EEF2FF',
  bg:          '#F2F4F7',
  card:        '#FFFFFF',
  border:      '#E8EBF0',
  text:        '#111827',
  sub:         '#6B7280',
  muted:       '#9CA3AF',
  ph:          '#C5CAD3',
};

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: C.amber, bg: C.amberLight, label: 'Pending'  },
  approved: { color: C.green, bg: C.greenLight,  label: 'Approved' },
  rejected: { color: C.red,   bg: C.redLight,    label: 'Rejected' },
};

// ─── Helpers ──────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const addDays = (base: string, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const getWeekRange = () => {
  const t   = new Date();
  const day = t.getDay();
  const mon = new Date(t); mon.setDate(t.getDate() - day + (day === 0 ? -6 : 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] };
};

const getMonthRange = () => {
  const t = new Date();
  const y = t.getFullYear(); const m = t.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const end   = new Date(y, m + 1, 0).toISOString().split('T')[0];
  return { start, end };
};

const fmt = (ds: string) => {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  return `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1]} ${y}`;
};

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const getDaysInMonth    = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

// date in range (inclusive)
const inRange = (date: string, start: string, end: string) => date >= start && date <= end;

// ─── Calendar ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const MiniCalendar = ({ selected, onSelect, onClose }: { selected: string; onSelect: (d: string) => void; onClose: () => void }) => {
  const [vy, setVy] = useState(() => +selected.split('-')[0]);
  const [vm, setVm] = useState(() => +selected.split('-')[1] - 1);
  const prev = () => vm === 0  ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1);
  const next = () => vm === 11 ? (setVm(0),  setVy(y => y + 1)) : setVm(m => m + 1);
  const days = getDaysInMonth(vy, vm);
  const first = getFirstDayOfMonth(vy, vm);
  const cells: (number|null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const mk  = (d: number) => `${vy}-${String(vm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const cw  = (SW - 48 - 32) / 7;

  return (
    <View style={calS.box}>
      <View style={calS.hdr}>
        <TouchableOpacity style={calS.nav} onPress={prev}><Icon name="chevron-back" size={14} color={C.text} /></TouchableOpacity>
        <Text style={calS.month}>{MONTHS[vm]} {vy}</Text>
        <TouchableOpacity style={calS.nav} onPress={next}><Icon name="chevron-forward" size={14} color={C.text} /></TouchableOpacity>
      </View>
      <View style={calS.row}>
        {DAYS.map(d => <Text key={d} style={[calS.dayLbl, { width: cw }]}>{d}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }).map((_, ri) => (
        <View key={ri} style={calS.row}>
          {cells.slice(ri*7, ri*7+7).map((d, ci) => {
            if (!d) return <View key={ci} style={[calS.cell, { width: cw }]} />;
            const str = mk(d); const isSel = str === selected; const isTod = str === todayStr();
            return (
              <TouchableOpacity key={ci} style={[calS.cell, { width: cw }, isSel && calS.selCell, isTod && !isSel && calS.todCell]} onPress={() => { onSelect(str); onClose(); }}>
                <Text style={[calS.cellTxt, isSel && calS.selTxt, isTod && !isSel && calS.todTxt]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <TouchableOpacity style={calS.todBtn} onPress={() => { onSelect(todayStr()); onClose(); }}>
        <Icon name="today-outline" size={12} color={C.green} />
        <Text style={calS.todBtnTxt}>Jump to Today</Text>
      </TouchableOpacity>
    </View>
  );
};

const calS = StyleSheet.create({
  box:      { backgroundColor: C.card, borderRadius: 20, padding: 16, marginHorizontal: 16, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
  hdr:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nav:      { width: 30, height: 30, borderRadius: 9, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  month:    { fontSize: 14, fontWeight: '800', color: C.text },
  row:      { flexDirection: 'row', marginBottom: 2 },
  dayLbl:   { textAlign: 'center', fontSize: 10, fontWeight: '700', color: C.muted, paddingVertical: 3 },
  cell:     { height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellTxt:  { fontSize: 12, color: C.text },
  selCell:  { backgroundColor: C.green },
  selTxt:   { color: '#fff', fontWeight: '800' },
  todCell:  { backgroundColor: C.greenLight },
  todTxt:   { color: C.green, fontWeight: '700' },
  todBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  todBtnTxt:{ color: C.green, fontWeight: '700', fontSize: 12 },
});

// ─── Reject Modal ─────────────────────────────────────────────────────
const RejectModal = ({ visible, onClose, onConfirm, loading }: { visible: boolean; onClose: () => void; onConfirm: (n: string) => void; loading: boolean }) => {
  const [note, setNote] = useState('');
  const confirm = () => { onConfirm(note.trim()); setNote(''); };
  const close   = () => { setNote(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={rej.backdrop} activeOpacity={1} onPress={close} />
        <View style={rej.sheet}>
          <View style={rej.pill} />
          <View style={rej.topRow}>
            <View style={rej.redDot}><Icon name="close" size={16} color="#fff" /></View>
            <View>
              <Text style={rej.title}>Reject Booking</Text>
              <Text style={rej.sub}>Add a reason (optional)</Text>
            </View>
          </View>
          <TextInput
            style={rej.input}
            placeholder="e.g. Payment unclear, slot conflict..."
            placeholderTextColor={C.ph}
            multiline numberOfLines={3}
            value={note} onChangeText={setNote}
            textAlignVertical="top"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['Payment unclear','Slot conflict','Incomplete info','Double booking','Other'].map(r => (
              <TouchableOpacity key={r} style={[rej.chip, note===r && rej.chipOn]} onPress={() => setNote(r)}>
                <Text style={[rej.chipTxt, note===r && rej.chipTxtOn]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={rej.btns}>
            <TouchableOpacity style={rej.cancel} onPress={close}><Text style={rej.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={rej.confirm} onPress={confirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={rej.confirmTxt}>Reject Booking</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const rej = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:    { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  pill:     { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  redDot:   { width: 40, height: 40, borderRadius: 20, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 15, fontWeight: '800', color: C.text },
  sub:      { fontSize: 11, color: C.sub, marginTop: 1 },
  input:    { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 12, fontSize: 13, color: C.text, minHeight: 72, backgroundColor: C.bg, marginBottom: 12 },
  chip:     { backgroundColor: C.bg, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 7, borderWidth: 1.5, borderColor: C.border },
  chipOn:   { backgroundColor: C.redLight, borderColor: C.red },
  chipTxt:  { fontSize: 11, color: C.sub, fontWeight: '500' },
  chipTxtOn:{ color: C.red, fontWeight: '700' },
  btns:     { flexDirection: 'row', gap: 10 },
  cancel:   { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelTxt:{ color: C.sub, fontWeight: '700', fontSize: 13 },
  confirm:  { flex: 2, padding: 13, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  confirmTxt:{ color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ─── Detail Modal ─────────────────────────────────────────────────────
const DetailModal = ({ booking, onClose, onApprove, onReject, actionLoading }: {
  booking: any; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string) => void; actionLoading: boolean;
}) => {
  const [imgPreview, setImgPreview] = useState('');
  if (!booking) return null;
  const st    = STATUS[booking.status] || STATUS.pending;
  const imgUri = booking.paymentScreenshot ? BASE + booking.paymentScreenshot : null;

  return (
    <Modal visible={!!booking} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={det.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={det.sheet}>
          <View style={det.pill} />
          {/* Header */}
          <View style={det.hdr}>
            <Text style={det.title}>Booking Details</Text>
            <TouchableOpacity style={det.xBtn} onPress={onClose}><Icon name="close" size={14} color={C.sub} /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* User hero */}
            <View style={[det.hero, { backgroundColor: st.bg }]}>
              <View style={[det.avatar, { backgroundColor: st.color }]}>
                <Text style={det.avatarTxt}>{booking.userName?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={det.name}>{booking.userName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Icon name="call-outline" size={11} color={C.sub} />
                  <Text style={det.phone}>{booking.phone}</Text>
                </View>
              </View>
              <View style={[det.sBadge, { backgroundColor: st.color }]}>
                <Text style={det.sBadgeTxt}>{st.label}</Text>
              </View>
            </View>

            {/* Info grid — 2x2 */}
            <View style={det.grid}>
              {[
                { icon: 'calendar-outline',  label: 'Date',     value: fmt(booking.date) },
                { icon: 'time-outline',      label: 'Slot',     value: booking.slotTime },
                { icon: 'hourglass-outline', label: 'Duration', value: `${booking.duration} Hr` },
                { icon: 'people-outline',    label: 'Players',  value: `${booking.numberOfPlayers}` },
              ].map(({ icon, label, value }) => (
                <View key={label} style={det.cell}>
                  <Icon name={icon as any} size={14} color={C.green} />
                  <Text style={det.cellLbl}>{label}</Text>
                  <Text style={det.cellVal}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Amount */}
            <View style={det.amtRow}>
              <Text style={det.amtLbl}>Total Amount</Text>
              <Text style={det.amtVal}>₨ {Number(booking.totalAmount).toLocaleString()}</Text>
            </View>

            {/* Booked at */}
            <View style={det.infoRow}>
              <View style={det.infoIcon}><Icon name="time-outline" size={12} color={C.green} /></View>
              <Text style={det.infoLbl}>Booked at</Text>
              <Text style={det.infoVal}>{fmtTime(booking.createdAt)}</Text>
            </View>

            {/* Customer note */}
            {!!booking.notes && (
              <View style={det.infoRow}>
                <View style={det.infoIcon}><Icon name="document-text-outline" size={12} color={C.green} /></View>
                <Text style={det.infoLbl}>Note</Text>
                <Text style={[det.infoVal, { flex: 1 }]}>{booking.notes}</Text>
              </View>
            )}

            {/* Rejection note */}
            {booking.status === 'rejected' && !!booking.rejectionNote && (
              <View style={det.rejCard}>
                <Icon name="alert-circle-outline" size={13} color={C.red} />
                <Text style={det.rejTxt}>{booking.rejectionNote}</Text>
              </View>
            )}

            {/* Screenshot */}
            {imgUri ? (
              <TouchableOpacity style={det.imgWrap} onPress={() => setImgPreview(imgUri)} activeOpacity={0.88}>
                <Image source={{ uri: imgUri }} style={det.thumb} resizeMode="cover" />
                <View style={det.thumbOverlay}>
                  <Icon name="expand-outline" size={15} color="#fff" />
                  <Text style={det.thumbTxt}>View Screenshot</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={det.noImg}>
                <Icon name="image-outline" size={18} color={C.ph} />
                <Text style={det.noImgTxt}>No payment screenshot</Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          {booking.status === 'pending' && (
            <View style={det.actions}>
              <TouchableOpacity style={det.rejectBtn} onPress={() => onReject(booking._id)} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color={C.red} /> : <><Icon name="close-circle-outline" size={14} color={C.red} /><Text style={det.rejectTxt}>Reject</Text></>}
              </TouchableOpacity>
              <TouchableOpacity style={det.approveBtn} onPress={() => onApprove(booking._id)} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="checkmark-circle-outline" size={14} color="#fff" /><Text style={det.approveTxt}>Approve</Text></>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Full image */}
        <Modal visible={!!imgPreview} transparent animationType="fade">
          <View style={g.imgOverlay}>
            <TouchableOpacity style={g.imgClose} onPress={() => setImgPreview('')}>
              <Icon name="close-circle" size={30} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: imgPreview }} style={g.imgFull} resizeMode="contain" />
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const det = StyleSheet.create({
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '90%' },
  pill:        { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  hdr:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title:       { fontSize: 15, fontWeight: '800', color: C.text },
  xBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  hero:        { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, marginBottom: 12 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 17, fontWeight: '800', color: '#fff' },
  name:        { fontSize: 15, fontWeight: '800', color: C.text },
  phone:       { fontSize: 11, color: C.sub },
  sBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  sBadgeTxt:   { color: '#fff', fontSize: 10, fontWeight: '800' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  cell:        { width: (SW - 36 - 8 - 18*2) / 2, backgroundColor: C.bg, borderRadius: 12, padding: 10, alignItems: 'center', gap: 3 },
  cellLbl:     { fontSize: 9, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cellVal:     { fontSize: 13, fontWeight: '800', color: C.text },
  amtRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.greenLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  amtLbl:      { fontSize: 12, color: C.sub },
  amtVal:      { fontSize: 20, fontWeight: '800', color: C.green },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoIcon:    { width: 26, height: 26, borderRadius: 8, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },
  infoLbl:     { fontSize: 11, color: C.muted, width: 60 },
  infoVal:     { fontSize: 12, color: C.text, fontWeight: '600' },
  rejCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.redLight, borderRadius: 10, padding: 10, marginTop: 8 },
  rejTxt:      { flex: 1, fontSize: 12, color: '#7F1D1D', lineHeight: 17 },
  imgWrap:     { borderRadius: 12, overflow: 'hidden', height: 130, marginTop: 10 },
  thumb:       { width: '100%', height: '100%' },
  thumbOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thumbTxt:    { color: '#fff', fontWeight: '700', fontSize: 12 },
  noImg:       { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.bg, borderRadius: 10, padding: 12, marginTop: 10 },
  noImgTxt:    { color: C.muted, fontSize: 12 },
  actions:     { flexDirection: 'row', gap: 8, marginTop: 14 },
  rejectBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.red },
  rejectTxt:   { color: C.red, fontWeight: '800', fontSize: 13 },
  approveBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 12, borderRadius: 12, backgroundColor: C.green },
  approveTxt:  { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ─── Compact Booking Card ─────────────────────────────────────────────
const BookingCard = ({ item, onPress, onApprove, onReject, actionId }: any) => {
  const st   = STATUS[item.status] || STATUS.pending;
  const init = item.userName?.charAt(0)?.toUpperCase() || '?';
  const busy = actionId === item._id;

  return (
    <TouchableOpacity style={bc.card} onPress={onPress} activeOpacity={0.86}>
      {/* Left color bar */}
      <View style={[bc.bar, { backgroundColor: st.color }]} />

      <View style={bc.body}>
        {/* Top row */}
        <View style={bc.top}>
          <View style={[bc.avatar, { backgroundColor: st.color + '20' }]}>
            <Text style={[bc.avatarTxt, { color: st.color }]}>{init}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={bc.name} numberOfLines={1}>{item.userName}</Text>
            <Text style={bc.phone}>{item.phone}</Text>
          </View>
          <View style={[bc.badge, { backgroundColor: st.bg }]}>
            <View style={[bc.dot, { backgroundColor: st.color }]} />
            <Text style={[bc.badgeTxt, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Middle chips row */}
        <View style={bc.chips}>
          <View style={bc.chip}><Icon name="time-outline" size={10} color={C.green} /><Text style={bc.chipTxt}>{item.slotTime}</Text></View>
          <View style={bc.chip}><Icon name="hourglass-outline" size={10} color={C.green} /><Text style={bc.chipTxt}>{item.duration}h</Text></View>
          <View style={bc.chip}><Icon name="people-outline" size={10} color={C.green} /><Text style={bc.chipTxt}>{item.numberOfPlayers}p</Text></View>
        </View>

        {/* Bottom row — amount + hint/note */}
        <View style={bc.bottom}>
          <Text style={bc.amt}>₨ {Number(item.totalAmount).toLocaleString()}</Text>
          {item.status === 'rejected' && !!item.rejectionNote
            ? <Text style={bc.rejTxt} numberOfLines={1}>{item.rejectionNote}</Text>
            : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={bc.hint}>Details</Text>
                <Icon name="chevron-forward" size={10} color={C.muted} />
              </View>
          }
        </View>

        {/* Actions — pending only */}
        {item.status === 'pending' && (
          <View style={bc.actions}>
            <TouchableOpacity style={bc.rejectBtn} onPress={() => onReject(item._id)} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color={C.red} /> : <><Icon name="close-circle-outline" size={12} color={C.red} /><Text style={bc.rejectTxt}>Reject</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={bc.approveBtn} onPress={() => onApprove(item._id)} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="checkmark-circle-outline" size={12} color="#fff" /><Text style={bc.approveTxt}>Approve</Text></>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const bc = StyleSheet.create({
  card:       { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, marginBottom: 8, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  bar:        { width: 3 },
  body:       { flex: 1, padding: 11, gap: 7 },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 14, fontWeight: '800' },
  name:       { fontSize: 13, fontWeight: '700', color: C.text },
  phone:      { fontSize: 11, color: C.sub },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 },
  dot:        { width: 4, height: 4, borderRadius: 2 },
  badgeTxt:   { fontSize: 9, fontWeight: '800' },
  chips:      { flexDirection: 'row', gap: 5 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 },
  chipTxt:    { fontSize: 10, color: C.green, fontWeight: '600' },
  bottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  amt:        { fontSize: 14, fontWeight: '800', color: C.green },
  rejTxt:     { fontSize: 10, color: C.red, flex: 1, marginLeft: 8 },
  hint:       { fontSize: 10, color: C.muted },
  actions:    { flexDirection: 'row', gap: 7 },
  rejectBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.red },
  rejectTxt:  { color: C.red, fontWeight: '700', fontSize: 11 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: C.green },
  approveTxt: { color: '#fff', fontWeight: '700', fontSize: 11 },
});

// ─── Date range mode types ────────────────────────────────────────────
type DateMode = 'today' | 'week' | 'month' | 'custom';

// ─── Main Screen ──────────────────────────────────────────────────────
const AdminBookingsScreen = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state: RootState) => state.booking.bookings);

  const [loading, setLoading]                 = useState(false);
  const [actionId, setActionId]               = useState('');
  const [statusFilter, setStatusFilter]       = useState<'all'|'pending'|'approved'|'rejected'>('all');
  const [dateMode, setDateMode]               = useState<DateMode>('today');
  const [customDate, setCustomDate]           = useState(todayStr());
  const [showCalendar, setShowCalendar]       = useState(false);
  const [searchText, setSearchText]           = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId]   = useState('');

  // Derive the actual date(s) being queried
  const getApiDate = (): string | undefined => {
    if (dateMode === 'today')  return todayStr();
    if (dateMode === 'custom') return customDate;
    return undefined; // week/month — fetch all, filter client-side
  };

  useEffect(() => {
    loadBookings();
    socket.on('bookingCreated', (b: any) => dispatch(addBooking(b)));
    socket.on('bookingUpdated', (b: any) => {
      dispatch(updateBooking(b));
      setSelectedBooking((prev: any) => prev?._id === b._id ? b : prev);
    });
    return () => { socket.off('bookingCreated'); socket.off('bookingUpdated'); };
  }, []);

  useEffect(() => { loadBookings(); }, [dateMode, customDate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const apiDate = getApiDate();
      const data    = await getBookings(apiDate);
      dispatch(setBookings(data));
    } catch {}
    finally { setLoading(false); }
  };

  // Client-side date range filter for week/month
  const dateFiltered = bookings.filter(b => {
    if (dateMode === 'today' || dateMode === 'custom') return true; // server already filtered
    if (dateMode === 'week') { const r = getWeekRange(); return inRange(b.date, r.start, r.end); }
    if (dateMode === 'month') { const r = getMonthRange(); return inRange(b.date, r.start, r.end); }
    return true;
  });

  // Status + search filter
  const filtered = dateFiltered.filter(b => {
    const okStatus = statusFilter === 'all' || b.status === statusFilter;
    const okSearch = !searchText.trim() ||
      b.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      b.phone.includes(searchText);
    return okStatus && okSearch;
  });

  const counts = {
    all:      dateFiltered.length,
    pending:  dateFiltered.filter(b => b.status === 'pending').length,
    approved: dateFiltered.filter(b => b.status === 'approved').length,
    rejected: dateFiltered.filter(b => b.status === 'rejected').length,
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try { await approveBooking(id); setSelectedBooking(null); }
    catch { Alert.alert('Error', 'Failed to approve'); }
    finally { setActionId(''); }
  };

  const handleRejectPress = (id: string) => { setRejectTargetId(id); setShowRejectModal(true); };

  const handleRejectConfirm = async (note: string) => {
    setActionId(rejectTargetId);
    try {
      await rejectBooking(rejectTargetId, note);
      setShowRejectModal(false); setRejectTargetId(''); setSelectedBooking(null);
    } catch { Alert.alert('Error', 'Failed to reject'); }
    finally { setActionId(''); }
  };

  // Date mode label
  const dateModeLabel = () => {
    if (dateMode === 'today') return 'Today';
    if (dateMode === 'week') { const r = getWeekRange(); return `${fmt(r.start)} – ${fmt(r.end)}`; }
    if (dateMode === 'month') { const t = new Date(); return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t.getMonth()]} ${t.getFullYear()}`; }
    return fmt(customDate);
  };

  // ── Header component for ScrollView ──
  const ListHeader = () => (
    <>
      {/* ── Summary tiles ── */}
      <View style={g.tilesRow}>
        {([
          { key: 'all',      label: 'Total',    color: C.indigo, bg: C.indigoLight, icon: 'layers-outline' },
          { key: 'pending',  label: 'Pending',  color: C.amber,  bg: C.amberLight,  icon: 'time-outline' },
          { key: 'approved', label: 'Approved', color: C.green,  bg: C.greenLight,  icon: 'checkmark-circle-outline' },
          { key: 'rejected', label: 'Rejected', color: C.red,    bg: C.redLight,    icon: 'close-circle-outline' },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[g.tile, { borderColor: statusFilter === t.key ? t.color : C.border, borderWidth: statusFilter === t.key ? 2 : 1 }]}
            onPress={() => setStatusFilter(t.key)}
            activeOpacity={0.8}
          >
            <View style={[g.tileIcon, { backgroundColor: t.bg }]}>
              <Icon name={t.icon} size={14} color={t.color} />
            </View>
            <Text style={[g.tileCount, { color: t.color }]}>{counts[t.key]}</Text>
            <Text style={g.tileLbl} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Date mode pills ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={g.modePillsScroll} contentContainerStyle={g.modePillsContent}>
        {([
          { key: 'today',  label: 'Today',      icon: 'today-outline' },
          { key: 'week',   label: 'This Week',   icon: 'calendar-outline' },
          { key: 'month',  label: 'This Month',  icon: 'calendar-clear-outline' },
          { key: 'custom', label: 'Pick Date',   icon: 'search-outline' },
        ] as const).map(p => (
          <TouchableOpacity
            key={p.key}
            style={[g.modePill, dateMode === p.key && g.modePillActive]}
            onPress={() => {
              setDateMode(p.key);
              if (p.key === 'custom') setShowCalendar(true);
            }}
          >
            <Icon name={p.icon} size={11} color={dateMode === p.key ? '#fff' : C.sub} />
            <Text style={[g.modePillTxt, dateMode === p.key && g.modePillTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom date display */}
      {dateMode === 'custom' && (
        <TouchableOpacity style={g.customDateRow} onPress={() => setShowCalendar(true)}>
          <Icon name="calendar-outline" size={13} color={C.green} />
          <Text style={g.customDateTxt}>{fmt(customDate)}</Text>
          <Icon name="chevron-down" size={12} color={C.muted} />
        </TouchableOpacity>
      )}

      {/* ── Search ── */}
      <View style={g.searchBox}>
        <Icon name="search-outline" size={14} color={C.muted} />
        <TextInput
          style={g.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={C.ph}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {!!searchText && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={14} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Results info ── */}
      <View style={g.resultsRow}>
        <Text style={g.resultsTxt}>
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''} · {dateModeLabel()}
        </Text>
        {statusFilter !== 'all' && (
          <TouchableOpacity onPress={() => setStatusFilter('all')}>
            <Text style={g.clearTxt}>Clear filter ✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <View style={g.root}>
      {/* ── Fixed header ── */}
      <View style={g.header}>
        <View>
          <Text style={g.headerTitle}>Bookings</Text>
          <Text style={g.headerSub}>{dateModeLabel()}</Text>
        </View>
        <TouchableOpacity style={g.refreshBtn} onPress={loadBookings}>
          <Icon name="refresh-outline" size={16} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* ── Full-screen scroll ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={C.green} size="large" />
      ) : (
        <SectionList
          sections={[{ title: 'bookings', data: filtered }]}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={g.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={<ListHeader />}
          renderSectionHeader={() => null}
          ListEmptyComponent={() => (
            <View style={g.empty}>
              <View style={g.emptyIcon}><Icon name="calendar-outline" size={30} color={C.muted} /></View>
              <Text style={g.emptyTitle}>No bookings found</Text>
              <Text style={g.emptySub}>
                {searchText ? `No results for "${searchText}"` : `No ${statusFilter !== 'all' ? statusFilter + ' ' : ''}bookings · ${dateModeLabel()}`}
              </Text>
            </View>
          )}
          renderItem={({ item }: any) => (
            <BookingCard
              item={item}
              onPress={() => setSelectedBooking(item)}
              onApprove={handleApprove}
              onReject={handleRejectPress}
              actionId={actionId}
            />
          )}
        />
      )}

      {/* ── Calendar Modal ── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <MiniCalendar
              selected={customDate}
              onSelect={(d) => { setCustomDate(d); setDateMode('custom'); }}
              onClose={() => setShowCalendar(false)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Detail Modal ── */}
      <DetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onApprove={handleApprove}
        onReject={(id: string) => { setSelectedBooking(null); handleRejectPress(id); }}
        actionLoading={!!actionId}
      />

      {/* ── Reject Modal ── */}
      <RejectModal
        visible={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectTargetId(''); }}
        onConfirm={handleRejectConfirm}
        loading={!!actionId}
      />
    </View>
  );
};

export default AdminBookingsScreen;

// ─── Global Styles ────────────────────────────────────────────────────
const g = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 18, paddingBottom: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: C.sub, marginTop: 1 },
  refreshBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' },

  // ── Summary tiles ──
  tilesRow:     { flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  tile:         { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
  tileIcon:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tileCount:    { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  tileLbl:      { fontSize: 9, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 },

  // ── Date mode pills ──
  modePillsScroll:   { marginTop: 10 },
  modePillsContent:  { paddingHorizontal: 14, gap: 7 },
  modePill:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  modePillActive:    { backgroundColor: C.green, borderColor: C.green },
  modePillTxt:       { fontSize: 12, fontWeight: '600', color: C.sub },
  modePillTxtActive: { color: '#fff' },

  customDateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 14, marginTop: 8, backgroundColor: C.greenLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  customDateTxt: { flex: 1, fontSize: 12, color: C.green, fontWeight: '700' },

  // ── Search ──
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 10, backgroundColor: C.card, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, height: 40 },
  searchInput:  { flex: 1, fontSize: 13, color: C.text },

  // ── Results row ──
  resultsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 },
  resultsTxt:   { fontSize: 11, color: C.muted, fontWeight: '500' },
  clearTxt:     { fontSize: 11, color: C.green, fontWeight: '700' },

  listContent:  { paddingHorizontal: 14, paddingBottom: 36 },

  // ── Empty ──
  empty:        { alignItems: 'center', marginTop: 50, paddingHorizontal: 30 },
  emptyIcon:    { width: 60, height: 60, borderRadius: 30, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: C.border },
  emptyTitle:   { fontSize: 14, fontWeight: '700', color: C.sub },
  emptySub:     { fontSize: 12, color: C.muted, marginTop: 4, textAlign: 'center', lineHeight: 17 },

  // ── Full image ──
  imgOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center' },
  imgClose:     { position: 'absolute', top: 50, right: 16, zIndex: 10 },
  imgFull:      { width: '90%', height: '70%' },
});