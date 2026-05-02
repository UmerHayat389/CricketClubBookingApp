import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, ScrollView, Image, Platform,
  KeyboardAvoidingView, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEvents, addEvent, updateEvent, deleteEvent, Event } from '../../store/slices/eventSlice';
import { getEvents, createEvent, updateEvent as apiUpdate, deleteEvent as apiDelete, toggleFreeEvent } from '../../services/eventService';
import { MEDIA_URL } from '../../config/baseUrl';

// ─────────────────────────────────────────────────────────────────
const GREEN   = '#0A8F3C';
const RED_ERR = '#E53935';
const BORDER  = '#EFEFEF';

const LIMITS = { title: 70, description: 200, location: 150, entryFee: 5 };

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

interface BannerAsset { uri: string; name: string; type: string; }
interface FormErrors { title?: string; description?: string; date?: string; location?: string; entryFee?: string; }

// ── CharCounter ──────────────────────────────────────────────────
const CharCounter = ({ current, max }: { current: number; max: number }) => (
  <Text style={[st.charCounter, current > max && st.charCounterOver]}>
    {current}/{max}
  </Text>
);

// ── Toast ────────────────────────────────────────────────────────
interface ToastProps { visible: boolean; message: string; type: 'error'|'success'|'info'; }
const Toast = ({ visible, message, type }: ToastProps) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: visible ? 0 : 16, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible]);
  const cfg: any = {
    error:   { bg: '#FEF2F2', border: RED_ERR, icon: 'close-circle' },
    success: { bg: '#F0FFF6', border: GREEN,   icon: 'checkmark-circle' },
    info:    { bg: '#FFF7ED', border: '#F59E0B', icon: 'information-circle' },
  };
  const c = cfg[type];
  return (
    <Animated.View style={[ts.wrap, { opacity, transform: [{ translateY }], backgroundColor: c.bg, borderLeftColor: c.border }]}>
      <Icon name={c.icon} size={18} color={c.border} />
      <Text style={[ts.text, { color: c.border }]}>{message}</Text>
    </Animated.View>
  );
};
const ts = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderLeftWidth: 4, elevation: 16, zIndex: 999 },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
});

// ── DeleteConfirmModal ───────────────────────────────────────────
interface DeleteConfirmProps {
  visible: boolean;
  eventTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}
const DeleteConfirmModal = ({ visible, eventTitle, onCancel, onConfirm, deleting }: DeleteConfirmProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <TouchableOpacity style={del.overlay} activeOpacity={1} onPress={onCancel}>
      <TouchableOpacity activeOpacity={1} style={del.box}>

        {/* Icon + heading */}
        <View style={del.topRow}>
          <View style={del.iconCircle}>
            <Icon name="trash-outline" size={18} color={RED_ERR} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={del.title}>Delete event?</Text>
            <Text style={del.subtitle}>This cannot be undone</Text>
          </View>
        </View>

        {/* Event name preview */}
        <View style={del.previewBox}>
          <Icon name="trophy-outline" size={13} color="#888" />
          <Text style={del.previewText} numberOfLines={1}>{eventTitle}</Text>
          <Text style={del.previewText}> will be permanently removed.</Text>
        </View>

        {/* Actions */}
        <View style={del.btnRow}>
          <TouchableOpacity style={del.cancelBtn} onPress={onCancel} disabled={deleting}>
            <Text style={del.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[del.deleteBtn, deleting && { opacity: 0.65 }]} onPress={onConfirm} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Icon name="trash-outline" size={14} color="#fff" /><Text style={del.deleteText}>Delete</Text></>
            }
          </TouchableOpacity>
        </View>

      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const del = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  box:        { backgroundColor: '#fff', borderRadius: 18, width: Dimensions.get('window').width - 48, padding: 20, elevation: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 15, fontWeight: '700', color: '#111' },
  subtitle:   { fontSize: 12, color: '#999', marginTop: 2 },
  previewBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, backgroundColor: '#F7F8FA', borderRadius: 10, borderWidth: 1, borderColor: '#EFEFEF', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 18 },
  previewText:{ fontSize: 13, color: '#555' },
  btnRow:     { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  deleteBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: RED_ERR },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── CalendarPicker ───────────────────────────────────────────────
const CalendarPicker = ({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (d: string) => void; }) => {
  const today = new Date();
  const [vY, setVY] = useState(today.getFullYear());
  const [vM, setVM] = useState(today.getMonth());
  const daysInMonth = new Date(vY, vM + 1, 0).getDate();
  const firstDay    = new Date(vY, vM, 1).getDay();
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const isPast = (d: number) => { const c = new Date(vY,vM,d); c.setHours(0,0,0,0); const t=new Date();t.setHours(0,0,0,0); return c<t; };
  const isToday=(d:number)=>{ const t=new Date(); return d===t.getDate()&&vM===t.getMonth()&&vY===t.getFullYear(); };
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={cal.box}>
          <View style={cal.navRow}>
            <TouchableOpacity style={cal.navBtn} onPress={() => { if(vM===0){VM(11);setVY(y=>y-1);}else setVM(m=>m-1); }}><Icon name="chevron-back" size={20} color="#333"/></TouchableOpacity>
            <Text style={cal.monthTitle}>{MONTHS[vM]} {vY}</Text>
            <TouchableOpacity style={cal.navBtn} onPress={() => { if(vM===11){VM(0);setVY(y=>y+1);}else setVM(m=>m+1); }}><Icon name="chevron-forward" size={20} color="#333"/></TouchableOpacity>
          </View>
          <View style={cal.weekRow}>{DAYS.map(d=><Text key={d} style={cal.weekDay}>{d}</Text>)}</View>
          <View style={cal.grid}>
            {cells.map((d,i) => {
              if(!d) return <View key={`e${i}`} style={cal.cell}/>;
              const past=isPast(d),tod=isToday(d);
              return (
                <TouchableOpacity key={`d${i}`} style={[cal.cell,tod&&cal.todayCell,past&&cal.pastCell]} onPress={()=>{ if(isPast(d))return; onSelect(`${String(d).padStart(2,'0')} ${MONTHS[vM].slice(0,3)} ${vY}`); onClose(); }} disabled={past}>
                  <Text style={[cal.cellText,tod&&cal.todayText,past&&cal.pastText]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={cal.closeBtn} onPress={onClose}><Text style={cal.closeBtnText}>Cancel</Text></TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
  function VM(v: number){setVM(v);}
};

// ── AdminEventsScreen ────────────────────────────────────────────
const AdminEventsScreen = () => {
  const dispatch = useDispatch<any>();
  const events   = useSelector((state: RootState) => state.event.events);

  // Form modal state
  const [formVisible,  setFormVisible]  = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [calVisible,   setCalVisible]   = useState(false);

  // Detail modal state
  const [detailEvent,  setDetailEvent]  = useState<Event | null>(null);

  // Delete confirm modal state
  const [deleteTarget,  setDeleteTarget]  = useState<Event | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // Form fields
  const [banner,      setBanner]      = useState<BannerAsset | null>(null);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [date,        setDate]        = useState('');
  const [location,    setLocation]    = useState('');
  const [entryFee,    setEntryFee]    = useState('');
  const [previousFee, setPreviousFee] = useState(0);

  const [errors,  setErrors]  = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string,boolean>>({});

  // Toast
  const [toast,     setToast]     = useState({ visible: false, message: '', type: 'success' as 'error'|'success'|'info' });
  const toastTimer = useRef<any>(null);
  const showToast = (message: string, type: 'error'|'success'|'info' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  // ── Load + sockets ───────────────────────────────────────────
  useEffect(() => {
    (async () => { try { dispatch(setEvents(await getEvents())); } catch {} })();
    const onCreate = (e: Event) => dispatch(addEvent(e));
    const onUpdate = (e: Event) => {
      dispatch(updateEvent(e));
      setDetailEvent(d => d?._id === e._id ? e : d);
    };
    const onDelete = ({ _id }: { _id: string }) => {
      dispatch(deleteEvent(_id));
      setDetailEvent(d => d?._id === _id ? null : d);
    };
    socket.on('eventCreated', onCreate);
    socket.on('eventUpdated', onUpdate);
    socket.on('eventDeleted', onDelete);
    return () => {
      socket.off('eventCreated', onCreate);
      socket.off('eventUpdated', onUpdate);
      socket.off('eventDeleted', onDelete);
    };
  }, []);

  // ── Validation ───────────────────────────────────────────────
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!title.trim())                           errs.title = 'Event title is required';
    else if (title.trim().length > LIMITS.title)  errs.title = `Max ${LIMITS.title} characters`;
    if (description.trim().length > LIMITS.description) errs.description = `Max ${LIMITS.description} characters`;
    if (!date.trim())                            errs.date = 'Please select a date';
    if (location.trim().length > LIMITS.location) errs.location = `Max ${LIMITS.location} characters`;
    if (entryFee && !/^\d{1,5}$/.test(entryFee)) errs.entryFee = 'Enter a valid amount';
    return errs;
  };
  const touch = (f: string) => setTouched(t => ({ ...t, [f]: true }));

  useEffect(() => { if (touched.title)       setErrors(e => ({ ...e, title:       validate().title })); },       [title]);
  useEffect(() => { if (touched.description)  setErrors(e => ({ ...e, description: validate().description })); }, [description]);
  useEffect(() => { if (touched.date)         setErrors(e => ({ ...e, date:        validate().date })); },        [date]);
  useEffect(() => { if (touched.location)     setErrors(e => ({ ...e, location:    validate().location })); },    [location]);
  useEffect(() => { if (touched.entryFee)     setErrors(e => ({ ...e, entryFee:    validate().entryFee })); },    [entryFee]);

  // ── Open form for create ──────────────────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setBanner(null); setTitle(''); setDescription('');
    setDate(''); setLocation(''); setEntryFee(''); setPreviousFee(0);
    setErrors({}); setTouched({});
    setFormVisible(true);
  };

  // ── Open form for edit ────────────────────────────────────────
  const openEdit = (ev: Event) => {
    setDetailEvent(null);
    setEditingEvent(ev);
    setBanner(null);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setDate(ev.date || '');
    setLocation(ev.location || '');
    setEntryFee(ev.entryFee > 0 ? String(ev.entryFee) : '');
    setPreviousFee(ev.entryFee);
    setErrors({}); setTouched({});
    setFormVisible(true);
  };

  // ── Banner picker ─────────────────────────────────────────────
  const pickBanner = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (res) => {
      if (res.didCancel || res.errorCode) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      setBanner({ uri: asset.uri, name: asset.fileName ?? `banner_${Date.now()}.jpg`, type: asset.type ?? 'image/jpeg' });
    });
  };

  // ── Submit (create or update) ─────────────────────────────────
  const handleSubmit = async () => {
    setTouched({ title:true, description:true, date:true, location:true, entryFee:true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { showToast('Please fix the errors before submitting', 'error'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',       title.trim());
      fd.append('description', description.trim());
      fd.append('date',        date.trim());
      fd.append('location',    location.trim());
      fd.append('entryFee',    entryFee || '0');
      if (banner) fd.append('banner', { uri: banner.uri, name: banner.name, type: banner.type } as any);

      if (editingEvent) {
        await apiUpdate(editingEvent._id, fd);
        showToast('Event updated successfully!', 'success');
      } else {
        await createEvent(fd);
        showToast('Event published successfully!', 'success');
      }
      setTimeout(() => setFormVisible(false), 800);
    } catch {
      showToast('Failed to save event. Try again.', 'error');
    } finally { setSaving(false); }
  };

  // ── Delete — opens custom confirm modal ───────────────────────
  const handleDelete = (ev: Event) => {
    setDetailEvent(null); // close detail modal if open
    setDeleteTarget(ev);
  };

  // ── Confirmed delete ──────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(deleteTarget._id);
      setDeleteTarget(null);
      showToast('Event deleted', 'info');
    } catch {
      showToast('Failed to delete event', 'error');
    } finally { setDeleting(false); }
  };

  // ── Toggle Free ───────────────────────────────────────────────
  const handleToggleFree = async (ev: Event) => {
    try {
      const restore = ev.entryFee === 0 ? previousFee || 500 : ev.entryFee;
      await toggleFreeEvent(ev._id, ev.entryFee > 0 ? 0 : restore);
      showToast(ev.entryFee > 0 ? 'Event set to Free Entry' : 'Entry fee restored', 'success');
    } catch { showToast('Failed to update entry fee', 'error'); }
  };

  // ── Event card ────────────────────────────────────────────────
  const renderCard = ({ item }: { item: Event }) => (
    <TouchableOpacity style={st.card} activeOpacity={0.88} onPress={() => setDetailEvent(item)}>
      {item.banner ? (
        <Image source={{ uri: `${MEDIA_URL}/uploads/events/${item.banner}` }} style={st.cardBanner} resizeMode="cover" />
      ) : (
        <View style={st.cardBannerPlaceholder}><Icon name="trophy-outline" size={32} color={GREEN}/></View>
      )}

      {!!item.date && (
        <View style={st.dateBadge}>
          <Icon name="calendar" size={11} color="#fff"/>
          <Text style={st.dateBadgeText}>{item.date}</Text>
        </View>
      )}

      <View style={st.cardBody}>
        <View style={st.cardTopRow}>
          <Text style={st.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={st.cardActions}>
            <TouchableOpacity style={st.actionBtn} onPress={() => handleToggleFree(item)}>
              <Icon name={item.entryFee > 0 ? 'pricetag-outline' : 'gift-outline'} size={15} color={item.entryFee > 0 ? '#C47A00' : GREEN}/>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={() => openEdit(item)}>
              <Icon name="create-outline" size={15} color="#4A90D9"/>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => handleDelete(item)}>
              <Icon name="trash-outline" size={15} color={RED_ERR}/>
            </TouchableOpacity>
          </View>
        </View>

        {!!item.description && <Text style={st.cardDesc} numberOfLines={2}>{item.description}</Text>}

        <View style={st.cardMeta}>
          {!!item.location && (
            <View style={st.metaChip}>
              <Icon name="location-outline" size={12} color={GREEN}/>
              <Text style={st.metaText}>{item.location}</Text>
            </View>
          )}
          {item.entryFee > 0 ? (
            <View style={[st.metaChip, st.feeChip]}>
              <Icon name="cash-outline" size={12} color="#C47A00"/>
              <Text style={st.feeText}>Rs. {item.entryFee}</Text>
            </View>
          ) : (
            <View style={[st.metaChip, st.freeChip]}>
              <Icon name="gift-outline" size={12} color={GREEN}/>
              <Text style={st.freeText}>Free Entry</Text>
            </View>
          )}
        </View>

        <View style={st.viewDetailRow}>
          <Text style={st.viewDetailText}>Tap to view details</Text>
          <Icon name="chevron-forward" size={13} color={GREEN}/>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Detail Modal ──────────────────────────────────────────────
  const DetailModal = () => (
    <Modal visible={!!detailEvent} transparent animationType="slide" onRequestClose={() => setDetailEvent(null)}>
      <View style={st.modalOverlay}>
        <View style={st.detailBox}>
          <View style={st.modalHandle}/>
          <ScrollView showsVerticalScrollIndicator={false}>
            {detailEvent?.banner ? (
              <Image source={{ uri: `${MEDIA_URL}/uploads/events/${detailEvent.banner}` }} style={st.detailBanner} resizeMode="cover"/>
            ) : (
              <View style={st.detailBannerPlaceholder}><Icon name="trophy" size={52} color={GREEN}/></View>
            )}

            <View style={st.detailContent}>
              {!!detailEvent?.date && (
                <View style={st.detailDateBadge}>
                  <Icon name="calendar-outline" size={13} color={GREEN}/>
                  <Text style={st.detailDateText}>{detailEvent.date}</Text>
                </View>
              )}

              <Text style={st.detailTitle}>{detailEvent?.title}</Text>
              {!!detailEvent?.description && <Text style={st.detailDesc}>{detailEvent.description}</Text>}

              <View style={st.detailDivider}/>

              {[
                detailEvent?.location  && { icon: 'location-outline',  label: 'Venue / Location', value: detailEvent.location },
                detailEvent !== null   && { icon: 'cash-outline',       label: 'Entry Fee', value: (detailEvent!.entryFee > 0 ? `Rs. ${detailEvent!.entryFee}` : 'Free Entry') },
                detailEvent?.date      && { icon: 'calendar-outline',   label: 'Date', value: detailEvent.date },
              ].filter(Boolean).map((row: any, i) => (
                <View key={i} style={st.detailRow}>
                  <View style={st.detailIconWrap}><Icon name={row.icon} size={18} color={GREEN}/></View>
                  <View>
                    <Text style={st.detailLabel}>{row.label}</Text>
                    <Text style={st.detailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={st.detailActionRow}>
            <TouchableOpacity style={st.detailActionBtn} onPress={() => detailEvent && handleToggleFree(detailEvent)}>
              <Icon name={detailEvent?.entryFee === 0 ? 'pricetag-outline' : 'gift-outline'} size={16} color={detailEvent?.entryFee === 0 ? '#C47A00' : GREEN}/>
              <Text style={[st.detailActionText, { color: detailEvent?.entryFee === 0 ? '#C47A00' : GREEN }]}>
                {detailEvent?.entryFee === 0 ? 'Set Paid' : 'Make Free'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.detailActionBtn, { borderColor: '#4A90D9' }]} onPress={() => detailEvent && openEdit(detailEvent)}>
              <Icon name="create-outline" size={16} color="#4A90D9"/>
              <Text style={[st.detailActionText, { color: '#4A90D9' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.detailActionBtn, { borderColor: RED_ERR }]} onPress={() => detailEvent && handleDelete(detailEvent)}>
              <Icon name="trash-outline" size={16} color={RED_ERR}/>
              <Text style={[st.detailActionText, { color: RED_ERR }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={st.detailCloseBtn} onPress={() => setDetailEvent(null)}>
            <Text style={st.detailCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <View style={st.root}>

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Events</Text>
          <Text style={st.headerSub}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={st.createBtn} onPress={openCreate}>
          <Icon name="add-circle-outline" size={18} color="#fff"/>
          <Text style={st.createBtnText}>New Event</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={i => i._id}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={st.empty}>
            <View style={st.emptyIcon}><Icon name="trophy-outline" size={44} color={GREEN}/></View>
            <Text style={st.emptyText}>No events yet</Text>
            <Text style={st.emptySubText}>Tap "New Event" to create your first event</Text>
          </View>
        }
        renderItem={renderCard}
      />

      {/* ── Detail Modal ─────────────────────────────────────── */}
      <DetailModal/>

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        eventTitle={deleteTarget?.title ?? ''}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />

      {/* ── Create / Edit Form Modal ─────────────────────────── */}
      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !saving && setFormVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={st.modal}>

            {/* Modal header */}
            <View style={st.modalHeader}>
              <View style={st.modalHandleBar}/>
              <View style={st.modalHeaderRow}>
                <View>
                  <Text style={st.modalTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
                  <Text style={st.modalSubtitle}>
                    {editingEvent ? 'Update the event details below' : 'Fill in the event details below'}
                  </Text>
                </View>
                <TouchableOpacity style={st.closeBtn} onPress={() => { if(!saving) setFormVisible(false); }} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
                  <Icon name="close" size={20} color="#555"/>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex:1 }} contentContainerStyle={st.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Banner */}
              <Text style={st.label}>Event Banner <Text style={st.optional}>(optional{editingEvent ? ' — leave blank to keep existing' : ''})</Text></Text>
              <TouchableOpacity style={st.bannerPicker} onPress={pickBanner} activeOpacity={0.85}>
                {banner ? (
                  <Image source={{ uri: banner.uri }} style={st.bannerPreview} resizeMode="cover"/>
                ) : editingEvent?.banner ? (
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: `${MEDIA_URL}/uploads/events/${editingEvent.banner}` }} style={st.bannerPreview} resizeMode="cover"/>
                    <View style={st.bannerEditOverlay}>
                      <Icon name="camera-outline" size={24} color="#fff"/>
                      <Text style={{ color:'#fff', fontWeight:'700', marginTop:4 }}>Change Banner</Text>
                    </View>
                  </View>
                ) : (
                  <View style={st.bannerPlaceholder}>
                    <View style={st.bannerIconCircle}><Icon name="image-outline" size={28} color={GREEN}/></View>
                    <Text style={st.bannerPlaceholderTitle}>Add Event Banner</Text>
                    <Text style={st.bannerPlaceholderSub}>JPG, PNG or WEBP · Max 5 MB</Text>
                  </View>
                )}
              </TouchableOpacity>
              {banner && (
                <TouchableOpacity onPress={() => setBanner(null)} style={st.removeBanner}>
                  <Icon name="trash-outline" size={14} color={RED_ERR}/>
                  <Text style={st.removeBannerText}>Remove image</Text>
                </TouchableOpacity>
              )}

              {/* Title */}
              <View style={st.fieldHeader}>
                <Text style={st.label}>Event Title <Text style={st.required}>*</Text></Text>
                <CharCounter current={title.length} max={LIMITS.title}/>
              </View>
              <TextInput
                style={[st.input, !!errors.title && touched.title && st.inputError]}
                placeholder="e.g. Summer Cricket Tournament"
                placeholderTextColor="#BBBBBB"
                value={title}
                onChangeText={v => setTitle(v.slice(0, LIMITS.title))}
                onBlur={() => touch('title')}
                maxLength={LIMITS.title}
              />
              {!!errors.title && touched.title && (
                <View style={st.errorRow}><Icon name="alert-circle-outline" size={13} color={RED_ERR}/><Text style={st.errorText}>{errors.title}</Text></View>
              )}

              {/* Description */}
              <View style={st.fieldHeader}>
                <Text style={st.label}>Description <Text style={st.optional}>(optional)</Text></Text>
                <CharCounter current={description.length} max={LIMITS.description}/>
              </View>
              <TextInput
                style={[st.input, st.inputMulti, !!errors.description && touched.description && st.inputError]}
                placeholder="Describe the event, rules, prizes..."
                placeholderTextColor="#BBBBBB"
                value={description}
                onChangeText={v => setDescription(v.slice(0, LIMITS.description))}
                onBlur={() => touch('description')}
                multiline numberOfLines={4}
                textAlignVertical="top"
              />
              {!!errors.description && touched.description && (
                <View style={st.errorRow}><Icon name="alert-circle-outline" size={13} color={RED_ERR}/><Text style={st.errorText}>{errors.description}</Text></View>
              )}

              {/* Date */}
              <Text style={st.label}>Date <Text style={st.required}>*</Text></Text>
              <TouchableOpacity style={[st.input, st.inputRow, !!errors.date && touched.date && st.inputError]} onPress={() => { setCalVisible(true); touch('date'); }} activeOpacity={0.8}>
                <Icon name="calendar-outline" size={18} color={date ? GREEN : '#BBBBBB'}/>
                <Text style={[st.inputRowText, !date && { color:'#BBBBBB' }]}>{date || 'Select event date'}</Text>
                <Icon name="chevron-down" size={16} color="#BBBBBB"/>
              </TouchableOpacity>
              {!!errors.date && touched.date && (
                <View style={st.errorRow}><Icon name="alert-circle-outline" size={13} color={RED_ERR}/><Text style={st.errorText}>{errors.date}</Text></View>
              )}

              {/* Location */}
              <View style={st.fieldHeader}>
                <Text style={st.label}>Location / Venue <Text style={st.optional}>(optional)</Text></Text>
                <CharCounter current={location.length} max={LIMITS.location}/>
              </View>
              <TextInput
                style={[st.input, !!errors.location && touched.location && st.inputError]}
                placeholder="e.g. National Cricket Ground, Lahore"
                placeholderTextColor="#BBBBBB"
                value={location}
                onChangeText={v => setLocation(v.slice(0, LIMITS.location))}
                onBlur={() => touch('location')}
              />
              {!!errors.location && touched.location && (
                <View style={st.errorRow}><Icon name="alert-circle-outline" size={13} color={RED_ERR}/><Text style={st.errorText}>{errors.location}</Text></View>
              )}

              {/* Entry Fee */}
              <View style={st.fieldHeader}>
                <Text style={st.label}>Entry Fee (Rs.) <Text style={st.optional}>(optional)</Text></Text>
                <CharCounter current={entryFee.length} max={LIMITS.entryFee}/>
              </View>
              <View style={[st.input, st.inputRow, !!errors.entryFee && touched.entryFee && st.inputError]}>
                <Text style={st.currencyPrefix}>Rs.</Text>
                <TextInput
                  style={st.feeInput}
                  placeholder="0"
                  placeholderTextColor="#BBBBBB"
                  value={entryFee}
                  onChangeText={v => setEntryFee(v.replace(/[^0-9]/g,'').slice(0, LIMITS.entryFee))}
                  onBlur={() => touch('entryFee')}
                  keyboardType="numeric"
                />
                {(!entryFee || entryFee === '0') && (
                  <View style={st.freeBadge}><Text style={st.freeBadgeText}>FREE</Text></View>
                )}
              </View>
              {!!errors.entryFee && touched.entryFee && (
                <View style={st.errorRow}><Icon name="alert-circle-outline" size={13} color={RED_ERR}/><Text style={st.errorText}>{errors.entryFee}</Text></View>
              )}

              <View style={{ height: 16 }}/>
            </ScrollView>

            {/* Footer */}
            <View style={st.modalFooter}>
              <TouchableOpacity style={st.cancelFooterBtn} onPress={() => { if(!saving) setFormVisible(false); }}>
                <Text style={st.cancelFooterBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.submitBtn, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small"/> : (
                  <>
                    <Icon name={editingEvent ? 'checkmark-circle-outline' : 'cloud-upload-outline'} size={18} color="#fff"/>
                    <Text style={st.submitBtnText}>{editingEvent ? 'Save Changes' : 'Publish Event'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <Toast visible={toast.visible} message={toast.message} type={toast.type}/>
      </Modal>

      <CalendarPicker visible={calVisible} onClose={() => setCalVisible(false)} onSelect={d => { setDate(d); touch('date'); }}/>
      <Toast visible={toast.visible} message={toast.message} type={toast.type}/>
    </View>
  );
};

export default AdminEventsScreen;

// ── Styles ───────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop: Platform.OS==='ios'?56:20, paddingBottom:14, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:BORDER },
  headerTitle: { fontSize:20, fontWeight:'800', color:'#111' },
  headerSub:   { fontSize:12, color:'#999', marginTop:2 },
  createBtn:   { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:GREEN, paddingHorizontal:14, paddingVertical:9, borderRadius:10 },
  createBtnText:{ color:'#fff', fontWeight:'700', fontSize:14 },

  list: { padding:16, gap:14, paddingBottom:40 },
  empty:{ alignItems:'center', marginTop:80, gap:10 },
  emptyIcon:{ width:80, height:80, borderRadius:40, backgroundColor:'#E8F5EE', alignItems:'center', justifyContent:'center' },
  emptyText:   { fontSize:16, color:'#555', fontWeight:'700' },
  emptySubText:{ fontSize:13, color:'#AAA', textAlign:'center', paddingHorizontal:40 },

  // Card
  card: { backgroundColor:'#fff', borderRadius:16, overflow:'hidden', shadowColor:'#000', shadowOpacity:0.07, shadowOffset:{width:0,height:2}, shadowRadius:8, elevation:3 },
  cardBanner: { width:'100%', height:160 },
  cardBannerPlaceholder: { height:90, backgroundColor:'#E8F5EE', alignItems:'center', justifyContent:'center' },
  dateBadge: { position:'absolute', top:10, right:10, flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(10,143,60,0.85)', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  dateBadgeText: { color:'#fff', fontSize:11, fontWeight:'600' },
  cardBody:  { padding:14 },
  cardTopRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 },
  cardTitle: { fontSize:16, fontWeight:'800', color:'#111', flex:1 },
  cardActions:{ flexDirection:'row', gap:6, marginLeft:8 },
  actionBtn: { width:30, height:30, borderRadius:8, backgroundColor:'#F0F0F0', alignItems:'center', justifyContent:'center' },
  cardDesc:  { fontSize:13, color:'#666', lineHeight:18, marginBottom:10 },
  cardMeta:  { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 },
  metaChip:  { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#E8F5EE', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  metaText:  { fontSize:12, color:GREEN, fontWeight:'600' },
  feeChip:   { backgroundColor:'#FFF4E5' },
  feeText:   { fontSize:12, color:'#C47A00', fontWeight:'600' },
  freeChip:  { backgroundColor:'#E8F5EE' },
  freeText:  { fontSize:12, color:GREEN, fontWeight:'600' },
  viewDetailRow:{ flexDirection:'row', alignItems:'center', gap:2 },
  viewDetailText:{ fontSize:12, color:GREEN, fontWeight:'700' },

  // Detail modal
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  detailBox:   { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:'90%', paddingBottom:24 },
  modalHandle: { width:40, height:4, backgroundColor:'#E0E0E0', borderRadius:2, alignSelf:'center', marginTop:12, marginBottom:4 },
  detailBanner:{ width:'100%', height:220 },
  detailBannerPlaceholder:{ height:160, backgroundColor:'#E8F5EE', alignItems:'center', justifyContent:'center' },
  detailContent:{ padding:20 },
  detailDateBadge:{ flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', backgroundColor:'#E8F5EE', paddingHorizontal:12, paddingVertical:6, borderRadius:20, marginBottom:12 },
  detailDateText:{ fontSize:13, color:GREEN, fontWeight:'700' },
  detailTitle: { fontSize:22, fontWeight:'800', color:'#111', marginBottom:8 },
  detailDesc:  { fontSize:14, color:'#555', lineHeight:21 },
  detailDivider:{ height:1, backgroundColor:'#F0F0F0', marginVertical:16 },
  detailRow:   { flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 },
  detailIconWrap:{ width:40, height:40, borderRadius:12, backgroundColor:'#E8F5EE', alignItems:'center', justifyContent:'center' },
  detailLabel: { fontSize:11, color:'#AAA', fontWeight:'500' },
  detailValue: { fontSize:15, color:'#111', fontWeight:'700', marginTop:2 },
  detailActionRow:{ flexDirection:'row', gap:10, paddingHorizontal:20, paddingVertical:10, borderTopWidth:1, borderTopColor:BORDER },
  detailActionBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:12, borderWidth:1.5, borderColor:GREEN },
  detailActionText:{ fontSize:13, fontWeight:'700', color:GREEN },
  detailCloseBtn:{ marginHorizontal:20, marginTop:4, backgroundColor:GREEN, borderRadius:14, paddingVertical:14, alignItems:'center' },
  detailCloseBtnText:{ fontSize:15, fontWeight:'800', color:'#fff' },

  // Form modal
  modal:      { flex:1, backgroundColor:'#fff' },
  modalHeader:{ paddingTop:12, paddingHorizontal:20, paddingBottom:14, borderBottomWidth:1, borderBottomColor:BORDER },
  modalHandleBar:{ width:36, height:4, backgroundColor:'#E0E0E0', borderRadius:2, alignSelf:'center', marginBottom:14 },
  modalHeaderRow:{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between' },
  modalTitle:   { fontSize:20, fontWeight:'800', color:'#111' },
  modalSubtitle:{ fontSize:13, color:'#999', marginTop:2 },
  closeBtn:{ width:34, height:34, borderRadius:17, backgroundColor:'#F0F0F0', alignItems:'center', justifyContent:'center' },
  modalBody:{ padding:20, paddingBottom:24 },

  bannerPicker:{ borderWidth:1.5, borderColor:'#DDD', borderStyle:'dashed', borderRadius:14, overflow:'hidden', marginBottom:6 },
  bannerPreview:{ width:'100%', height:180 },
  bannerEditOverlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center' },
  bannerPlaceholder:{ height:140, alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#FAFAFA' },
  bannerIconCircle:{ width:56, height:56, borderRadius:28, backgroundColor:'#E8F5EE', alignItems:'center', justifyContent:'center', marginBottom:4 },
  bannerPlaceholderTitle:{ fontSize:14, color:'#444', fontWeight:'600' },
  bannerPlaceholderSub:{ fontSize:12, color:'#AAA' },
  removeBanner:{ flexDirection:'row', alignItems:'center', gap:4, alignSelf:'flex-end', marginBottom:4 },
  removeBannerText:{ fontSize:13, color:RED_ERR, fontWeight:'500' },

  fieldHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:18, marginBottom:7 },
  label:   { fontSize:13, fontWeight:'700', color:'#333', marginTop:18, marginBottom:7 },
  required:{ color:RED_ERR },
  optional:{ color:'#AAA', fontWeight:'400' },
  charCounter:    { fontSize:11, color:'#AAA' },
  charCounterOver:{ color:RED_ERR, fontWeight:'700' },

  input:{ borderWidth:1.5, borderColor:'#E8E8E8', borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:14, color:'#111', backgroundColor:'#FAFAFA' },
  inputError:{ borderColor:RED_ERR, backgroundColor:'#FFF5F5' },
  inputMulti:{ height:110, paddingTop:12, textAlignVertical:'top' },
  inputRow:{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:13 },
  inputRowText:{ flex:1, fontSize:14, color:'#111' },

  currencyPrefix:{ fontSize:14, color:'#555', fontWeight:'700', marginRight:4 },
  feeInput:{ flex:1, fontSize:14, color:'#111', padding:0 },
  freeBadge:{ backgroundColor:'#E8F5EE', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  freeBadgeText:{ fontSize:11, color:GREEN, fontWeight:'700' },

  errorRow:{ flexDirection:'row', alignItems:'center', gap:5, marginTop:5 },
  errorText:{ fontSize:12, color:RED_ERR, flex:1 },

  modalFooter:{ flexDirection:'row', gap:10, padding:16, paddingBottom: Platform.OS==='ios'?28:16, borderTopWidth:1, borderTopColor:BORDER, backgroundColor:'#fff' },
  cancelFooterBtn:{ flex:1, paddingVertical:14, borderRadius:12, borderWidth:1.5, borderColor:'#E0E0E0', alignItems:'center' },
  cancelFooterBtnText:{ color:'#666', fontWeight:'700', fontSize:14 },
  submitBtn:{ flex:2, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:GREEN, borderRadius:12, paddingVertical:14 },
  submitBtnText:{ color:'#fff', fontWeight:'800', fontSize:15 },
});

const cal = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center' },
  box:{ backgroundColor:'#fff', borderRadius:20, width:Dimensions.get('window').width-40, padding:20, elevation:20, shadowColor:'#000', shadowOpacity:0.2, shadowOffset:{width:0,height:8}, shadowRadius:20 },
  navRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  navBtn:{ width:36, height:36, borderRadius:18, backgroundColor:'#F0F0F0', alignItems:'center', justifyContent:'center' },
  monthTitle:{ fontSize:16, fontWeight:'800', color:'#111' },
  weekRow:{ flexDirection:'row', marginBottom:8 },
  weekDay:{ flex:1, textAlign:'center', fontSize:11, fontWeight:'700', color:'#AAA' },
  grid:{ flexDirection:'row', flexWrap:'wrap' },
  cell:{ width:`${100/7}%`, aspectRatio:1, alignItems:'center', justifyContent:'center', marginVertical:2 },
  cellText:{ fontSize:14, color:'#222' },
  todayCell:{ backgroundColor:GREEN, borderRadius:20 },
  todayText:{ color:'#fff', fontWeight:'800' },
  pastCell:{ opacity:0.3 },
  pastText:{ color:'#AAA' },
  closeBtn:{ marginTop:14, alignItems:'center', paddingVertical:12, borderTopWidth:1, borderTopColor:'#F0F0F0' },
  closeBtnText:{ fontSize:14, color:'#888', fontWeight:'600' },
});