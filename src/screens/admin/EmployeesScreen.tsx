import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Modal, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEmployees, addEmployee, updateEmployee, removeEmployee } from '../../store/slices/employeeSlice';
import { getEmployees, createEmployee, updateEmployee as updateEmployeeAPI, deleteEmployee } from '../../services/employeeService';

const BASE = 'http://192.168.100.4:5000/uploads/';
const { width: SW } = Dimensions.get('window');

// ─── Designations list ───────────────────────────────────────────────
const DESIGNATIONS = [
  'Head Coach', 'Assistant Coach', 'Batting Coach', 'Bowling Coach',
  'Fielding Coach', 'Fitness Trainer', 'Physiotherapist', 'Groundsman',
  'Manager', 'Scorer', 'Umpire', 'Security Guard', 'Receptionist', 'Other',
];

const STATUS_COLOR = { active: '#0A8F3C', inactive: '#EF4444' };
const STATUS_BG    = { active: '#F0FFF6', inactive: '#FEF2F2' };

// ─── Blank form ──────────────────────────────────────────────────────
const blankForm = () => ({
  name: '', designation: '', phone: '', email: '',
  salary: '', joinDate: '', address: '', status: 'active' as 'active' | 'inactive',
});

// ─── Avatar placeholder ──────────────────────────────────────────────
const Avatar = ({ photo, name, size = 48 }: { photo?: string; name: string; size?: number }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (photo) {
    return (
      <Image
        source={{ uri: BASE + photo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[av.text, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
};

const av = StyleSheet.create({
  circle: { backgroundColor: '#0A8F3C', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '800' },
});

// ─── Detail Modal ────────────────────────────────────────────────────
const DetailModal = ({
  employee, onClose, onEdit, onDelete,
}: { employee: any; onClose: () => void; onEdit: () => void; onDelete: () => void }) => {
  if (!employee) return null;
  const rows = [
    { icon: 'call-outline',      label: 'Phone',       value: employee.phone      || '—' },
    { icon: 'mail-outline',      label: 'Email',       value: employee.email      || '—' },
    { icon: 'cash-outline',      label: 'Salary',      value: employee.salary ? `₨ ${Number(employee.salary).toLocaleString()}` : '—' },
    { icon: 'calendar-outline',  label: 'Joined',      value: employee.joinDate   || '—' },
    { icon: 'location-outline',  label: 'Address',     value: employee.address    || '—' },
  ];

  return (
    <Modal visible={!!employee} transparent animationType="slide">
      <View style={dm.overlay}>
        <TouchableOpacity style={dm.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={dm.sheet}>
          <View style={dm.handle} />

          {/* Header */}
          <View style={dm.headerRow}>
            <Text style={dm.title}>Employee Details</Text>
            <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile */}
            <View style={dm.profileCard}>
              <Avatar photo={employee.photo} name={employee.name} size={72} />
              <View style={dm.profileInfo}>
                <Text style={dm.empName}>{employee.name}</Text>
                <View style={dm.desBadge}>
                  <Icon name="briefcase-outline" size={12} color="#0A8F3C" />
                  <Text style={dm.desText}>{employee.designation}</Text>
                </View>
                <View style={[dm.statusBadge, { backgroundColor: STATUS_BG[employee.status as 'active'|'inactive'] }]}>
                  <View style={[dm.statusDot, { backgroundColor: STATUS_COLOR[employee.status as 'active'|'inactive'] }]} />
                  <Text style={[dm.statusText, { color: STATUS_COLOR[employee.status as 'active'|'inactive'] }]}>
                    {employee.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info rows */}
            {rows.map(r => (
              <View key={r.label} style={dm.infoRow}>
                <View style={dm.infoIconBox}>
                  <Icon name={r.icon as any} size={16} color="#0A8F3C" />
                </View>
                <View style={dm.infoTextBox}>
                  <Text style={dm.infoLabel}>{r.label}</Text>
                  <Text style={dm.infoValue}>{r.value}</Text>
                </View>
              </View>
            ))}

            <Text style={dm.since}>
              Added on {new Date(employee.createdAt).toLocaleDateString()}
            </Text>
          </ScrollView>

          {/* Actions */}
          <View style={dm.actions}>
            <TouchableOpacity style={dm.deleteBtn} onPress={onDelete}>
              <Icon name="trash-outline" size={16} color="#EF4444" />
              <Text style={dm.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dm.editBtn} onPress={onEdit}>
              <Icon name="create-outline" size={16} color="#fff" />
              <Text style={dm.editText}>Edit Employee</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Add / Edit Form Modal ───────────────────────────────────────────
const FormModal = ({
  visible, onClose, onSubmit, initial, loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: any, photoAsset: any) => void;
  initial: any;
  loading: boolean;
}) => {
  const [form, setForm]           = useState(blankForm());
  const [photoAsset, setPhotoAsset] = useState<any>(null);
  const [showDesig, setShowDesig] = useState(false);

  // sync when initial changes (edit mode)
  useEffect(() => {
    if (initial) {
      setForm({
        name:        initial.name        || '',
        designation: initial.designation || '',
        phone:       initial.phone       || '',
        email:       initial.email       || '',
        salary:      initial.salary ? String(initial.salary) : '',
        joinDate:    initial.joinDate    || '',
        address:     initial.address     || '',
        status:      initial.status      || 'active',
      });
      setPhotoAsset(null);
    } else {
      setForm(blankForm());
      setPhotoAsset(null);
    }
  }, [initial, visible]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (!res.didCancel && res.assets?.[0]) setPhotoAsset(res.assets[0]);
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim())        return Alert.alert('Validation', 'Name is required');
    if (!form.designation.trim()) return Alert.alert('Validation', 'Designation is required');
    onSubmit(form, photoAsset);
  };

  const isEdit = !!initial;
  const photoUri = photoAsset?.uri || (initial?.photo ? BASE + initial.photo : null);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={fm.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={fm.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={fm.sheet}>
          <View style={fm.handle} />
          <View style={fm.headerRow}>
            <Text style={fm.title}>{isEdit ? 'Edit Employee' : 'Add Employee'}</Text>
            <TouchableOpacity style={fm.closeBtn} onPress={onClose}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Photo picker */}
            <TouchableOpacity style={fm.photoPicker} onPress={pickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={fm.photoImg} resizeMode="cover" />
              ) : (
                <View style={fm.photoPlaceholder}>
                  <Icon name="camera-outline" size={28} color="#0A8F3C" />
                  <Text style={fm.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={fm.photoEditBadge}>
                <Icon name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Name */}
            <Text style={fm.label}>Full Name <Text style={fm.req}>*</Text></Text>
            <View style={fm.inputWrap}>
              <Icon name="person-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <TextInput
                style={fm.input}
                placeholder="e.g. Ahmed Raza"
                placeholderTextColor="#CCC"
                value={form.name}
                onChangeText={v => set('name', v)}
              />
            </View>

            {/* Designation */}
            <Text style={fm.label}>Designation <Text style={fm.req}>*</Text></Text>
            <TouchableOpacity style={fm.inputWrap} onPress={() => setShowDesig(true)}>
              <Icon name="briefcase-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <Text style={[fm.input, !form.designation && { color: '#CCC' }]}>
                {form.designation || 'Select designation'}
              </Text>
              <Icon name="chevron-down" size={14} color="#AAA" />
            </TouchableOpacity>

            {/* Designation picker */}
            {showDesig && (
              <View style={fm.desigList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {DESIGNATIONS.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[fm.desigItem, form.designation === d && fm.desigItemActive]}
                      onPress={() => { set('designation', d); setShowDesig(false); }}
                    >
                      <Text style={[fm.desigItemText, form.designation === d && fm.desigItemTextActive]}>{d}</Text>
                      {form.designation === d && <Icon name="checkmark" size={14} color="#0A8F3C" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Phone */}
            <Text style={fm.label}>Phone Number</Text>
            <View style={fm.inputWrap}>
              <Icon name="call-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <TextInput
                style={fm.input}
                placeholder="03xx-xxxxxxx"
                placeholderTextColor="#CCC"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => set('phone', v)}
              />
            </View>

            {/* Email */}
            <Text style={fm.label}>Email Address</Text>
            <View style={fm.inputWrap}>
              <Icon name="mail-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <TextInput
                style={fm.input}
                placeholder="email@example.com"
                placeholderTextColor="#CCC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={v => set('email', v)}
              />
            </View>

            {/* Salary */}
            <Text style={fm.label}>Monthly Salary (₨)</Text>
            <View style={fm.inputWrap}>
              <Icon name="cash-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <TextInput
                style={fm.input}
                placeholder="e.g. 25000"
                placeholderTextColor="#CCC"
                keyboardType="numeric"
                value={form.salary}
                onChangeText={v => set('salary', v)}
              />
            </View>

            {/* Join Date */}
            <Text style={fm.label}>Join Date</Text>
            <View style={fm.inputWrap}>
              <Icon name="calendar-outline" size={16} color="#AAA" style={fm.inputIcon} />
              <TextInput
                style={fm.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#CCC"
                value={form.joinDate}
                onChangeText={v => set('joinDate', v)}
              />
            </View>

            {/* Address */}
            <Text style={fm.label}>Address</Text>
            <View style={[fm.inputWrap, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <Icon name="location-outline" size={16} color="#AAA" style={[fm.inputIcon, { marginTop: 2 }]} />
              <TextInput
                style={[fm.input, { minHeight: 70 }]}
                placeholder="Home address..."
                placeholderTextColor="#CCC"
                multiline
                textAlignVertical="top"
                value={form.address}
                onChangeText={v => set('address', v)}
              />
            </View>

            {/* Status toggle */}
            <Text style={fm.label}>Status</Text>
            <View style={fm.statusRow}>
              {(['active', 'inactive'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[fm.statusBtn, form.status === s && (s === 'active' ? fm.statusBtnActive : fm.statusBtnInactive)]}
                  onPress={() => set('status', s)}
                >
                  <View style={[fm.statusDot, { backgroundColor: form.status === s ? STATUS_COLOR[s] : '#CCC' }]} />
                  <Text style={[fm.statusBtnText, form.status === s && { color: STATUS_COLOR[s], fontWeight: '700' }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity style={fm.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Icon name={isEdit ? 'save-outline' : 'person-add-outline'} size={18} color="#fff" />
                  <Text style={fm.submitText}>{isEdit ? 'Save Changes' : 'Add Employee'}</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────
const EmployeesScreen = () => {
  const dispatch   = useDispatch();
  const employees  = useSelector((state: RootState) => state.employee.employees);

  const [loading, setLoading]           = useState(false);
  const [formLoading, setFormLoading]   = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<any>(null);
  const [detailEmp, setDetailEmp]       = useState<any>(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadEmployees();
    socket.on('employeeCreated', (e: any) => dispatch(addEmployee(e)));
    socket.on('employeeUpdated', (e: any) => dispatch(updateEmployee(e)));
    socket.on('employeeDeleted', (id: string) => dispatch(removeEmployee(id)));
    return () => {
      socket.off('employeeCreated');
      socket.off('employeeUpdated');
      socket.off('employeeDeleted');
    };
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      dispatch(setEmployees(data));
    } catch { }
    finally { setLoading(false); }
  };

  // ── filtered list ──
  const filtered = employees.filter(e => {
    const matchSearch = !search.trim() ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Submit add or edit ──
  const handleSubmit = async (form: any, photoAsset: any) => {
    setFormLoading(true);
    try {
      const fd = new FormData() as any;
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoAsset) {
        fd.append('photo', {
          uri:  photoAsset.uri,
          name: photoAsset.fileName || 'photo.jpg',
          type: photoAsset.type     || 'image/jpeg',
        });
      }

      if (editTarget) {
        await updateEmployeeAPI(editTarget._id, fd);
      } else {
        await createEmployee(fd);
      }

      setShowForm(false);
      setEditTarget(null);
    } catch {
      Alert.alert('Error', 'Failed to save employee');
    } finally { setFormLoading(false); }
  };

  // ── Delete ──
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteEmployee(id);
              setDetailEmp(null);
            } catch {
              Alert.alert('Error', 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  // ── counts ──
  const counts = {
    all:      employees.length,
    active:   employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  };

  const renderCard = ({ item }: any) => (
    <TouchableOpacity style={s.card} onPress={() => setDetailEmp(item)} activeOpacity={0.88}>
      <Avatar photo={item.photo} name={item.name} size={50} />
      <View style={s.cardBody}>
        <Text style={s.cardName}>{item.name}</Text>
        <View style={s.cardDesRow}>
          <Icon name="briefcase-outline" size={12} color="#888" />
          <Text style={s.cardDes}>{item.designation}</Text>
        </View>
        {!!item.phone && (
          <View style={s.cardPhoneRow}>
            <Icon name="call-outline" size={11} color="#BBB" />
            <Text style={s.cardPhone}>{item.phone}</Text>
          </View>
        )}
      </View>
      <View style={s.cardRight}>
        <View style={[s.statusPill, { backgroundColor: STATUS_BG[item.status as 'active'] }]}>
          <View style={[s.statusDotSm, { backgroundColor: STATUS_COLOR[item.status as 'active'] }]} />
          <Text style={[s.statusPillText, { color: STATUS_COLOR[item.status as 'active'] }]}>
            {item.status}
          </Text>
        </View>
        <TouchableOpacity
          style={s.editIconBtn}
          onPress={() => { setEditTarget(item); setShowForm(true); }}
        >
          <Icon name="create-outline" size={16} color="#0A8F3C" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Employees</Text>
          <Text style={s.headerSub}>{counts.active} active · {counts.inactive} inactive</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditTarget(null); setShowForm(true); }}>
          <Icon name="person-add-outline" size={16} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <Icon name="search-outline" size={16} color="#AAA" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or designation..."
          placeholderTextColor="#CCC"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Status filter ── */}
      <View style={s.filterRow}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filterStatus === f && s.filterTabActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[s.filterText, filterStatus === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            <View style={[s.badge, filterStatus === f && s.badgeActive]}>
              <Text style={[s.badgeText, filterStatus === f && s.badgeTextActive]}>
                {counts[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {loading
        ? <ActivityIndicator style={{ marginTop: 60 }} color="#0A8F3C" size="large" />
        : (
          <FlatList
            data={filtered}
            keyExtractor={i => i._id}
            contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={s.empty}>
                <Icon name="people-outline" size={52} color="#DDD" />
                <Text style={s.emptyTitle}>No employees found</Text>
                <Text style={s.emptySubtitle}>
                  {search ? `No results for "${search}"` : 'Tap Add to create your first employee'}
                </Text>
              </View>
            )}
            renderItem={renderCard}
          />
        )
      }

      {/* ── Detail Modal ── */}
      <DetailModal
        employee={detailEmp}
        onClose={() => setDetailEmp(null)}
        onEdit={() => { setEditTarget(detailEmp); setDetailEmp(null); setShowForm(true); }}
        onDelete={() => handleDelete(detailEmp._id, detailEmp.name)}
      />

      {/* ── Form Modal ── */}
      <FormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        initial={editTarget}
        loading={formLoading}
      />
    </View>
  );
};

export default EmployeesScreen;

// ─── Detail Modal Styles ─────────────────────────────────────────────
const dm = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  handle:      { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:       { fontSize: 18, fontWeight: '800', color: '#111' },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginBottom: 16 },
  profileInfo: { flex: 1, gap: 6 },
  empName:     { fontSize: 18, fontWeight: '800', color: '#111' },
  desBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  desText:     { fontSize: 13, color: '#0A8F3C', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0FFF6', alignItems: 'center', justifyContent: 'center' },
  infoTextBox: { flex: 1 },
  infoLabel:   { fontSize: 11, color: '#AAA', fontWeight: '500' },
  infoValue:   { fontSize: 14, color: '#111', fontWeight: '600', marginTop: 1 },
  since:       { fontSize: 11, color: '#CCC', textAlign: 'center', marginVertical: 16 },
  actions:     { flexDirection: 'row', gap: 10, marginTop: 14 },
  deleteBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#EF4444' },
  deleteText:  { color: '#EF4444', fontWeight: '700' },
  editBtn:     { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 12, backgroundColor: '#0A8F3C' },
  editText:    { color: '#fff', fontWeight: '700' },
});

// ─── Form Modal Styles ───────────────────────────────────────────────
const fm = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '95%' },
  handle:      { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:       { fontSize: 18, fontWeight: '800', color: '#111' },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  photoPicker: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  photoImg:    { width: 90, height: 90, borderRadius: 45 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F0FFF6', borderWidth: 2, borderColor: '#0A8F3C', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPlaceholderText: { fontSize: 11, color: '#0A8F3C', fontWeight: '600' },
  photoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#0A8F3C', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  label:       { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  req:         { color: '#EF4444' },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, borderWidth: 1.5, borderColor: '#EFEFEF', paddingHorizontal: 12, minHeight: 48 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, fontSize: 14, color: '#111', paddingVertical: 10 },

  desigList:   { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#EFEFEF', marginTop: 4, elevation: 4 },
  desigItem:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  desigItemActive: { backgroundColor: '#F0FFF6' },
  desigItemText:   { fontSize: 14, color: '#333' },
  desigItemTextActive: { color: '#0A8F3C', fontWeight: '700' },

  statusRow:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  statusBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#EFEFEF' },
  statusBtnActive:   { borderColor: '#0A8F3C', backgroundColor: '#F0FFF6' },
  statusBtnInactive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusBtnText: { fontSize: 14, color: '#888' },

  submitBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0A8F3C', borderRadius: 14, padding: 16, marginTop: 16 },
  submitText:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── Main Screen Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F6F7FB' },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  headerSub:   { fontSize: 12, color: '#888', marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0A8F3C', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 12, marginBottom: 4, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#EFEFEF', paddingHorizontal: 12, height: 46 },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },

  filterRow:   { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: '#fff', marginBottom: 4 },
  filterTab:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterTabActive: { backgroundColor: '#0A8F3C' },
  filterText:  { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  badge:       { backgroundColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  badgeText:   { fontSize: 11, fontWeight: '700', color: '#666' },
  badgeTextActive: { color: '#fff' },

  card:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardBody:    { flex: 1, gap: 3 },
  cardName:    { fontSize: 15, fontWeight: '700', color: '#111' },
  cardDesRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDes:     { fontSize: 12, color: '#888' },
  cardPhoneRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardPhone:   { fontSize: 11, color: '#BBB' },
  cardRight:   { alignItems: 'flex-end', gap: 8 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDotSm: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  editIconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0FFF6', alignItems: 'center', justifyContent: 'center' },

  empty:        { alignItems: 'center', marginTop: 70, paddingHorizontal: 30 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: '#CCC', marginTop: 14 },
  emptySubtitle:{ fontSize: 13, color: '#DDD', marginTop: 6, textAlign: 'center', lineHeight: 18 },
});