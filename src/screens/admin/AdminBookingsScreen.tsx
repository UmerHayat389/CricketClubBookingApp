import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView,
  Dimensions, Platform, KeyboardAvoidingView, SectionList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../../socket/socket';
import { approveBooking, rejectBooking, getAllBookings } from '../../services/bookingService';
import { setBookings, addBooking, updateBooking } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';

const BASE = 'http://192.168.100.4:5000/uploads/';
const { width: SW } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────
const T = {
  // Brand
  green:      '#0A8F3C',
  greenMid:   '#0D7A34',
  greenLight: '#EBF7F0',
  greenPale:  '#F5FBF7',
  // Status
  amber:      '#D97706',
  amberLight: '#FEF3C7',
  amberPale:  '#FFFBEB',
  red:        '#DC2626',
  redLight:   '#FEE2E2',
  redPale:    '#FFF5F5',
  blue:       '#2563EB',
  blueLight:  '#DBEAFE',
  // Neutrals
  bg:         '#F4F6F9',
  surface:    '#FFFFFF',
  border:     '#E5E9F0',
  borderSoft: '#F0F2F7',
  text:       '#0F172A',
  textSub:    '#64748B',
  textMuted:  '#94A3B8',
  ph:         '#CBD5E1',
};

const STATUS = {
  pending:  { color: T.amber, light: T.amberLight, pale: T.amberPale, label: 'Pending',  icon: 'time-outline'            },
  approved: { color: T.green, light: T.greenLight, pale: T.greenPale, label: 'Approved', icon: 'checkmark-circle-outline' },
  rejected: { color: T.red,   light: T.redLight,   pale: T.redPale,   label: 'Rejected', icon: 'close-circle-outline'    },
};

// ── Helpers ───────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const getWeekRange = () => {
  const t = new Date(), day = t.getDay();
  const mon = new Date(t); mon.setDate(t.getDate() - day + (day === 0 ? -6 : 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] };
};
const getMonthRange = () => {
  const t = new Date(), y = t.getFullYear(), m = t.getMonth();
  return { start: `${y}-${String(m+1).padStart(2,'0')}-01`, end: new Date(y, m+1, 0).toISOString().split('T')[0] };
};
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (ds: string) => {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  return `${d} ${MONTH_SHORT[+m - 1]} ${y}`;
};
const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
};
const inRange = (date: string, s: string, e: string) => date >= s && date <= e;
const getDaysInMonth     = (y: number, m: number) => new Date(y, m+1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── Mini Calendar ─────────────────────────────────────────────────────
const MiniCalendar = ({ selected, onSelect, onClose }: { selected: string; onSelect: (d: string) => void; onClose: () => void }) => {
  const [vy, setVy] = useState(() => +selected.split('-')[0]);
  const [vm, setVm] = useState(() => +selected.split('-')[1] - 1);
  const prev = () => vm === 0  ? (setVm(11), setVy(y => y-1)) : setVm(m => m-1);
  const next = () => vm === 11 ? (setVm(0),  setVy(y => y+1)) : setVm(m => m+1);
  const days = getDaysInMonth(vy, vm), first = getFirstDayOfMonth(vy, vm);
  const cells: (number|null)[] = [...Array(first).fill(null), ...Array.from({length: days}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const mk = (d: number) => `${vy}-${String(vm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const cw = (SW - 48 - 32) / 7;
  return (
    <View style={cal.box}>
      <View style={cal.hdr}>
        <TouchableOpacity style={cal.navBtn} onPress={prev}><Icon name="chevron-back" size={14} color={T.text}/></TouchableOpacity>
        <Text style={cal.monthTxt}>{MONTHS_FULL[vm]} {vy}</Text>
        <TouchableOpacity style={cal.navBtn} onPress={next}><Icon name="chevron-forward" size={14} color={T.text}/></TouchableOpacity>
      </View>
      <View style={cal.weekRow}>
        {DAYS_SHORT.map(d => <Text key={d} style={[cal.weekDay, {width: cw}]}>{d}</Text>)}
      </View>
      {Array.from({length: cells.length/7}).map((_, ri) => (
        <View key={ri} style={cal.weekRow}>
          {cells.slice(ri*7, ri*7+7).map((d, ci) => {
            if (!d) return <View key={ci} style={{width: cw, height: 34}}/>;
            const str = mk(d), isSel = str === selected, isTod = str === todayStr();
            return (
              <TouchableOpacity key={ci} style={[cal.cell, {width: cw}, isSel && cal.selCell, isTod && !isSel && cal.todCell]}
                onPress={() => { onSelect(str); onClose(); }}>
                <Text style={[cal.cellTxt, isSel && cal.selTxt, isTod && !isSel && cal.todTxt]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <TouchableOpacity style={cal.todBtn} onPress={() => { onSelect(todayStr()); onClose(); }}>
        <Icon name="today-outline" size={12} color={T.green}/>
        <Text style={cal.todBtnTxt}>Jump to Today</Text>
      </TouchableOpacity>
    </View>
  );
};
const cal = StyleSheet.create({
  box:      { backgroundColor: T.surface, borderRadius: 20, padding: 16, marginHorizontal: 16, elevation: 20, shadowColor: '#000', shadowOffset: {width:0,height:8}, shadowOpacity: 0.15, shadowRadius: 20 },
  hdr:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn:   { width: 32, height: 32, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  monthTxt: { fontSize: 14, fontWeight: '700', color: T.text },
  weekRow:  { flexDirection: 'row', marginBottom: 2 },
  weekDay:  { textAlign: 'center', fontSize: 10, fontWeight: '700', color: T.textMuted, paddingVertical: 4 },
  cell:     { height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellTxt:  { fontSize: 13, color: T.text },
  selCell:  { backgroundColor: T.green },
  selTxt:   { color: '#fff', fontWeight: '700' },
  todCell:  { backgroundColor: T.greenLight },
  todTxt:   { color: T.green, fontWeight: '700' },
  todBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  todBtnTxt:{ color: T.green, fontWeight: '600', fontSize: 12 },
});

// ── Reject Modal ──────────────────────────────────────────────────────
const RejectModal = ({ visible, onClose, onConfirm, loading }: { visible: boolean; onClose: () => void; onConfirm: (n: string) => void; loading: boolean }) => {
  const [note, setNote] = useState('');
  const QUICK = ['Payment unclear','Slot conflict','Incomplete info','Double booking','Other'];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{flex:1, justifyContent:'flex-end'}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <TouchableOpacity style={rm.backdrop} activeOpacity={1} onPress={() => { setNote(''); onClose(); }}/>
        <View style={rm.sheet}>
          <View style={rm.handle}/>
          {/* Header */}
          <View style={rm.hdrRow}>
            <View style={rm.iconCircle}>
              <Icon name="close-circle" size={20} color={T.red}/>
            </View>
            <View style={{flex:1}}>
              <Text style={rm.title}>Reject Booking</Text>
              <Text style={rm.sub}>Provide a reason to notify the customer</Text>
            </View>
          </View>
          {/* Quick reasons */}
          <Text style={rm.quickLabel}>Quick reasons</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
            {QUICK.map(r => (
              <TouchableOpacity key={r} style={[rm.chip, note===r && rm.chipActive]} onPress={() => setNote(note===r ? '' : r)}>
                <Text style={[rm.chipTxt, note===r && rm.chipTxtActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Text input */}
          <TextInput
            style={rm.input}
            placeholder="Or type a custom reason..."
            placeholderTextColor={T.ph}
            multiline numberOfLines={3}
            value={note} onChangeText={setNote}
            textAlignVertical="top"
          />
          {/* Buttons */}
          <View style={rm.btnRow}>
            <TouchableOpacity style={rm.cancelBtn} onPress={() => { setNote(''); onClose(); }}>
              <Text style={rm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rm.confirmBtn} onPress={() => { onConfirm(note.trim()); setNote(''); }} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><Icon name="close-circle-outline" size={15} color="#fff"/><Text style={rm.confirmTxt}>Reject</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
const rm = StyleSheet.create({
  backdrop:   { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.45)' },
  sheet:      { backgroundColor: T.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Platform.OS==='ios'?40:28 },
  handle:     { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  hdrRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: T.redLight, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 16, fontWeight: '700', color: T.text },
  sub:        { fontSize: 12, color: T.textSub, marginTop: 2 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: T.bg, marginRight: 8, borderWidth: 1.5, borderColor: T.border },
  chipActive: { backgroundColor: T.redLight, borderColor: T.red },
  chipTxt:    { fontSize: 12, color: T.textSub, fontWeight: '500' },
  chipTxtActive:{ color: T.red, fontWeight: '600' },
  input:      { borderWidth: 1.5, borderColor: T.border, borderRadius: 14, padding: 14, fontSize: 13, color: T.text, minHeight: 80, backgroundColor: T.bg, marginBottom: 18 },
  btnRow:     { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: T.border, alignItems: 'center' },
  cancelTxt:  { color: T.textSub, fontWeight: '600', fontSize: 14 },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, backgroundColor: T.red },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ── Detail Modal ──────────────────────────────────────────────────────
const DetailModal = ({ booking, onClose, onApprove, onReject, actionLoading }: {
  booking: any; onClose: () => void; onApprove: (id: string) => void;
  onReject: (id: string) => void; actionLoading: boolean;
}) => {
  const [imgFull, setImgFull] = useState('');
  if (!booking) return null;
  const st     = STATUS[booking.status as keyof typeof STATUS] || STATUS.pending;
  const imgUri = booking.paymentScreenshot ? BASE + booking.paymentScreenshot : null;
  const init   = booking.userName?.charAt(0)?.toUpperCase() || '?';

  return (
    <Modal visible={!!booking} transparent animationType="slide">
      <View style={{flex:1, justifyContent:'flex-end'}}>
        <TouchableOpacity style={dm.backdrop} activeOpacity={1} onPress={onClose}/>
        <View style={dm.sheet}>
          <View style={dm.handle}/>

          {/* ── Modal header ── */}
          <View style={dm.hdr}>
            <Text style={dm.hdrTitle}>Booking Details</Text>
            <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
              <Icon name="close" size={16} color={T.textSub}/>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 12}}>

            {/* ── User row ── */}
            <View style={[dm.userRow, {backgroundColor: st.pale, borderColor: st.light}]}>
              <View style={[dm.avatar, {backgroundColor: st.color}]}>
                <Text style={dm.avatarTxt}>{init}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={dm.userName}>{booking.userName}</Text>
                <View style={dm.phoneRow}>
                  <Icon name="call-outline" size={11} color={T.textMuted}/>
                  <Text style={dm.phoneText}>{booking.phone}</Text>
                </View>
              </View>
              <View style={[dm.statusBadge, {backgroundColor: st.color}]}>
                <Icon name={st.icon as any} size={11} color="#fff"/>
                <Text style={dm.statusBadgeTxt}>{st.label}</Text>
              </View>
            </View>

            {/* ── Info grid 2×2 ── */}
            <View style={dm.grid}>
              {[
                { icon: 'calendar-outline',  label: 'Date',     value: fmt(booking.date)       },
                { icon: 'time-outline',      label: 'Time Slot',value: booking.slotTime         },
                { icon: 'hourglass-outline', label: 'Duration', value: `${booking.duration} Hr` },
                { icon: 'people-outline',    label: 'Players',  value: String(booking.numberOfPlayers) },
              ].map(({ icon, label, value }) => (
                <View key={label} style={dm.gridCell}>
                  <View style={dm.gridIconWrap}>
                    <Icon name={icon as any} size={15} color={T.green}/>
                  </View>
                  <Text style={dm.gridLabel}>{label}</Text>
                  <Text style={dm.gridValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* ── Total amount ── */}
            <View style={dm.amountRow}>
              <Text style={dm.amountLabel}>Total Amount</Text>
              <Text style={dm.amountValue}>PKR {Number(booking.totalAmount).toLocaleString()}</Text>
            </View>

            {/* ── Meta rows ── */}
            <View style={dm.metaSection}>
              <View style={dm.metaRow}>
                <View style={dm.metaIconWrap}>
                  <Icon name="time-outline" size={13} color={T.green}/>
                </View>
                <Text style={dm.metaLabel}>Booked at</Text>
                <Text style={dm.metaValue}>{fmtTime(booking.createdAt)}</Text>
              </View>
              {!!booking.notes && (
                <View style={[dm.metaRow, {borderBottomWidth: 0}]}>
                  <View style={dm.metaIconWrap}>
                    <Icon name="document-text-outline" size={13} color={T.green}/>
                  </View>
                  <Text style={dm.metaLabel}>Note</Text>
                  <Text style={[dm.metaValue, {flex:1}]}>{booking.notes}</Text>
                </View>
              )}
            </View>

            {/* ── Rejection note ── */}
            {booking.status === 'rejected' && !!booking.rejectionNote && (
              <View style={dm.rejNote}>
                <Icon name="alert-circle-outline" size={14} color={T.red}/>
                <Text style={dm.rejNoteTxt}>{booking.rejectionNote}</Text>
              </View>
            )}

            {/* ── Payment screenshot ── */}
            {imgUri ? (
              <TouchableOpacity style={dm.screenshotWrap} onPress={() => setImgFull(imgUri)} activeOpacity={0.88}>
                <Image source={{uri: imgUri}} style={dm.screenshotImg} resizeMode="cover"/>
                <View style={dm.screenshotOverlay}>
                  <View style={dm.screenshotBtn}>
                    <Icon name="expand-outline" size={13} color="#fff"/>
                    <Text style={dm.screenshotBtnTxt}>View Screenshot</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={dm.noScreenshot}>
                <Icon name="image-outline" size={16} color={T.textMuted}/>
                <Text style={dm.noScreenshotTxt}>No payment screenshot uploaded</Text>
              </View>
            )}
          </ScrollView>

          {/* ── Action buttons (pending only) ── */}
          {booking.status === 'pending' && (
            <View style={dm.actions}>
              <TouchableOpacity style={dm.rejectBtn} onPress={() => onReject(booking._id)} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator size="small" color={T.red}/>
                  : <><Icon name="close-circle-outline" size={15} color={T.red}/><Text style={dm.rejectTxt}>Reject</Text></>
                }
              </TouchableOpacity>
              <TouchableOpacity style={dm.approveBtn} onPress={() => onApprove(booking._id)} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff"/>
                  : <><Icon name="checkmark-circle-outline" size={15} color="#fff"/><Text style={dm.approveTxt}>Approve</Text></>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Full image viewer */}
        <Modal visible={!!imgFull} transparent animationType="fade">
          <View style={g.imgOverlay}>
            <TouchableOpacity style={g.imgClose} onPress={() => setImgFull('')}>
              <Icon name="close-circle" size={32} color="#fff"/>
            </TouchableOpacity>
            <Image source={{uri: imgFull}} style={g.imgFull} resizeMode="contain"/>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const CELL_W = (SW - 16*2 - 8*3) / 2;

const dm = StyleSheet.create({
  backdrop:        { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:           { backgroundColor: T.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS==='ios'?36:24, maxHeight:'92%' },
  handle:          { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf:'center', marginBottom: 16 },
  hdr:             { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 18 },
  hdrTitle:        { fontSize: 17, fontWeight: '700', color: T.text },
  closeBtn:        { width: 30, height: 30, borderRadius: 15, backgroundColor: T.bg, alignItems:'center', justifyContent:'center' },

  // User row
  userRow:         { flexDirection:'row', alignItems:'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  avatar:          { width: 44, height: 44, borderRadius: 22, alignItems:'center', justifyContent:'center' },
  avatarTxt:       { fontSize: 18, fontWeight: '800', color: '#fff' },
  userName:        { fontSize: 15, fontWeight: '700', color: T.text },
  phoneRow:        { flexDirection:'row', alignItems:'center', gap: 4, marginTop: 3 },
  phoneText:       { fontSize: 12, color: T.textSub },
  statusBadge:     { flexDirection:'row', alignItems:'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeTxt:  { color:'#fff', fontSize: 11, fontWeight: '700' },

  // Grid
  grid:            { flexDirection:'row', flexWrap:'wrap', gap: 8, marginBottom: 10 },
  gridCell:        { width: CELL_W, backgroundColor: T.bg, borderRadius: 14, padding: 12, alignItems:'center', gap: 5 },
  gridIconWrap:    { width: 32, height: 32, borderRadius: 10, backgroundColor: T.greenLight, alignItems:'center', justifyContent:'center' },
  gridLabel:       { fontSize: 10, color: T.textMuted, fontWeight: '600', textTransform:'uppercase', letterSpacing: 0.4 },
  gridValue:       { fontSize: 14, fontWeight: '700', color: T.text },

  // Amount
  amountRow:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: T.greenLight, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
  amountLabel:     { fontSize: 13, color: T.textSub, fontWeight: '500' },
  amountValue:     { fontSize: 22, fontWeight: '800', color: T.green },

  // Meta section
  metaSection:     { backgroundColor: T.bg, borderRadius: 14, paddingHorizontal: 14, marginBottom: 10 },
  metaRow:         { flexDirection:'row', alignItems:'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  metaIconWrap:    { width: 28, height: 28, borderRadius: 8, backgroundColor: T.greenLight, alignItems:'center', justifyContent:'center' },
  metaLabel:       { fontSize: 11, color: T.textMuted, width: 70 },
  metaValue:       { fontSize: 13, color: T.text, fontWeight: '600' },

  // Rejection note
  rejNote:         { flexDirection:'row', alignItems:'flex-start', gap: 8, backgroundColor: T.redLight, borderRadius: 12, padding: 12, marginBottom: 10 },
  rejNoteTxt:      { flex: 1, fontSize: 12, color: '#7F1D1D', lineHeight: 18 },

  // Screenshot
  screenshotWrap:  { borderRadius: 14, overflow:'hidden', height: 140, marginBottom: 4 },
  screenshotImg:   { width:'100%', height:'100%' },
  screenshotOverlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.3)', alignItems:'center', justifyContent:'center' },
  screenshotBtn:   { flexDirection:'row', alignItems:'center', gap: 6, backgroundColor:'rgba(0,0,0,0.4)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  screenshotBtnTxt:{ color:'#fff', fontWeight: '600', fontSize: 12 },
  noScreenshot:    { flexDirection:'row', alignItems:'center', gap: 8, backgroundColor: T.bg, borderRadius: 12, padding: 14, marginBottom: 4 },
  noScreenshotTxt: { color: T.textMuted, fontSize: 12 },

  // Action buttons
  actions:         { flexDirection:'row', gap: 10, marginTop: 16 },
  rejectBtn:       { flex: 1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: T.red, backgroundColor: T.redLight },
  rejectTxt:       { color: T.red, fontWeight: '700', fontSize: 14 },
  approveBtn:      { flex: 2, flexDirection:'row', alignItems:'center', justifyContent:'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: T.green },
  approveTxt:      { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ── Booking Card ──────────────────────────────────────────────────────
const BookingCard = ({ item, onPress, onApprove, onReject, actionId }: any) => {
  const st   = STATUS[item.status as keyof typeof STATUS] || STATUS.pending;
  const init = item.userName?.charAt(0)?.toUpperCase() || '?';
  const busy = actionId === item._id;

  return (
    <TouchableOpacity style={bc.card} onPress={onPress} activeOpacity={0.86}>

      {/* ── Top section ─────────────────────────────────────── */}
      <View style={bc.top}>

        {/* Avatar */}
        <View style={[bc.avatar, { backgroundColor: st.light }]}>
          <Text style={[bc.avatarTxt, { color: st.color }]}>{init}</Text>
        </View>

        {/* Name + phone */}
        <View style={bc.nameBlock}>
          <Text style={bc.name} numberOfLines={1}>{item.userName}</Text>
          <Text style={bc.phone}>{item.phone}</Text>
        </View>

        {/* Status badge — solid pill */}
        <View style={[bc.badge, { backgroundColor: st.color }]}>
          <Text style={bc.badgeTxt}>{st.label}</Text>
        </View>
      </View>

      {/* ── Divider ─────────────────────────────────────────── */}
      <View style={bc.divider} />

      {/* ── Meta row ────────────────────────────────────────── */}
      <View style={bc.metaRow}>
        <View style={bc.metaItem}>
          <Icon name="time-outline" size={12} color={T.textSub} />
          <Text style={bc.metaTxt}>{item.slotTime}</Text>
        </View>
        <View style={bc.metaDot} />
        <View style={bc.metaItem}>
          <Icon name="hourglass-outline" size={12} color={T.textSub} />
          <Text style={bc.metaTxt}>{item.duration} Hr</Text>
        </View>
        <View style={bc.metaDot} />
        <View style={bc.metaItem}>
          <Icon name="people-outline" size={12} color={T.textSub} />
          <Text style={bc.metaTxt}>{item.numberOfPlayers} Players</Text>
        </View>
      </View>

      {/* ── Footer: amount + tap hint ────────────────────────── */}
      <View style={bc.footer}>
        <Text style={bc.amount}>PKR {Number(item.totalAmount).toLocaleString()}</Text>
        {item.status === 'rejected' && !!item.rejectionNote ? (
          <Text style={bc.rejNote} numberOfLines={1}>{item.rejectionNote}</Text>
        ) : (
          <View style={bc.tapHint}>
            <Text style={bc.tapTxt}>View Details</Text>
            <Icon name="chevron-forward" size={12} color={T.textMuted} />
          </View>
        )}
      </View>

      {/* ── Action buttons — pending only ───────────────────── */}
      {item.status === 'pending' && (
        <View style={bc.actions}>
          <TouchableOpacity
            style={bc.rejectBtn}
            onPress={() => onReject(item._id)}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator size="small" color={T.red} />
              : <><Icon name="close-circle-outline" size={14} color={T.red} /><Text style={bc.rejectTxt}>Reject</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={bc.approveBtn}
            onPress={() => onApprove(item._id)}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Icon name="checkmark-circle-outline" size={14} color="#fff" /><Text style={bc.approveTxt}>Approve</Text></>
            }
          </TouchableOpacity>
        </View>
      )}

    </TouchableOpacity>
  );
};

const bc = StyleSheet.create({
  // Card — clean white, subtle shadow, no left bar
  card: {
    backgroundColor: T.surface,
    borderRadius: 18,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    elevation: 2,
    shadowColor: '#1A2B48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
  },

  // Top row
  top:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '800' },
  nameBlock: { flex: 1 },
  name:      { fontSize: 14, fontWeight: '700', color: T.text, letterSpacing: -0.2 },
  phone:     { fontSize: 11, color: T.textMuted, marginTop: 2, fontWeight: '400' },

  // Solid status badge
  badge:    { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },

  // Divider
  divider: { height: 1, backgroundColor: T.borderSoft, marginBottom: 12 },

  // Meta row — inline with dots
  metaRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { fontSize: 12, color: T.textSub, fontWeight: '500' },
  metaDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: T.border, marginHorizontal: 8 },

  // Footer
  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount:   { fontSize: 16, fontWeight: '800', color: T.text, letterSpacing: -0.3 },
  rejNote:  { fontSize: 11, color: T.red, fontWeight: '500', flex: 1, marginLeft: 10 },
  tapHint:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tapTxt:   { fontSize: 11, color: T.textMuted, fontWeight: '500' },

  // Action buttons
  actions:    { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.borderSoft },
  rejectBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: T.red },
  rejectTxt:  { color: T.red, fontWeight: '700', fontSize: 13 },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: T.green },
  approveTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ── Main Screen ───────────────────────────────────────────────────────
type DateMode = 'today' | 'week' | 'month' | 'custom';

const AdminBookingsScreen = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state: RootState) => state.booking.bookings);

  const [loading,          setLoading]          = useState(false);
  const [actionId,         setActionId]         = useState('');
  const [statusFilter,     setStatusFilter]     = useState<'all'|'pending'|'approved'|'rejected'>('all');
  const [dateMode,         setDateMode]         = useState<DateMode>('week');
  const [customDate,       setCustomDate]       = useState(todayStr());
  const [showCalendar,     setShowCalendar]     = useState(false);
  const [searchText,       setSearchText]       = useState('');
  const [selectedBooking,  setSelectedBooking]  = useState<any>(null);
  const [showRejectModal,  setShowRejectModal]  = useState(false);
  const [rejectTargetId,   setRejectTargetId]   = useState('');

  const getApiDate = () => {
    if (dateMode === 'today')  return todayStr();
    if (dateMode === 'custom') return customDate;
    return undefined;
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
    try { dispatch(setBookings(await getAllBookings(getApiDate()))); } catch {}
    finally { setLoading(false); }
  };

  const dateFiltered = bookings.filter(b => {
    if (dateMode === 'today' || dateMode === 'custom') return true;
    if (dateMode === 'week')  { const r = getWeekRange();  return inRange(b.date, r.start, r.end); }
    if (dateMode === 'month') { const r = getMonthRange(); return inRange(b.date, r.start, r.end); }
    return true;
  });

  const filtered = dateFiltered.filter(b => {
    const okS = statusFilter === 'all' || b.status === statusFilter;
    const okQ = !searchText.trim() ||
      b.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      b.phone.includes(searchText);
    return okS && okQ;
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
    catch { Alert.alert('Error','Failed to approve'); }
    finally { setActionId(''); }
  };

  const handleRejectPress = (id: string) => { setRejectTargetId(id); setShowRejectModal(true); };

  const handleRejectConfirm = async (note: string) => {
    setActionId(rejectTargetId);
    try { await rejectBooking(rejectTargetId, note); setShowRejectModal(false); setRejectTargetId(''); setSelectedBooking(null); }
    catch { Alert.alert('Error','Failed to reject'); }
    finally { setActionId(''); }
  };

  const dateModeLabel = () => {
    if (dateMode === 'today')  return 'Today';
    if (dateMode === 'week')   { const r = getWeekRange(); return `${fmt(r.start)} – ${fmt(r.end)}`; }
    if (dateMode === 'month')  { const t = new Date(); return `${MONTH_SHORT[t.getMonth()]} ${t.getFullYear()}`; }
    return fmt(customDate);
  };

  const TILES = [
    { key:'all',      label:'Total',    color: T.blue,  bg: T.blueLight,  icon:'layers-outline'            },
    { key:'pending',  label:'Pending',  color: T.amber, bg: T.amberLight, icon:'time-outline'              },
    { key:'approved', label:'Approved', color: T.green, bg: T.greenLight, icon:'checkmark-circle-outline'  },
    { key:'rejected', label:'Rejected', color: T.red,   bg: T.redLight,   icon:'close-circle-outline'      },
  ] as const;

  const DATE_MODES = [
    { key:'today',  label:'Today',      icon:'today-outline'         },
    { key:'week',   label:'This Week',  icon:'calendar-outline'      },
    { key:'month',  label:'This Month', icon:'calendar-clear-outline'},
    { key:'custom', label:'Pick Date',  icon:'search-outline'        },
  ] as const;

  const ListHeader = () => (
    <>
      {/* Summary tiles */}
      <View style={g.tilesRow}>
        {TILES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[g.tile, statusFilter === t.key && {borderColor: t.color, borderWidth: 2}]}
            onPress={() => setStatusFilter(t.key)}
            activeOpacity={0.8}
          >
            <View style={[g.tileIcon, {backgroundColor: t.bg}]}>
              <Icon name={t.icon} size={14} color={t.color}/>
            </View>
            <Text style={[g.tileCount, {color: t.color}]}>{counts[t.key]}</Text>
            <Text style={g.tileLbl}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date mode pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={g.pillsScroll} contentContainerStyle={g.pillsContent}>
        {DATE_MODES.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[g.pill, dateMode === p.key && g.pillActive]}
            onPress={() => { setDateMode(p.key); if (p.key === 'custom') setShowCalendar(true); }}
          >
            <Icon name={p.icon} size={11} color={dateMode === p.key ? '#fff' : T.textSub}/>
            <Text style={[g.pillTxt, dateMode === p.key && g.pillTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom date row */}
      {dateMode === 'custom' && (
        <TouchableOpacity style={g.customRow} onPress={() => setShowCalendar(true)}>
          <Icon name="calendar-outline" size={13} color={T.green}/>
          <Text style={g.customTxt}>{fmt(customDate)}</Text>
          <Icon name="chevron-down" size={12} color={T.textMuted}/>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={g.searchWrap}>
        <Icon name="search-outline" size={15} color={T.textMuted}/>
        <TextInput
          style={g.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={T.ph}
          value={searchText}
          onChangeText={setSearchText}
        />
        {!!searchText && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={15} color={T.textMuted}/>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={g.resultsRow}>
        <Text style={g.resultsTxt}>{filtered.length} booking{filtered.length !== 1 ? 's' : ''} · {dateModeLabel()}</Text>
        {statusFilter !== 'all' && (
          <TouchableOpacity onPress={() => setStatusFilter('all')}>
            <Text style={g.clearTxt}>Clear ✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <View style={g.root}>
      {/* Fixed header */}
      <View style={g.header}>
        <View>
          <Text style={g.headerTitle}>Bookings</Text>
          <Text style={g.headerSub}>{dateModeLabel()}</Text>
        </View>
        <TouchableOpacity style={g.refreshBtn} onPress={loadBookings}>
          <Icon name="refresh-outline" size={16} color={T.green}/>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 60}} color={T.green} size="large"/>
      ) : (
        <SectionList
          sections={[{title: 'bookings', data: filtered}]}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={g.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={<ListHeader/>}
          renderSectionHeader={() => null}
          ListEmptyComponent={() => (
            <View style={g.empty}>
              <View style={g.emptyIconWrap}>
                <Icon name="calendar-outline" size={28} color={T.textMuted}/>
              </View>
              <Text style={g.emptyTitle}>No bookings found</Text>
              <Text style={g.emptySub}>
                {searchText ? `No results for "${searchText}"` : `No ${statusFilter !== 'all' ? statusFilter + ' ' : ''}bookings · ${dateModeLabel()}`}
              </Text>
            </View>
          )}
          renderItem={({item}: any) => (
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

      {/* Calendar modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity style={{flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center'}} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableOpacity activeOpacity={1}>
            <MiniCalendar selected={customDate} onSelect={(d) => { setCustomDate(d); setDateMode('custom'); }} onClose={() => setShowCalendar(false)}/>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <DetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onApprove={handleApprove}
        onReject={(id: string) => { setSelectedBooking(null); handleRejectPress(id); }} actionLoading={!!actionId}/>

      <RejectModal visible={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectTargetId(''); }}
        onConfirm={handleRejectConfirm} loading={!!actionId}/>
    </View>
  );
};

export default AdminBookingsScreen;

// ── Global styles ─────────────────────────────────────────────────────
const g = StyleSheet.create({
  root:        { flex:1, backgroundColor: T.bg },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop: Platform.OS==='ios'?52:18, paddingBottom:12, backgroundColor: T.surface, borderBottomWidth:1, borderBottomColor: T.border },
  headerTitle: { fontSize:20, fontWeight:'800', color: T.text, letterSpacing:-0.3 },
  headerSub:   { fontSize:11, color: T.textSub, marginTop:2 },
  refreshBtn:  { width:36, height:36, borderRadius:18, backgroundColor: T.greenLight, alignItems:'center', justifyContent:'center' },

  tilesRow:  { flexDirection:'row', gap:8, paddingHorizontal:14, paddingTop:14, paddingBottom:4 },
  tile:      { flex:1, backgroundColor: T.surface, borderRadius:14, paddingVertical:12, paddingHorizontal:6, alignItems:'center', gap:5, borderWidth:1, borderColor: T.border, elevation:1, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4 },
  tileIcon:  { width:30, height:30, borderRadius:9, alignItems:'center', justifyContent:'center' },
  tileCount: { fontSize:20, fontWeight:'800', lineHeight:22 },
  tileLbl:   { fontSize:9, color: T.textMuted, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.3 },

  pillsScroll:   { marginTop:12 },
  pillsContent:  { paddingHorizontal:14, gap:8 },
  pill:          { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:13, paddingVertical:8, borderRadius:20, backgroundColor: T.surface, borderWidth:1.5, borderColor: T.border },
  pillActive:    { backgroundColor: T.green, borderColor: T.green },
  pillTxt:       { fontSize:12, fontWeight:'600', color: T.textSub },
  pillTxtActive: { color:'#fff' },

  customRow: { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:14, marginTop:8, backgroundColor: T.greenLight, borderRadius:10, paddingHorizontal:12, paddingVertical:9 },
  customTxt: { flex:1, fontSize:12, color: T.green, fontWeight:'700' },

  searchWrap:  { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:14, marginTop:10, backgroundColor: T.surface, borderRadius:12, borderWidth:1.5, borderColor: T.border, paddingHorizontal:12, height:42 },
  searchInput: { flex:1, fontSize:13, color: T.text },

  resultsRow:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingTop:8, paddingBottom:2 },
  resultsTxt:  { fontSize:11, color: T.textMuted, fontWeight:'500' },
  clearTxt:    { fontSize:11, color: T.green, fontWeight:'700' },

  listContent: { paddingHorizontal:14, paddingBottom:40 },

  empty:       { alignItems:'center', marginTop:50, paddingHorizontal:30 },
  emptyIconWrap:{ width:60, height:60, borderRadius:30, backgroundColor: T.surface, alignItems:'center', justifyContent:'center', marginBottom:12, borderWidth:1.5, borderColor: T.border },
  emptyTitle:  { fontSize:14, fontWeight:'700', color: T.textSub },
  emptySub:    { fontSize:12, color: T.textMuted, marginTop:4, textAlign:'center', lineHeight:18 },

  imgOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.95)', justifyContent:'center', alignItems:'center' },
  imgClose:    { position:'absolute', top:52, right:16, zIndex:10 },
  imgFull:     { width:'92%', height:'72%' },
});